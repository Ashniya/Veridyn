using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class DailyProgressUpdate
{
    public int Id { get; set; }

    public int TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public DateTime UpdateDate { get; set; } = DateTime.UtcNow.Date;
    public double ReportedProgressPercentage { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Summary { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? BlockersDescription { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
