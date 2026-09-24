using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRiskAnalysisService _riskService;
    private readonly IAuditService _auditService;

    public TasksController(
        ApplicationDbContext context,
        IRiskAnalysisService riskService,
        IAuditService auditService)
    {
        _context = context;
        _riskService = riskService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskSummaryDto>>> GetTasks(
        [FromQuery] int? projectId,
        [FromQuery] string? assigneeId,
        [FromQuery] TaskItemStatus? status,
        [FromQuery] PriorityLevel? priority,
        [FromQuery] bool? stalledOnly,
        [FromQuery] bool? highRiskOnly)
    {
        var query = _context.TaskItems
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.Subtasks)
            .Include(t => t.GitHubCommits)
            .Include(t => t.PullRequests)
            .Include(t => t.Dependencies).ThenInclude(d => d.DependsOnTask)
            .AsQueryable();

        if (projectId.HasValue) query = query.Where(t => t.ProjectId == projectId.Value);
        if (!string.IsNullOrEmpty(assigneeId)) query = query.Where(t => t.AssigneeId == assigneeId);
        if (status.HasValue) query = query.Where(t => t.Status == status.Value);
        if (priority.HasValue) query = query.Where(t => t.Priority == priority.Value);
        if (stalledOnly == true) query = query.Where(t => t.IsPotentiallyStalled);
        if (highRiskOnly == true) query = query.Where(t => t.LatestRiskLevel == RiskLevel.High || t.LatestRiskLevel == RiskLevel.Critical);

        var tasks = await query.OrderByDescending(t => t.UpdatedAt).ToListAsync();

        var dtos = tasks.Select(t => new TaskSummaryDto
        {
            Id = t.Id,
            TaskCode = t.TaskCode,
            Title = t.Title,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.Name ?? "",
            AssigneeId = t.AssigneeId,
            AssigneeName = t.Assignee?.FullName,
            Status = t.Status,
            Priority = t.Priority,
            ComplexityPoints = t.ComplexityPoints,
            EstimatedHours = t.EstimatedHours,
            ActualHours = t.ActualHours,
            ProgressPercentage = t.ProgressPercentage,
            StartDate = t.StartDate,
            DueDate = t.DueDate,
            CompletedDate = t.CompletedDate,
            ProgressEvidenceScore = t.ProgressEvidenceScore,
            IsPotentiallyStalled = t.IsPotentiallyStalled,
            LatestRiskLevel = t.LatestRiskLevel,
            LatestDelayProbability = t.LatestDelayProbability,
            RiskExplanationSummary = t.RiskExplanationSummary,
            SubtasksTotal = t.Subtasks.Count,
            SubtasksCompleted = t.Subtasks.Count(s => s.IsCompleted),
            CommitCount = t.GitHubCommits.Count,
            PrCount = t.PullRequests.Count,
            BlockedDependencyCount = t.Dependencies.Count(d => d.IsBlocking && d.DependsOnTask != null && d.DependsOnTask.Status != TaskItemStatus.Completed)
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskDetailDto>> GetTaskById(int id)
    {
        var t = await _context.TaskItems
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.Creator)
            .Include(t => t.Subtasks)
            .Include(t => t.Dependencies).ThenInclude(d => d.DependsOnTask)
            .Include(t => t.Successors).ThenInclude(s => s.TaskItem)
            .Include(t => t.WorkLogs).ThenInclude(w => w.User)
            .Include(t => t.DailyProgressUpdates).ThenInclude(d => d.User)
            .Include(t => t.GitHubCommits)
            .Include(t => t.PullRequests)
            .Include(t => t.RiskAssessments)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (t == null) return NotFound();

        var detail = new TaskDetailDto
        {
            Id = t.Id,
            TaskCode = t.TaskCode,
            Title = t.Title,
            Description = t.Description,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.Name ?? "",
            AssigneeId = t.AssigneeId,
            AssigneeName = t.Assignee?.FullName,
            CreatorName = t.Creator?.FullName,
            Status = t.Status,
            Priority = t.Priority,
            ComplexityPoints = t.ComplexityPoints,
            EstimatedHours = t.EstimatedHours,
            ActualHours = t.ActualHours,
            ProgressPercentage = t.ProgressPercentage,
            StartDate = t.StartDate,
            DueDate = t.DueDate,
            CompletedDate = t.CompletedDate,
            ProgressEvidenceScore = t.ProgressEvidenceScore,
            IsPotentiallyStalled = t.IsPotentiallyStalled,
            LatestRiskLevel = t.LatestRiskLevel,
            LatestDelayProbability = t.LatestDelayProbability,
            RiskExplanationSummary = t.RiskExplanationSummary,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            SubtasksTotal = t.Subtasks.Count,
            SubtasksCompleted = t.Subtasks.Count(s => s.IsCompleted),
            CommitCount = t.GitHubCommits.Count,
            PrCount = t.PullRequests.Count,
            BlockedDependencyCount = t.Dependencies.Count(d => d.IsBlocking && d.DependsOnTask != null && d.DependsOnTask.Status != TaskItemStatus.Completed),
            Subtasks = t.Subtasks.OrderBy(s => s.OrderIndex).Select(s => new SubtaskDto
            {
                Id = s.Id,
                TaskItemId = s.TaskItemId,
                Title = s.Title,
                IsCompleted = s.IsCompleted,
                CompletedAt = s.CompletedAt,
                OrderIndex = s.OrderIndex
            }).ToList(),
            Dependencies = t.Dependencies.Select(d => new TaskDependencyDto
            {
                Id = d.Id,
                TaskItemId = d.TaskItemId,
                TaskCode = t.TaskCode,
                TaskTitle = t.Title,
                DependsOnTaskId = d.DependsOnTaskId,
                DependsOnTaskCode = d.DependsOnTask?.TaskCode ?? "",
                DependsOnTaskTitle = d.DependsOnTask?.Title ?? "",
                DependsOnTaskStatus = d.DependsOnTask?.Status ?? TaskItemStatus.ToDo,
                Type = d.Type,
                IsBlocking = d.IsBlocking
            }).ToList(),
            Successors = t.Successors.Select(s => new TaskDependencyDto
            {
                Id = s.Id,
                TaskItemId = s.TaskItemId,
                TaskCode = s.TaskItem?.TaskCode ?? "",
                TaskTitle = s.TaskItem?.Title ?? "",
                DependsOnTaskId = t.Id,
                DependsOnTaskCode = t.TaskCode,
                DependsOnTaskTitle = t.Title,
                DependsOnTaskStatus = t.Status,
                Type = s.Type,
                IsBlocking = s.IsBlocking
            }).ToList(),
            WorkLogs = t.WorkLogs.OrderByDescending(w => w.WorkDate).Select(w => new WorkLogDto
            {
                Id = w.Id,
                TaskItemId = w.TaskItemId,
                TaskCode = t.TaskCode,
                TaskTitle = t.Title,
                UserId = w.UserId,
                UserName = w.User?.FullName ?? "Unknown",
                WorkDate = w.WorkDate,
                HoursSpent = w.HoursSpent,
                Description = w.Description,
                BlockersEncountered = w.BlockersEncountered,
                CreatedAt = w.CreatedAt
            }).ToList(),
            DailyProgressUpdates = t.DailyProgressUpdates.OrderByDescending(d => d.UpdateDate).Select(d => new DailyProgressDto
            {
                Id = d.Id,
                TaskItemId = d.TaskItemId,
                TaskCode = t.TaskCode,
                TaskTitle = t.Title,
                UserId = d.UserId,
                UserName = d.User?.FullName ?? "Unknown",
                UpdateDate = d.UpdateDate,
                ReportedProgressPercentage = d.ReportedProgressPercentage,
                Summary = d.Summary,
                BlockersDescription = d.BlockersDescription,
                CreatedAt = d.CreatedAt
            }).ToList(),
            GitHubCommits = t.GitHubCommits.OrderByDescending(c => c.CommitDate).Select(c => new GitHubCommitDto
            {
                Id = c.Id,
                CommitSha = c.CommitSha,
                RepositoryName = c.RepositoryName,
                Message = c.Message,
                AuthorName = c.AuthorName,
                AuthorEmail = c.AuthorEmail,
                CommitDate = c.CommitDate,
                LinesAdded = c.LinesAdded,
                LinesDeleted = c.LinesDeleted,
                HtmlUrl = c.HtmlUrl,
                TaskItemId = c.TaskItemId,
                MatchedTaskCode = c.MatchedTaskCode,
                SyncedAt = c.SyncedAt
            }).ToList(),
            PullRequests = t.PullRequests.Select(pr => new GitHubPullRequestDto
            {
                Id = pr.Id,
                PrNumber = pr.PrNumber,
                RepositoryName = pr.RepositoryName,
                Title = pr.Title,
                State = pr.State,
                Author = pr.Author,
                CreatedAt = pr.CreatedAt,
                MergedAt = pr.MergedAt,
                ClosedAt = pr.ClosedAt,
                HtmlUrl = pr.HtmlUrl,
                TaskItemId = pr.TaskItemId,
                MatchedTaskCode = pr.MatchedTaskCode,
                SyncedAt = pr.SyncedAt
            }).ToList()
        };

        return Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<TaskSummaryDto>> CreateTask([FromBody] CreateTaskDto dto)
    {
        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project == null) return BadRequest(new { message = "Project not found" });

        int taskCount = await _context.TaskItems.CountAsync(t => t.ProjectId == dto.ProjectId);
        string taskCode = $"{project.Key}-{taskCount + 101}";

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var task = new TaskItem
        {
            TaskCode = taskCode,
            Title = dto.Title,
            Description = dto.Description,
            ProjectId = dto.ProjectId,
            AssigneeId = dto.AssigneeId,
            CreatorId = currentUserId,
            Status = dto.Status,
            Priority = dto.Priority,
            ComplexityPoints = dto.ComplexityPoints,
            EstimatedHours = dto.EstimatedHours,
            ActualHours = 0,
            ProgressPercentage = 0,
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

        if (dto.Subtasks != null && dto.Subtasks.Count > 0)
        {
            int order = 1;
            foreach (var sub in dto.Subtasks)
            {
                if (!string.IsNullOrWhiteSpace(sub))
                {
                    _context.Subtasks.Add(new Subtask
                    {
                        TaskItemId = task.Id,
                        Title = sub.Trim(),
                        OrderIndex = order++
                    });
                }
            }
        }

        if (dto.DependsOnTaskIds != null)
        {
            foreach (var depId in dto.DependsOnTaskIds)
            {
                _context.TaskDependencies.Add(new TaskDependency
                {
                    TaskItemId = task.Id,
                    DependsOnTaskId = depId,
                    Type = DependencyType.Blocks,
                    IsBlocking = true
                });
            }
        }
        await _context.SaveChangesAsync();

        // Initial risk analysis
        await _riskService.EvaluateTaskRiskAsync(task.Id);

        if (!string.IsNullOrEmpty(dto.AssigneeId))
        {
            await _auditService.CreateNotificationAsync(
                dto.AssigneeId,
                "New Task Assigned",
                $"You have been assigned task [{task.TaskCode}] {task.Title}.",
                NotificationType.Info,
                $"/tasks/{task.Id}"
            );
        }

        await _auditService.LogAsync(
            currentUserId,
            User.FindFirstValue(ClaimTypes.Email),
            "CreatedTask",
            "TaskItem",
            task.Id.ToString(),
            new { task.TaskCode, task.Title }
        );

        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, new TaskSummaryDto
        {
            Id = task.Id,
            TaskCode = task.TaskCode,
            Title = task.Title,
            ProjectId = task.ProjectId,
            ProjectName = project.Name,
            AssigneeId = task.AssigneeId,
            Status = task.Status,
            Priority = task.Priority,
            EstimatedHours = task.EstimatedHours,
            DueDate = task.DueDate
        });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] ChangeTaskStatusDto dto)
    {
        var task = await _context.TaskItems.FindAsync(id);
        if (task == null) return NotFound();

        var oldStatus = task.Status;
        task.Status = dto.NewStatus;
        if (dto.ProgressPercentage.HasValue)
        {
            task.ProgressPercentage = dto.ProgressPercentage.Value;
        }

        if (dto.NewStatus == TaskItemStatus.Completed)
        {
            task.ProgressPercentage = 100.0;
            task.CompletedDate = DateTime.UtcNow;
        }
        else
        {
            task.CompletedDate = null;
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Re-evaluate risk and evidence
        await _riskService.EvaluateTaskRiskAsync(id);

        await _auditService.LogAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            User.FindFirstValue(ClaimTypes.Email),
            "ChangedTaskStatus",
            "TaskItem",
            id.ToString(),
            new { OldStatus = oldStatus.ToString(), NewStatus = dto.NewStatus.ToString(), task.ProgressPercentage }
        );

        return NoContent();
    }

    [HttpPost("{id}/subtasks")]
    public async Task<ActionResult<SubtaskDto>> AddSubtask(int id, [FromBody] CreateSubtaskDto dto)
    {
        var task = await _context.TaskItems.FindAsync(id);
        if (task == null) return NotFound();

        int maxOrder = await _context.Subtasks.Where(s => s.TaskItemId == id).MaxAsync(s => (int?)s.OrderIndex) ?? 0;
        var subtask = new Subtask
        {
            TaskItemId = id,
            Title = dto.Title,
            IsCompleted = false,
            OrderIndex = maxOrder + 1
        };

        _context.Subtasks.Add(subtask);
        await _context.SaveChangesAsync();

        await _riskService.EvaluateTaskRiskAsync(id);

        return Ok(new SubtaskDto
        {
            Id = subtask.Id,
            TaskItemId = subtask.TaskItemId,
            Title = subtask.Title,
            IsCompleted = subtask.IsCompleted,
            OrderIndex = subtask.OrderIndex
        });
    }

    [HttpPut("{id}/subtasks/{subtaskId}/toggle")]
    public async Task<IActionResult> ToggleSubtask(int id, int subtaskId)
    {
        var subtask = await _context.Subtasks.FirstOrDefaultAsync(s => s.Id == subtaskId && s.TaskItemId == id);
        if (subtask == null) return NotFound();

        subtask.IsCompleted = !subtask.IsCompleted;
        subtask.CompletedAt = subtask.IsCompleted ? DateTime.UtcNow : null;
        await _context.SaveChangesAsync();

        await _riskService.EvaluateTaskRiskAsync(id);

        return Ok(new { isCompleted = subtask.IsCompleted });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.TaskItems.FindAsync(id);
        if (task == null) return NotFound();

        _context.TaskItems.Remove(task);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            User.FindFirstValue(ClaimTypes.Email),
            "DeletedTask",
            "TaskItem",
            id.ToString(),
            new { task.TaskCode, task.Title }
        );

        return NoContent();
    }
}
