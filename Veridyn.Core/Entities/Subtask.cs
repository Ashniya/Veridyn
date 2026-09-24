using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class Subtask
{
    public int Id { get; set; }

    public int TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    [Required]
    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public int OrderIndex { get; set; } = 0;
}
