using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.DTOs;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditLogsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpGet("logs")]
    public async Task<ActionResult<List<AuditLogDto>>> GetLogs([FromQuery] int take = 100)
    {
        var logs = await _context.AuditLogs.OrderByDescending(a => a.Timestamp).Take(take).Select(a => new AuditLogDto
        {
            Id = a.Id,
            UserId = a.UserId,
            UserEmail = a.UserEmail,
            Action = a.Action,
            EntityType = a.EntityType,
            EntityId = a.EntityId,
            DetailsJson = a.DetailsJson,
            Timestamp = a.Timestamp,
            IpAddress = a.IpAddress
        }).ToListAsync();
        return Ok(logs);
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<List<NotificationDto>>> GetMyNotifications()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var notifications = await _context.Notifications.Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt).Take(30).Select(n => new NotificationDto
        {
            Id = n.Id,
            UserId = n.UserId,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ActionUrl = n.ActionUrl
        }).ToListAsync();
        return Ok(notifications);
    }

    [HttpPost("notifications/{id}/read")]
    public async Task<IActionResult> MarkNotificationRead(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
