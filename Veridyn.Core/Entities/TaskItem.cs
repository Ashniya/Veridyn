using System.ComponentModel.DataAnnotations;
using Veridyn.Core.Enums;

namespace Veridyn.Core.Entities;

public class TaskItem
{
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string TaskCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public string? AssigneeId { get; set; }
    public ApplicationUser? Assignee { get; set; }

    public string? CreatorId { get; set; }
    public ApplicationUser? Creator { get; set; }

    public TaskItemStatus Status { get; set; } = TaskItemStatus.ToDo;
    public PriorityLevel Priority { get; set; } = PriorityLevel.Medium;
    public int ComplexityPoints { get; set; } = 3;

    public double EstimatedHours { get; set; } = 8.0;
    public double ActualHours { get; set; } = 0.0;
    public double ProgressPercentage { get; set; } = 0.0;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    public double ProgressEvidenceScore { get; set; } = 0.0;
    public bool IsPotentiallyStalled { get; set; } = false;
    public RiskLevel LatestRiskLevel { get; set; } = RiskLevel.Low;
    public double LatestDelayProbability { get; set; } = 0.0;
    public string? RiskExplanationSummary { get; set; }
    public DateTime? LastEvaluatedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Subtask> Subtasks { get; set; } = new List<Subtask>();
    public ICollection<TaskDependency> Dependencies { get; set; } = new List<TaskDependency>();
    public ICollection<TaskDependency> Successors { get; set; } = new List<TaskDependency>();
    public ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
    public ICollection<DailyProgressUpdate> DailyProgressUpdates { get; set; } = new List<DailyProgressUpdate>();
    public ICollection<GitHubCommit> GitHubCommits { get; set; } = new List<GitHubCommit>();
    public ICollection<GitHubPullRequest> PullRequests { get; set; } = new List<GitHubPullRequest>();
    public ICollection<RiskAssessment> RiskAssessments { get; set; } = new List<RiskAssessment>();
}
