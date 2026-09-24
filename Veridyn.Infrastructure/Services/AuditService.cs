using System.Text.Json;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;

    public AuditService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string? userId, string? userEmail, string action, string entityType, string? entityId, object? details = null, string? ipAddress = null)
    {
        string? detailsJson = null;
        if (details != null)
        {
            detailsJson = JsonSerializer.Serialize(details);
        }

        var log = new AuditLog
        {
            UserId = userId,
            UserEmail = userEmail,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            DetailsJson = detailsJson,
            Timestamp = DateTime.UtcNow,
            IpAddress = ipAddress
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task CreateNotificationAsync(string userId, string title, string message, NotificationType type, string? actionUrl = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            ActionUrl = actionUrl
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}
