using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class WorkLog
{
    public int Id { get; set; }

    public int TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public DateTime WorkDate { get; set; } = DateTime.UtcNow.Date;
    public double HoursSpent { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? BlockersEncountered { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
