using Veridyn.Core.Enums;

namespace Veridyn.Core.Entities;

public class TaskDependency
{
    public int Id { get; set; }

    public int TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    public int DependsOnTaskId { get; set; }
    public TaskItem? DependsOnTask { get; set; }

    public DependencyType Type { get; set; } = DependencyType.Blocks;
    public bool IsBlocking { get; set; } = true;
}
