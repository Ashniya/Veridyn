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
public class ProjectsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IRiskAnalysisService _riskService;

    public ProjectsController(
        ApplicationDbContext context,
        IAuditService auditService,
        IRiskAnalysisService riskService)
    {
        _context = context;
        _auditService = auditService;
        _riskService = riskService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isDeveloper = User.IsInRole("Developer");

        var query = _context.Projects
            .Include(p => p.Members)
            .Include(p => p.Tasks)
            .AsQueryable();

        if (isDeveloper && !string.IsNullOrEmpty(currentUserId))
        {
            query = query.Where(p => p.Members.Any(m => m.UserId == currentUserId));
        }

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var dtos = projects.Select(p =>
        {
            int total = p.Tasks.Count;
            int completed = p.Tasks.Count(t => t.Status == TaskItemStatus.Completed);
            int stalled = p.Tasks.Count(t => t.IsPotentiallyStalled);
            int highRisk = p.Tasks.Count(t => t.LatestRiskLevel == RiskLevel.High || t.LatestRiskLevel == RiskLevel.Critical);
            double progress = total > 0 ? p.Tasks.Average(t => t.ProgressPercentage) : 0.0;
            double evidence = total > 0 ? p.Tasks.Average(t => t.ProgressEvidenceScore) : 0.0;

            RiskLevel risk = RiskLevel.Low;
            if (highRisk > 2 || (total > 0 && (double)highRisk / total >= 0.4)) risk = RiskLevel.Critical;
            else if (highRisk > 0 || stalled > 0) risk = RiskLevel.High;
            else if (p.Tasks.Any(t => t.LatestRiskLevel == RiskLevel.Medium)) risk = RiskLevel.Medium;

            return new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Key = p.Key,
                Description = p.Description,
                StartDate = p.StartDate,
                TargetEndDate = p.TargetEndDate,
                ActualEndDate = p.ActualEndDate,
                BudgetHours = p.BudgetHours,
                IsActive = p.IsActive,
                RepositoryUrl = p.RepositoryUrl,
                GitHubRepoOwner = p.GitHubRepoOwner,
                GitHubRepoName = p.GitHubRepoName,
                CreatedAt = p.CreatedAt,
                TotalTasks = total,
                CompletedTasks = completed,
                StalledTasksCount = stalled,
                HighRiskTasksCount = highRisk,
                OverallProgressPercentage = Math.Round(progress, 1),
                OverallEvidenceScore = Math.Round(evidence, 1),
                TotalActualHours = Math.Round(p.Tasks.Sum(t => t.ActualHours), 1),
                TotalEstimatedHours = Math.Round(p.Tasks.Sum(t => t.EstimatedHours), 1),
                ProjectRiskLevel = risk,
                MemberCount = p.Members.Count
            };
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDetailDto>> GetProjectById(int id)
    {
        var p = await _context.Projects
            .Include(p => p.Members).ThenInclude(m => m.User)
            .Include(p => p.Tasks).ThenInclude(t => t.Assignee)
            .Include(p => p.Tasks).ThenInclude(t => t.Subtasks)
            .Include(p => p.Tasks).ThenInclude(t => t.GitHubCommits)
            .Include(p => p.Tasks).ThenInclude(t => t.PullRequests)
            .Include(p => p.Tasks).ThenInclude(t => t.Dependencies).ThenInclude(d => d.DependsOnTask)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return NotFound();

        int total = p.Tasks.Count;
        int completed = p.Tasks.Count(t => t.Status == TaskItemStatus.Completed);
        int stalled = p.Tasks.Count(t => t.IsPotentiallyStalled);
        int highRisk = p.Tasks.Count(t => t.LatestRiskLevel == RiskLevel.High || t.LatestRiskLevel == RiskLevel.Critical);
        double progress = total > 0 ? p.Tasks.Average(t => t.ProgressPercentage) : 0.0;
        double evidence = total > 0 ? p.Tasks.Average(t => t.ProgressEvidenceScore) : 0.0;

        RiskLevel risk = RiskLevel.Low;
        if (highRisk > 2 || (total > 0 && (double)highRisk / total >= 0.4)) risk = RiskLevel.Critical;
        else if (highRisk > 0 || stalled > 0) risk = RiskLevel.High;
        else if (p.Tasks.Any(t => t.LatestRiskLevel == RiskLevel.Medium)) risk = RiskLevel.Medium;

        var detail = new ProjectDetailDto
        {
            Id = p.Id,
            Name = p.Name,
            Key = p.Key,
            Description = p.Description,
            StartDate = p.StartDate,
            TargetEndDate = p.TargetEndDate,
            ActualEndDate = p.ActualEndDate,
            BudgetHours = p.BudgetHours,
            IsActive = p.IsActive,
            RepositoryUrl = p.RepositoryUrl,
            GitHubRepoOwner = p.GitHubRepoOwner,
            GitHubRepoName = p.GitHubRepoName,
            CreatedAt = p.CreatedAt,
            TotalTasks = total,
            CompletedTasks = completed,
            StalledTasksCount = stalled,
            HighRiskTasksCount = highRisk,
            OverallProgressPercentage = Math.Round(progress, 1),
            OverallEvidenceScore = Math.Round(evidence, 1),
            TotalActualHours = Math.Round(p.Tasks.Sum(t => t.ActualHours), 1),
            TotalEstimatedHours = Math.Round(p.Tasks.Sum(t => t.EstimatedHours), 1),
            ProjectRiskLevel = risk,
            MemberCount = p.Members.Count,
            Members = p.Members.Select(m => new ProjectMemberDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                UserId = m.UserId,
                FullName = m.User?.FullName ?? "",
                Email = m.User?.Email ?? "",
                JobTitle = m.User?.JobTitle,
                RoleInProject = m.RoleInProject,
                JoinedAt = m.JoinedAt
            }).ToList(),
            Tasks = p.Tasks.Select(t => new TaskSummaryDto
            {
                Id = t.Id,
                TaskCode = t.TaskCode,
                Title = t.Title,
                ProjectId = t.ProjectId,
                ProjectName = p.Name,
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
            }).ToList()
        };

        return Ok(detail);
    }

    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto dto)
    {
        string key = dto.Key.Trim().ToUpperInvariant();
        if (await _context.Projects.AnyAsync(p => p.Key == key))
        {
            return BadRequest(new { message = $"A project with Key '{key}' already exists." });
        }

        var project = new Project
        {
            Name = dto.Name,
            Key = key,
            Description = dto.Description,
            StartDate = dto.StartDate,
            TargetEndDate = dto.TargetEndDate,
            BudgetHours = dto.BudgetHours,
            IsActive = true,
            RepositoryUrl = dto.RepositoryUrl,
            GitHubRepoOwner = dto.GitHubRepoOwner,
            GitHubRepoName = dto.GitHubRepoName,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(currentUserId))
        {
            _context.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = project.Id,
                UserId = currentUserId,
                RoleInProject = UserRoleType.ProjectManager
            });
        }

        if (dto.MemberUserIds != null)
        {
            foreach (var userId in dto.MemberUserIds.Where(u => u != currentUserId))
            {
                _context.ProjectMembers.Add(new ProjectMember
                {
                    ProjectId = project.Id,
                    UserId = userId,
                    RoleInProject = UserRoleType.Developer
                });
            }
        }
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            currentUserId,
            User.FindFirstValue(ClaimTypes.Email),
            "CreatedProject",
            "Project",
            project.Id.ToString(),
            new { project.Name, project.Key }
        );

        return CreatedAtAction(nameof(GetProjectById), new { id = project.Id }, new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Key = project.Key,
            Description = project.Description,
            StartDate = project.StartDate,
            TargetEndDate = project.TargetEndDate,
            BudgetHours = project.BudgetHours,
            IsActive = project.IsActive,
            RepositoryUrl = project.RepositoryUrl,
            GitHubRepoOwner = project.GitHubRepoOwner,
            GitHubRepoName = project.GitHubRepoName,
            CreatedAt = project.CreatedAt,
            MemberCount = project.Members.Count
        });
    }

    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDto dto)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();

        project.Name = dto.Name;
        project.Description = dto.Description;
        project.TargetEndDate = dto.TargetEndDate;
        project.BudgetHours = dto.BudgetHours;
        project.IsActive = dto.IsActive;
        project.RepositoryUrl = dto.RepositoryUrl;
        project.GitHubRepoOwner = dto.GitHubRepoOwner;
        project.GitHubRepoName = dto.GitHubRepoName;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            User.FindFirstValue(ClaimTypes.Email),
            "UpdatedProject",
            "Project",
            id.ToString(),
            dto
        );

        return NoContent();
    }

    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddProjectMemberDto dto)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();

        if (await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == id && pm.UserId == dto.UserId))
        {
            return BadRequest(new { message = "User is already a member of this project." });
        }

        var member = new ProjectMember
        {
            ProjectId = id,
            UserId = dto.UserId,
            RoleInProject = dto.RoleInProject,
            JoinedAt = DateTime.UtcNow
        };

        _context.ProjectMembers.Add(member);
        await _context.SaveChangesAsync();

        await _auditService.CreateNotificationAsync(
            dto.UserId,
            "Added to Project",
            $"You have been added to the project '{project.Name}'.",
            NotificationType.Info,
            $"/projects/{project.Id}"
        );

        return Ok(new { message = "Member added successfully." });
    }

    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(int id, string userId)
    {
        var member = await _context.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId);
        if (member == null) return NotFound();

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
