using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;

namespace Veridyn.Infrastructure.Services;

public class RuleBasedRiskEngine
{
    public (double DelayProbability, RiskLevel RiskLevel, List<RiskFactorExplanationDto> Factors) Evaluate(TaskItem task, ProgressEvidenceScoreResultDto evidence)
    {
        var factors = new List<RiskFactorExplanationDto>();
        double riskScore = 0.0;
        DateTime now = DateTime.UtcNow;

        if (task.Status == TaskItemStatus.Completed)
        {
            return (0.0, RiskLevel.Low, new List<RiskFactorExplanationDto>
            {
                new() { Factor = "Task Completed", Severity = "Low", ImpactScore = 0, Details = "Task is completed successfully.", Category = "Schedule" }
            });
        }

        // Schedule & Deadline Analysis
        double remainingDays = (task.DueDate - now).TotalDays;
        if (remainingDays < 0)
        {
            double daysOverdue = Math.Abs(remainingDays);
            double impact = Math.Min(35.0 + (daysOverdue * 3.0), 50.0);
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Task is Overdue",
                Severity = daysOverdue > 5 ? "Critical" : "High",
                ImpactScore = impact,
                Details = $"Task is overdue by {daysOverdue:F1} days with {task.ProgressPercentage:F0}% reported progress.",
                Category = "Schedule"
            });
        }
        else if (remainingDays <= 3 && task.ProgressPercentage < 60.0)
        {
            double impact = 25.0;
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Imminent Deadline with Low Progress",
                Severity = "High",
                ImpactScore = impact,
                Details = $"Due in {remainingDays:F1} days but reported progress is only {task.ProgressPercentage:F0}%.",
                Category = "Schedule"
            });
        }

        // Stalled Task Penalty
        if (evidence.IsPotentiallyStalled)
        {
            double impact = 30.0;
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Potentially Stalled Task",
                Severity = "High",
                ImpactScore = impact,
                Details = evidence.StallReason,
                Category = "Evidence"
            });
        }

        // Evidence Score vs Reported Progress Discrepancy
        double evidenceGap = task.ProgressPercentage - evidence.EvidenceScore;
        if (evidenceGap > 30.0 && task.ProgressPercentage > 20.0)
        {
            double impact = 18.0;
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Evidence-Progress Divergence",
                Severity = "Medium",
                ImpactScore = impact,
                Details = $"Reported progress ({task.ProgressPercentage:F0}%) exceeds verified evidence ({evidence.EvidenceScore:F0}%) by {evidenceGap:F0} points.",
                Category = "Evidence"
            });
        }

        // Hours Overrun Analysis
        if (task.EstimatedHours > 0 && task.ActualHours > task.EstimatedHours)
        {
            double overrunPercent = ((task.ActualHours - task.EstimatedHours) / task.EstimatedHours) * 100.0;
            double impact = Math.Min(overrunPercent * 0.4, 25.0);
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Budgeted Hours Overrun",
                Severity = overrunPercent > 40 ? "High" : "Medium",
                ImpactScore = impact,
                Details = $"Logged {task.ActualHours:F1}h against {task.EstimatedHours:F1}h estimated ({overrunPercent:F0}% overrun).",
                Category = "WorkLog"
            });
        }

        // Blocked Dependencies
        var dependencies = task.Dependencies ?? new List<TaskDependency>();
        var blockedDeps = dependencies.Where(d => d.IsBlocking && d.DependsOnTask != null && d.DependsOnTask.Status != TaskItemStatus.Completed).ToList();
        if (blockedDeps.Any())
        {
            double impact = Math.Min(blockedDeps.Count * 15.0, 30.0);
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Unresolved Predecessor Blockers",
                Severity = blockedDeps.Count > 1 ? "Critical" : "High",
                ImpactScore = impact,
                Details = $"Blocked by {blockedDeps.Count} predecessor task(s): {string.Join(", ", blockedDeps.Select(d => d.DependsOnTask?.TaskCode))}.",
                Category = "Dependencies"
            });
        }

        // Priority & Complexity Multiplier
        if (task.Priority == PriorityLevel.Critical && riskScore > 15.0)
        {
            double impact = 10.0;
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "Critical Priority Task",
                Severity = "Medium",
                ImpactScore = impact,
                Details = "Critical priority tasks amplify delivery and organizational impact if delayed.",
                Category = "General"
            });
        }
        else if (task.ComplexityPoints >= 8 && remainingDays < 5 && task.ProgressPercentage < 50)
        {
            double impact = 12.0;
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "High Complexity with Low Remaining Time",
                Severity = "Medium",
                ImpactScore = impact,
                Details = $"Complexity rating {task.ComplexityPoints}/10 requires significant remaining effort.",
                Category = "General"
            });
        }

        // Absence of GitHub Activity
        int commitCount = task.GitHubCommits?.Count ?? 0;
        if (commitCount == 0 && task.Status == TaskItemStatus.InProgress && (now - task.StartDate).TotalDays > 3)
        {
            double impact = 10.0;
            riskScore += impact;
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "No Associated GitHub Commits",
                Severity = "Low",
                ImpactScore = impact,
                Details = "No commit evidence tracked yet. Task may be in local development, design, or awaiting code push.",
                Category = "GitHub"
            });
        }

        double delayProbability = Math.Round(Math.Clamp(riskScore, 0.0, 100.0), 1);
        RiskLevel riskLevel = delayProbability switch
        {
            >= 70.0 => RiskLevel.Critical,
            >= 45.0 => RiskLevel.High,
            >= 20.0 => RiskLevel.Medium,
            _ => RiskLevel.Low
        };

        if (!factors.Any())
        {
            factors.Add(new RiskFactorExplanationDto
            {
                Factor = "On Track",
                Severity = "Low",
                ImpactScore = 0,
                Details = "Task is progressing smoothly according to schedule and evidence indicators.",
                Category = "General"
            });
        }

        return (delayProbability, riskLevel, factors);
    }
}
