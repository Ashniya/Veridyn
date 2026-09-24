using Microsoft.AspNetCore.Identity;
using Veridyn.Core.Enums;

namespace Veridyn.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public UserRoleType Role { get; set; } = UserRoleType.Developer;
    public string? JobTitle { get; set; }
    public string? AvatarUrl { get; set; }
    public string? GitHubUsername { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
    public ICollection<DailyProgressUpdate> DailyProgressUpdates { get; set; } = new List<DailyProgressUpdate>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
