using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRiskAnalysisService _riskService;
    private readonly IAuditService _auditService;

    public WorkLogsController(ApplicationDbContext context, IRiskAnalysisService riskService, IAuditService auditService)
    {
        _context = context;
        _riskService = riskService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<List<WorkLogDto>>> GetWorkLogs([FromQuery] int? taskId, [FromQuery] string? userId)
    {
        var query = _context.WorkLogs.Include(w => w.TaskItem).Include(w => w.User).AsQueryable();
        if (taskId.HasValue) query = query.Where(w => w.TaskItemId == taskId.Value);
        if (!string.IsNullOrEmpty(userId)) query = query.Where(w => w.UserId == userId);
        var logs = await query.OrderByDescending(w => w.WorkDate).Take(50).ToListAsync();
        return Ok(logs.Select(w => new WorkLogDto
        {
            Id = w.Id,
            TaskItemId = w.TaskItemId,
            TaskCode = w.TaskItem?.TaskCode ?? "",
            TaskTitle = w.TaskItem?.Title ?? "",
            UserId = w.UserId,
            UserName = w.User?.FullName ?? "Unknown",
            WorkDate = w.WorkDate,
            HoursSpent = w.HoursSpent,
            Description = w.Description,
            BlockersEncountered = w.BlockersEncountered,
            CreatedAt = w.CreatedAt
        }).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<WorkLogDto>> CreateWorkLog([FromBody] CreateWorkLogDto dto)
    {
        var task = await _context.TaskItems.FindAsync(dto.TaskItemId);
        if (task == null) return NotFound(new { message = "Task not found" });
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var log = new WorkLog
        {
            TaskItemId = dto.TaskItemId,
            UserId = userId,
            WorkDate = dto.WorkDate,
            HoursSpent = dto.HoursSpent,
            Description = dto.Description,
            BlockersEncountered = dto.BlockersEncountered,
            CreatedAt = DateTime.UtcNow
        };
        _context.WorkLogs.Add(log);
        task.ActualHours += dto.HoursSpent;
        if (dto.UpdatedProgressPercentage.HasValue) task.ProgressPercentage = dto.UpdatedProgressPercentage.Value;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _riskService.EvaluateTaskRiskAsync(task.Id);
        return Ok(new WorkLogDto
        {
            Id = log.Id,
            TaskItemId = log.TaskItemId,
            TaskCode = task.TaskCode,
            TaskTitle = task.Title,
            UserId = userId,
            UserName = User.FindFirstValue(ClaimTypes.Name) ?? "User",
            WorkDate = log.WorkDate,
            HoursSpent = log.HoursSpent,
            Description = log.Description,
            BlockersEncountered = log.BlockersEncountered,
            CreatedAt = log.CreatedAt
        });
    }

    [HttpPost("daily-update")]
    public async Task<ActionResult<DailyProgressDto>> CreateDailyUpdate([FromBody] CreateDailyProgressDto dto)
    {
        var task = await _context.TaskItems.FindAsync(dto.TaskItemId);
        if (task == null) return NotFound(new { message = "Task not found" });
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var update = new DailyProgressUpdate
        {
            TaskItemId = dto.TaskItemId,
            UserId = userId,
            UpdateDate = dto.UpdateDate,
            ReportedProgressPercentage = dto.ReportedProgressPercentage,
            Summary = dto.Summary,
            BlockersDescription = dto.BlockersDescription,
            CreatedAt = DateTime.UtcNow
        };
        _context.DailyProgressUpdates.Add(update);
        task.ProgressPercentage = dto.ReportedProgressPercentage;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _riskService.EvaluateTaskRiskAsync(task.Id);
        return Ok(new DailyProgressDto
        {
            Id = update.Id,
            TaskItemId = update.TaskItemId,
            TaskCode = task.TaskCode,
            TaskTitle = task.Title,
            UserId = userId,
            UserName = User.FindFirstValue(ClaimTypes.Name) ?? "User",
            UpdateDate = update.UpdateDate,
            ReportedProgressPercentage = update.ReportedProgressPercentage,
            Summary = update.Summary,
            BlockersDescription = update.BlockersDescription,
            CreatedAt = update.CreatedAt
        });
    }
}
