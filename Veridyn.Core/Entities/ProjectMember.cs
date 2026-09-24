using Veridyn.Core.Enums;

namespace Veridyn.Core.Entities;

public class ProjectMember
{
    public int Id { get; set; }
    
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public UserRoleType RoleInProject { get; set; } = UserRoleType.Developer;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
