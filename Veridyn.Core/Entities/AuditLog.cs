using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class AuditLog
{
    public int Id { get; set; }

    public string? UserId { get; set; }
    
    [MaxLength(150)]
    public string? UserEmail { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string EntityType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? EntityId { get; set; }

    [MaxLength(4000)]
    public string? DetailsJson { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? IpAddress { get; set; }
}
