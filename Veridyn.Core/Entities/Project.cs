using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class Project
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string Key { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime TargetEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    
    public double BudgetHours { get; set; }
    public bool IsActive { get; set; } = true;
    
    [MaxLength(200)]
    public string? RepositoryUrl { get; set; }

    [MaxLength(100)]
    public string? GitHubRepoOwner { get; set; }

    [MaxLength(100)]
    public string? GitHubRepoName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<RiskAssessment> RiskAssessments { get; set; } = new List<RiskAssessment>();
}
