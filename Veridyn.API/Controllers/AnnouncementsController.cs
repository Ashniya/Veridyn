using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.Entities;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnnouncementsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET /api/announcements?projectId=1
    [HttpGet]
    public async Task<IActionResult> GetAnnouncements([FromQuery] int projectId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        var isDeveloper = User.IsInRole("Developer");

        // Developers can only see announcements for projects they're in
        if (isDeveloper && !isAdmin)
        {
            var isMember = await _context.ProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.UserId == currentUserId);
            if (!isMember)
                return Forbid();
        }

        var announcements = await _context.Announcements
            .Where(a => a.ProjectId == projectId)
            .Include(a => a.Author)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.ProjectId,
                a.Title,
                a.Content,
                a.CreatedAt,
                AuthorId = a.AuthorId,
                AuthorName = a.Author != null ? a.Author.FullName : "Unknown",
            })
            .ToListAsync();

        return Ok(announcements);
    }

    // POST /api/announcements
    [HttpPost]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest req)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();

        // Verify the project exists
        var project = await _context.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == req.ProjectId);

        if (project == null)
            return NotFound(new { message = "Project not found." });

        var announcement = new Announcement
        {
            ProjectId = req.ProjectId,
            AuthorId = currentUserId,
            Title = req.Title.Trim(),
            Content = req.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        // Send a notification to every project member
        var author = await _context.Users.FindAsync(currentUserId);
        var authorName = author?.FullName ?? "Someone";

        var memberIds = project.Members.Select(m => m.UserId).Distinct().ToList();
        foreach (var memberId in memberIds)
        {
            // Skip notifying the author themselves
            if (memberId == currentUserId) continue;

            var preview = announcement.Content.Length > 120 ? announcement.Content.Substring(0, 120) + "..." : announcement.Content;
            var notification = new Notification
            {
                UserId = memberId,
                Title = $"📢 Announcement: {announcement.Title}",
                Message = $"{authorName} posted in {project.Name}: \"{preview}\"",
                Type = Veridyn.Core.Enums.NotificationType.Info,
                ActionUrl = $"/projects/{req.ProjectId}",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            announcement.Id,
            announcement.ProjectId,
            announcement.Title,
            announcement.Content,
            announcement.CreatedAt,
            AuthorId = currentUserId,
            AuthorName = authorName
        });
    }

    // DELETE /api/announcements/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAnnouncement(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var announcement = await _context.Announcements.FindAsync(id);
        if (announcement == null)
            return NotFound();

        // Only author or admin can delete
        if (!isAdmin && announcement.AuthorId != currentUserId)
            return Forbid();

        _context.Announcements.Remove(announcement);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Announcement deleted." });
    }
}

public record CreateAnnouncementRequest(int ProjectId, string Title, string Content);
