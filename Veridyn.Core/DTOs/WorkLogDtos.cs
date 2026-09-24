namespace Veridyn.Core.DTOs;

public class CreateWorkLogDto
{
    public int TaskItemId { get; set; }
    public DateTime WorkDate { get; set; } = DateTime.UtcNow.Date;
    public double HoursSpent { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? BlockersEncountered { get; set; }
    public double? UpdatedProgressPercentage { get; set; }
}

public class WorkLogDto
{
    public int Id { get; set; }
    public int TaskItemId { get; set; }
    public string TaskCode { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime WorkDate { get; set; }
    public double HoursSpent { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? BlockersEncountered { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDailyProgressDto
{
    public int TaskItemId { get; set; }
    public DateTime UpdateDate { get; set; } = DateTime.UtcNow.Date;
    public double ReportedProgressPercentage { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string? BlockersDescription { get; set; }
}

public class DailyProgressDto
{
    public int Id { get; set; }
    public int TaskItemId { get; set; }
    public string TaskCode { get; set; } = string.Empty;
    public string TaskTitle { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime UpdateDate { get; set; }
    public double ReportedProgressPercentage { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string? BlockersDescription { get; set; }
    public DateTime CreatedAt { get; set; }
}
