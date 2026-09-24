using Veridyn.Core.Enums;

namespace Veridyn.Core.DTOs;

public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public string? AssigneeId { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.ToDo;
    public PriorityLevel Priority { get; set; } = PriorityLevel.Medium;
    public int ComplexityPoints { get; set; } = 3;
    public double EstimatedHours { get; set; } = 8.0;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public List<string>? Subtasks { get; set; }
    public List<int>? DependsOnTaskIds { get; set; }
}

public class UpdateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AssigneeId { get; set; }
    public TaskItemStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
    public int ComplexityPoints { get; set; }
    public double EstimatedHours { get; set; }
    public double ProgressPercentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
}

public class TaskSummaryDto
{
    public int Id { get; set; }
    public string TaskCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public TaskItemStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
    public int ComplexityPoints { get; set; }
    public double EstimatedHours { get; set; }
    public double ActualHours { get; set; }
    public double ProgressPercentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    
    // Evidence & Risk Signals
    public double ProgressEvidenceScore { get; set; }
    public bool IsPotentiallyStalled { get; set; }
    public RiskLevel LatestRiskLevel { get; set; }
    public double LatestDelayProbability { get; set; }
    public string? RiskExplanationSummary { get; set; }
    
    public int SubtasksTotal { get; set; }
    public int SubtasksCompleted { get; set; }
    public int CommitCount { get; set; }
    public int PrCount { get; set; }
    public int BlockedDependencyCount { get; set; }
}

public class TaskDetailDto : TaskSummaryDto
{
    public string Description { get; set; } = string.Empty;
    public string? CreatorName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public List<SubtaskDto> Subtasks { get; set; } = new();
    public List<TaskDependencyDto> Dependencies { get; set; } = new();
    public List<TaskDependencyDto> Successors { get; set; } = new();
    public List<WorkLogDto> WorkLogs { get; set; } = new();
    public List<DailyProgressDto> DailyProgressUpdates { get; set; } = new();
    public List<GitHubCommitDto> GitHubCommits { get; set; } = new();
    public List<GitHubPullRequestDto> PullRequests { get; set; } = new();
    public List<RiskAssessmentDto> RiskAssessments { get; set; } = new();
}

public class SubtaskDto
{
    public int Id { get; set; }
    public int TaskItemId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int OrderIndex { get; set; }
}

public class CreateSubtaskDto
{
    public string Title { get; set; } = string.Empty;
}

public class TaskDependencyDto
{
    public int Id { get; set; }
    public int TaskItemId { get; set; }
    public string TaskCode { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public int DependsOnTaskId { get; set; }
    public string DependsOnTaskCode { get; set; } = string.Empty;
    public string DependsOnTaskTitle { get; set; } = string.Empty;
    public TaskItemStatus DependsOnTaskStatus { get; set; }
    public DependencyType Type { get; set; }
    public bool IsBlocking { get; set; }
    public bool IsCurrentlyBlocked => IsBlocking && DependsOnTaskStatus != TaskItemStatus.Completed;
}

public class CreateTaskDependencyDto
{
    public int DependsOnTaskId { get; set; }
    public DependencyType Type { get; set; } = DependencyType.Blocks;
    public bool IsBlocking { get; set; } = true;
}

public class ChangeTaskStatusDto
{
    public TaskItemStatus NewStatus { get; set; }
    public double? ProgressPercentage { get; set; }
}
