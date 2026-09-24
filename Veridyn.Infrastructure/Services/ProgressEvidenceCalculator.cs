using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;
using Veridyn.Core.Interfaces;

namespace Veridyn.Infrastructure.Services;

public class ProgressEvidenceCalculator : IProgressEvidenceCalculator
{
    public ProgressEvidenceScoreResultDto CalculateEvidence(TaskItem task)
    {
        var result = new ProgressEvidenceScoreResultDto
        {
            TaskItemId = task.Id,
            TaskCode = task.TaskCode,
            ReportedProgress = task.ProgressPercentage
        };

        if (task.Status == TaskItemStatus.Completed)
        {
            result.EvidenceScore = 100.0;
            result.IsPotentiallyStalled = false;
            result.EvidenceFindings.Add("Task is marked Completed with all deliverables confirmed.");
            return result;
        }

        if (task.Status == TaskItemStatus.Cancelled)
        {
            result.EvidenceScore = 0.0;
            result.IsPotentiallyStalled = false;
            result.EvidenceFindings.Add("Task is Cancelled.");
            return result;
        }

        // Subtask completion score (Weight: 25%)
        double subtaskScore = 0.0;
        if (task.Subtasks != null && task.Subtasks.Count > 0)
        {
            int completedSubtasks = task.Subtasks.Count(s => s.IsCompleted);
            subtaskScore = (double)completedSubtasks / task.Subtasks.Count * 100.0;
            result.SubtaskEvidenceWeight = subtaskScore * 0.25;
            result.EvidenceFindings.Add($"Subtasks: {completedSubtasks}/{task.Subtasks.Count} completed ({subtaskScore:F0}%).");
        }
        else
        {
            subtaskScore = task.ProgressPercentage;
            result.SubtaskEvidenceWeight = subtaskScore * 0.25;
        }

        // GitHub Activity score (Weight: 30%)
        double githubScore = 0.0;
        var commits = task.GitHubCommits ?? new List<GitHubCommit>();
        var prs = task.PullRequests ?? new List<GitHubPullRequest>();
        int totalCommits = commits.Count;
        int totalPrs = prs.Count;

        DateTime now = DateTime.UtcNow;
        var recentCommits = commits.Where(c => (now - c.CommitDate).TotalDays <= 7).ToList();

        if (totalCommits > 0 || totalPrs > 0)
        {
            double commitFactor = Math.Min(totalCommits * 20.0, 70.0);
            double prFactor = totalPrs > 0 ? 30.0 : 0.0;
            double recencyBonus = recentCommits.Any() ? 10.0 : 0.0;
            githubScore = Math.Min(commitFactor + prFactor + recencyBonus, 100.0);
            result.EvidenceFindings.Add($"GitHub Evidence: {totalCommits} commits ({recentCommits.Count} recent in last 7d), {totalPrs} PRs.");
        }
        else
        {
            githubScore = 0.0;
            result.EvidenceFindings.Add("No GitHub commits or pull requests linked to this task.");
        }
        result.CommitEvidenceWeight = githubScore * 0.30;

        // Work Log & Time Investment score (Weight: 25%)
        double workLogScore = 0.0;
        var logs = task.WorkLogs ?? new List<WorkLog>();
        double totalLoggedHours = logs.Sum(w => w.HoursSpent);
        var recentLogs = logs.Where(w => (now - w.WorkDate).TotalDays <= 7).ToList();

        if (task.EstimatedHours > 0)
        {
            double hoursRatio = totalLoggedHours / task.EstimatedHours;
            if (hoursRatio >= 0.1)
            {
                workLogScore = Math.Min(hoursRatio * 100.0, 100.0);
                if (recentLogs.Any()) workLogScore = Math.Min(workLogScore + 10.0, 100.0);
            }
        }
        else if (totalLoggedHours > 0)
        {
            workLogScore = 75.0;
        }

        result.WorkLogEvidenceWeight = workLogScore * 0.25;
        result.EvidenceFindings.Add($"Work Logs: {totalLoggedHours:F1}h logged out of {task.EstimatedHours:F1}h estimated ({logs.Count} entries).");

        // Dependencies Blocked penalty (Weight: 20%)
        double dependencyScore = 100.0;
        var dependencies = task.Dependencies ?? new List<TaskDependency>();
        var blockedDeps = dependencies.Where(d => d.IsBlocking && d.DependsOnTask != null && d.DependsOnTask.Status != TaskItemStatus.Completed).ToList();

        if (blockedDeps.Any())
        {
            dependencyScore = Math.Max(0.0, 100.0 - (blockedDeps.Count * 40.0));
            result.EvidenceFindings.Add($"Dependencies: Blocked by {blockedDeps.Count} uncompleted predecessor tasks ({string.Join(", ", blockedDeps.Select(d => d.DependsOnTask?.TaskCode ?? "Unknown"))}).");
        }
        else
        {
            dependencyScore = 100.0;
            if (dependencies.Any())
            {
                result.EvidenceFindings.Add("All predecessor dependencies are satisfied.");
            }
        }
        result.DependencyEvidenceWeight = dependencyScore * 0.20;

        // Total Synthesized Progress Evidence Score
        double compositeScore = result.SubtaskEvidenceWeight + result.CommitEvidenceWeight + result.WorkLogEvidenceWeight + result.DependencyEvidenceWeight;
        result.EvidenceScore = Math.Round(Math.Clamp(compositeScore, 0.0, 100.0), 1);

        // Schedule Pace Ratio
        double totalDurationDays = Math.Max(1.0, (task.DueDate - task.StartDate).TotalDays);
        double elapsedDays = Math.Max(0.0, (now - task.StartDate).TotalDays);
        double timeConsumedRatio = Math.Clamp(elapsedDays / totalDurationDays, 0.0, 2.0);
        result.SchedulePaceRatio = Math.Round(timeConsumedRatio, 2);

        // Stalled Task detection
        bool isInProgress = task.Status == TaskItemStatus.InProgress;
        bool noRecentActivity = !recentCommits.Any() && !recentLogs.Any();
        bool progressMismatch = task.ProgressPercentage >= 30.0 && result.EvidenceScore < 25.0;
        bool deadlineApproaching = (task.DueDate - now).TotalDays <= 3;
        bool overdue = now > task.DueDate;
        bool hasBlockedDependencies = blockedDeps.Any();

        if (isInProgress && ((noRecentActivity && (deadlineApproaching || overdue || hasBlockedDependencies)) || progressMismatch))
        {
            result.IsPotentiallyStalled = true;
            var reasons = new List<string>();
            if (noRecentActivity) reasons.Add("Zero commits or work logs in the last 7 days");
            if (hasBlockedDependencies) reasons.Add($"Blocked by {blockedDeps.Count} predecessor task(s)");
            if (overdue) reasons.Add("Passed due date without sufficient progress evidence");
            else if (deadlineApproaching) reasons.Add("Due date within 3 days without active development");
            if (progressMismatch) reasons.Add($"Reported progress ({task.ProgressPercentage}%) significantly exceeds objective evidence ({result.EvidenceScore}%)");

            result.StallReason = string.Join("; ", reasons);
            result.EvidenceFindings.Add($"FLAGGED AS POTENTIALLY STALLED: {result.StallReason}");
        }
        else
        {
            result.IsPotentiallyStalled = false;
        }

        return result;
    }
}
