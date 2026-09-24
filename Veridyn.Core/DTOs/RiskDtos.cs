using Veridyn.Core.Enums;

namespace Veridyn.Core.DTOs;

public class RiskAssessmentDto
{
    public int Id { get; set; }
    public int? TaskItemId { get; set; }
    public string? TaskCode { get; set; }
    public string? TaskTitle { get; set; }
    public int ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public DateTime AssessmentDate { get; set; }
    public double ProgressEvidenceScore { get; set; }
    public bool IsPotentiallyStalled { get; set; }
    public double DelayProbability { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public double RuleBasedScore { get; set; }
    public double? MlPredictedScore { get; set; }
    public string CalculationMethod { get; set; } = "Hybrid";
    public List<RiskFactorExplanationDto> RiskFactors { get; set; } = new();
    public string? EvaluatedBy { get; set; }
}

public class RiskFactorExplanationDto
{
    public string Factor { get; set; } = string.Empty;
    public string Severity { get; set; } = "Low"; // Low, Medium, High, Critical
    public double ImpactScore { get; set; }
    public string Details { get; set; } = string.Empty;
    public string Category { get; set; } = "General"; // GitHub, WorkLog, Dependencies, Schedule, Subtasks
}

public class ProgressEvidenceScoreResultDto
{
    public int TaskItemId { get; set; }
    public string TaskCode { get; set; } = string.Empty;
    public double EvidenceScore { get; set; } // 0 - 100
    public double ReportedProgress { get; set; } // 0 - 100
    public bool IsPotentiallyStalled { get; set; }
    public string StallReason { get; set; } = string.Empty;
    public double CommitEvidenceWeight { get; set; }
    public double WorkLogEvidenceWeight { get; set; }
    public double SubtaskEvidenceWeight { get; set; }
    public double DependencyEvidenceWeight { get; set; }
    public double SchedulePaceRatio { get; set; }
    public List<string> EvidenceFindings { get; set; } = new();
}

public class DashboardOverviewDto
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int TotalTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int StalledTasksCount { get; set; }
    public int HighRiskTasksCount { get; set; }
    public double AverageEvidenceScore { get; set; }
    public double OverallProjectDelayRisk { get; set; }
    public int TotalGitHubCommits { get; set; }
    public int TotalWorkLogsLogged { get; set; }
    
    public List<TaskSummaryDto> CriticalAndStalledTasks { get; set; } = new();
    public List<ProjectDto> ProjectsOverview { get; set; } = new();
    public List<GitHubCommitDto> RecentActivity { get; set; } = new();
}
