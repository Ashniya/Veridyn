namespace Veridyn.Core.Interfaces;

public interface IAuditService
{
    Task LogAsync(string? userId, string? userEmail, string action, string entityType, string? entityId, object? details = null, string? ipAddress = null);
    Task CreateNotificationAsync(string userId, string title, string message, Enums.NotificationType type, string? actionUrl = null);
}
