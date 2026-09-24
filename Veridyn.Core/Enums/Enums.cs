namespace Veridyn.Core.Enums;

public enum UserRoleType
{
    Admin = 1,
    ProjectManager = 2,
    Developer = 3
}

public enum TaskItemStatus
{
    ToDo = 1,
    InProgress = 2,
    InReview = 3,
    Completed = 4,
    Blocked = 5,
    Cancelled = 6
}

public enum PriorityLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum DependencyType
{
    Blocks = 1,
    BlockedBy = 2,
    FinishToStart = 3,
    RelatesTo = 4
}

public enum NotificationType
{
    Info = 1,
    Warning = 2,
    RiskAlert = 3,
    StallWarning = 4,
    DependencyBlocked = 5
}
