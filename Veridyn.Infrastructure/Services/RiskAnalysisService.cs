using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.Infrastructure.Services;

public class RiskAnalysisService : IRiskAnalysisService
{
    private readonly ApplicationDbContext _context;
    private readonly IProgressEvidenceCalculator _evidenceCalculator;
    private readonly RuleBasedRiskEngine _ruleEngine;
    private readonly IMlPredictionService _mlService;
    private readonly IAuditService _auditService;

    public RiskAnalysisService(
        ApplicationDbContext context,
        IProgressEvidenceCalculator evidenceCalculator,
        RuleBasedRiskEngine ruleEngine,
        IMlPredictionService mlService,
        IAuditService auditService)
    {
        _context = context;
        _evidenceCalculator = evidenceCalculator;
        _ruleEngine = ruleEngine;
        _mlService = mlService;
        _auditService = auditService;
    }

    public async Task<RiskAssessmentDto> EvaluateTaskRiskAsync(int taskId, CancellationToken cancellationToken = default)
    {
        var task = await _context.TaskItems
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.Subtasks)
            .Include(t => t.WorkLogs)
            .Include(t => t.GitHubCommits)
            .Include(t => t.PullRequests)
            .Include(t => t.Dependencies).ThenInclude(d => d.DependsOnTask)
            .FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);

        if (task == null)
        {
            throw new KeyNotFoundException($"Task with ID {taskId} was not found.");
        }

        var evidence = _evidenceCalculator.CalculateEvidence(task);
        var (ruleDelayProb, ruleRiskLevel, factors) = _ruleEngine.Evaluate(task, evidence);
        var mlResult = await _mlService.PredictTaskDelayAsync(task, evidence.EvidenceScore, cancellationToken);

        double hybridDelayProbability;
        string calculationMethod;

        if (mlResult.IsMlModelAvailable)
        {
            hybridDelayProbability = Math.Round((ruleDelayProb * 0.6) + (mlResult.DelayProbability * 0.4), 1);
            calculationMethod = "Hybrid (Rules + Scikit-Learn)";
        }
        else
        {
            hybridDelayProbability = ruleDelayProb;
            calculationMethod = "Rule-Based + Neural Weights";
        }

        RiskLevel finalRiskLevel = hybridDelayProbability switch
        {
            >= 70.0 => RiskLevel.Critical,
            >= 45.0 => RiskLevel.High,
            >= 20.0 => RiskLevel.Medium,
            _ => RiskLevel.Low
        };

        task.ProgressEvidenceScore = evidence.EvidenceScore;
        task.IsPotentiallyStalled = evidence.IsPotentiallyStalled;
        task.LatestRiskLevel = finalRiskLevel;
        task.LatestDelayProbability = hybridDelayProbability;
        task.RiskExplanationSummary = factors.FirstOrDefault()?.Details ?? "Evaluated successfully";
        task.LastEvaluatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;

        string factorsJson = JsonSerializer.Serialize(factors);

        var assessment = new RiskAssessment
        {
            TaskItemId = task.Id,
            ProjectId = task.ProjectId,
            AssessmentDate = DateTime.UtcNow,
            ProgressEvidenceScore = evidence.EvidenceScore,
            IsPotentiallyStalled = evidence.IsPotentiallyStalled,
            DelayProbability = hybridDelayProbability,
            RiskLevel = finalRiskLevel,
            RuleBasedScore = ruleDelayProb,
            MlPredictedScore = mlResult.DelayProbability,
            CalculationMethod = calculationMethod,
            RiskFactorsExplanationJson = factorsJson,
            EvaluatedBy = "Veridyn Intelligent Risk Engine"
        };

        _context.RiskAssessments.Add(assessment);
        await _context.SaveChangesAsync(cancellationToken);

        if ((finalRiskLevel == RiskLevel.Critical || evidence.IsPotentiallyStalled) && !string.IsNullOrEmpty(task.AssigneeId))
        {
            string alertTitle = evidence.IsPotentiallyStalled ? $"Stall Warning: {task.TaskCode}" : $"High Risk Alert: {task.TaskCode}";
            string alertMsg = evidence.IsPotentiallyStalled ? evidence.StallReason : $"Delay probability has risen to {hybridDelayProbability}%.";
            await _auditService.CreateNotificationAsync(
                task.AssigneeId,
                alertTitle,
                alertMsg,
                evidence.IsPotentiallyStalled ? NotificationType.StallWarning : NotificationType.RiskAlert,
                $"/tasks/{task.Id}"
            );
        }

        return new RiskAssessmentDto
        {
            Id = assessment.Id,
            TaskItemId = task.Id,
            TaskCode = task.TaskCode,
            TaskTitle = task.Title,
            ProjectId = task.ProjectId,
            ProjectName = task.Project?.Name,
            AssessmentDate = assessment.AssessmentDate,
            ProgressEvidenceScore = evidence.EvidenceScore,
            IsPotentiallyStalled = evidence.IsPotentiallyStalled,
            DelayProbability = hybridDelayProbability,
            RiskLevel = finalRiskLevel,
            RuleBasedScore = ruleDelayProb,
            MlPredictedScore = mlResult.DelayProbability,
            CalculationMethod = calculationMethod,
            RiskFactors = factors,
            EvaluatedBy = assessment.EvaluatedBy
        };
    }

    public async Task<List<RiskAssessmentDto>> EvaluateProjectRiskAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var tasks = await _context.TaskItems
            .Where(t => t.ProjectId == projectId)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        var results = new List<RiskAssessmentDto>();
        foreach (var taskId in tasks)
        {
            var assessment = await EvaluateTaskRiskAsync(taskId, cancellationToken);
            results.Add(assessment);
        }

        return results;
    }

    public async Task<DashboardOverviewDto> GetDashboardOverviewAsync(string? userId = null, CancellationToken cancellationToken = default)
    {
        var projectsQuery = _context.Projects.Include(p => p.Members).AsQueryable();
        var tasksQuery = _context.TaskItems
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.Subtasks)
            .Include(t => t.GitHubCommits)
            .Include(t => t.PullRequests)
            .Include(t => t.Dependencies).ThenInclude(d => d.DependsOnTask)
            .AsQueryable();

        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
            if (user != null && user.Role == UserRoleType.Developer)
            {
                tasksQuery = tasksQuery.Where(t => t.AssigneeId == userId);
            }
            else if (user != null && user.Role == UserRoleType.ProjectManager)
            {
                var managedProjectIds = await _context.ProjectMembers
                    .Where(pm => pm.UserId == userId)
                    .Select(pm => pm.ProjectId)
                    .ToListAsync(cancellationToken);
                
                projectsQuery = projectsQuery.Where(p => managedProjectIds.Contains(p.Id));
                tasksQuery = tasksQuery.Where(t => managedProjectIds.Contains(t.ProjectId));
            }
        }

        var projects = await projectsQuery.ToListAsync(cancellationToken);
        var tasks = await tasksQuery.ToListAsync(cancellationToken);
        var totalCommits = await _context.GitHubCommits.CountAsync(cancellationToken);
        var totalWorklogs = await _context.WorkLogs.CountAsync(cancellationToken);

        int totalTasksCount = tasks.Count;
        int inProgressTasksCount = tasks.Count(t => t.Status == TaskItemStatus.InProgress);
        int completedTasksCount = tasks.Count(t => t.Status == TaskItemStatus.Completed);
        int stalledCount = tasks.Count(t => t.IsPotentiallyStalled);
        int highRiskCount = tasks.Count(t => t.LatestRiskLevel == RiskLevel.High || t.LatestRiskLevel == RiskLevel.Critical);

        double avgEvidence = totalTasksCount > 0 ? tasks.Average(t => t.ProgressEvidenceScore) : 0.0;
        double overallDelayRisk = totalTasksCount > 0 ? tasks.Average(t => t.LatestDelayProbability) : 0.0;

        var criticalAndStalled = tasks
            .Where(t => t.IsPotentiallyStalled || t.LatestRiskLevel == RiskLevel.High || t.LatestRiskLevel == RiskLevel.Critical)
            .OrderByDescending(t => t.LatestDelayProbability)
            .Take(6)
            .Select(t => new TaskSummaryDto
            {
                Id = t.Id,
                TaskCode = t.TaskCode,
                Title = t.Title,
                ProjectId = t.ProjectId,
                ProjectName = t.Project?.Name ?? "",
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee?.FullName,
                Status = t.Status,
                Priority = t.Priority,
                ComplexityPoints = t.ComplexityPoints,
                EstimatedHours = t.EstimatedHours,
                ActualHours = t.ActualHours,
                ProgressPercentage = t.ProgressPercentage,
                StartDate = t.StartDate,
                DueDate = t.DueDate,
                CompletedDate = t.CompletedDate,
                ProgressEvidenceScore = t.ProgressEvidenceScore,
                IsPotentiallyStalled = t.IsPotentiallyStalled,
                LatestRiskLevel = t.LatestRiskLevel,
                LatestDelayProbability = t.LatestDelayProbability,
                RiskExplanationSummary = t.RiskExplanationSummary,
                SubtasksTotal = t.Subtasks.Count,
                SubtasksCompleted = t.Subtasks.Count(s => s.IsCompleted),
                CommitCount = t.GitHubCommits.Count,
                PrCount = t.PullRequests.Count,
                BlockedDependencyCount = t.Dependencies.Count(d => d.IsBlocking && d.DependsOnTask != null && d.DependsOnTask.Status != TaskItemStatus.Completed)
            }).ToList();

        var recentCommits = await _context.GitHubCommits
            .OrderByDescending(c => c.CommitDate)
            .Take(8)
            .Select(c => new GitHubCommitDto
            {
                Id = c.Id,
                CommitSha = c.CommitSha,
                RepositoryName = c.RepositoryName,
                Message = c.Message,
                AuthorName = c.AuthorName,
                CommitDate = c.CommitDate,
                LinesAdded = c.LinesAdded,
                LinesDeleted = c.LinesDeleted,
                HtmlUrl = c.HtmlUrl,
                TaskItemId = c.TaskItemId,
                MatchedTaskCode = c.MatchedTaskCode,
                SyncedAt = c.SyncedAt
            }).ToListAsync(cancellationToken);

        var projectsOverview = projects.Select(p =>
        {
            var pTasks = tasks.Where(t => t.ProjectId == p.Id).ToList();
            int pTotal = pTasks.Count;
            int pCompleted = pTasks.Count(t => t.Status == TaskItemStatus.Completed);
            int pStalled = pTasks.Count(t => t.IsPotentiallyStalled);
            int pHighRisk = pTasks.Count(t => t.LatestRiskLevel == RiskLevel.High || t.LatestRiskLevel == RiskLevel.Critical);
            double pProgress = pTotal > 0 ? pTasks.Average(t => t.ProgressPercentage) : 0.0;
            double pEvidence = pTotal > 0 ? pTasks.Average(t => t.ProgressEvidenceScore) : 0.0;
            double pActual = pTasks.Sum(t => t.ActualHours);
            double pEst = pTasks.Sum(t => t.EstimatedHours);

            RiskLevel pRisk = RiskLevel.Low;
            if (pHighRisk > 2 || (pTotal > 0 && (double)pHighRisk / pTotal >= 0.4)) pRisk = RiskLevel.Critical;
            else if (pHighRisk > 0 || pStalled > 0) pRisk = RiskLevel.High;
            else if (pTasks.Any(t => t.LatestRiskLevel == RiskLevel.Medium)) pRisk = RiskLevel.Medium;

            return new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Key = p.Key,
                Description = p.Description,
                StartDate = p.StartDate,
                TargetEndDate = p.TargetEndDate,
                ActualEndDate = p.ActualEndDate,
                BudgetHours = p.BudgetHours,
                IsActive = p.IsActive,
                RepositoryUrl = p.RepositoryUrl,
                GitHubRepoOwner = p.GitHubRepoOwner,
                GitHubRepoName = p.GitHubRepoName,
                CreatedAt = p.CreatedAt,
                TotalTasks = pTotal,
                CompletedTasks = pCompleted,
                StalledTasksCount = pStalled,
                HighRiskTasksCount = pHighRisk,
                OverallProgressPercentage = Math.Round(pProgress, 1),
                OverallEvidenceScore = Math.Round(pEvidence, 1),
                TotalActualHours = Math.Round(pActual, 1),
                TotalEstimatedHours = Math.Round(pEst, 1),
                ProjectRiskLevel = pRisk,
                MemberCount = p.Members.Count
            };
        }).ToList();

        return new DashboardOverviewDto
        {
            TotalProjects = projects.Count,
            ActiveProjects = projects.Count(p => p.IsActive),
            TotalTasks = totalTasksCount,
            InProgressTasks = inProgressTasksCount,
            CompletedTasks = completedTasksCount,
            StalledTasksCount = stalledCount,
            HighRiskTasksCount = highRiskCount,
            AverageEvidenceScore = Math.Round(avgEvidence, 1),
            OverallProjectDelayRisk = Math.Round(overallDelayRisk, 1),
            TotalGitHubCommits = totalCommits,
            TotalWorkLogsLogged = totalWorklogs,
            CriticalAndStalledTasks = criticalAndStalled,
            ProjectsOverview = projectsOverview,
            RecentActivity = recentCommits
        };
    }
}
