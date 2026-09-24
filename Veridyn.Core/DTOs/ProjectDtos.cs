using Veridyn.Core.Enums;

namespace Veridyn.Core.DTOs;

public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime TargetEndDate { get; set; }
    public double BudgetHours { get; set; }
    public string? RepositoryUrl { get; set; }
    public string? GitHubRepoOwner { get; set; }
    public string? GitHubRepoName { get; set; }
    public List<string>? MemberUserIds { get; set; }
}

public class UpdateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime TargetEndDate { get; set; }
    public double BudgetHours { get; set; }
    public bool IsActive { get; set; }
    public string? RepositoryUrl { get; set; }
    public string? GitHubRepoOwner { get; set; }
    public string? GitHubRepoName { get; set; }
}

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime TargetEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public double BudgetHours { get; set; }
    public bool IsActive { get; set; }
    public string? RepositoryUrl { get; set; }
    public string? GitHubRepoOwner { get; set; }
    public string? GitHubRepoName { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Aggregated health metrics
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int StalledTasksCount { get; set; }
    public int HighRiskTasksCount { get; set; }
    public double OverallProgressPercentage { get; set; }
    public double OverallEvidenceScore { get; set; }
    public double TotalActualHours { get; set; }
    public double TotalEstimatedHours { get; set; }
    public RiskLevel ProjectRiskLevel { get; set; } = RiskLevel.Low;
    public int MemberCount { get; set; }
}

public class ProjectDetailDto : ProjectDto
{
    public List<ProjectMemberDto> Members { get; set; } = new();
    public List<TaskSummaryDto> Tasks { get; set; } = new();
}

public class ProjectMemberDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public UserRoleType RoleInProject { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class AddProjectMemberDto
{
    public string UserId { get; set; } = string.Empty;
    public UserRoleType RoleInProject { get; set; } = UserRoleType.Developer;
}
