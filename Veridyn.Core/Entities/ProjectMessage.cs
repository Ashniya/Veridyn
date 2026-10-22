using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class ProjectMessage
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    [Required]
    public string SenderId { get; set; } = string.Empty;

    public string SenderName { get; set; } = string.Empty;

    public string SenderRole { get; set; } = string.Empty;

    /// <summary>
    /// If null or empty, this is a Group / Team message for all project members.
    /// If set to a specific UserId, this is a Personal / Direct Message to that developer.
    /// </summary>
    public string? RecipientId { get; set; }

    public string? RecipientName { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
