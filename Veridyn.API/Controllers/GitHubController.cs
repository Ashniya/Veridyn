using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.DTOs;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GitHubController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IGitHubService _githubService;
    private readonly IRiskAnalysisService _riskService;

    public GitHubController(ApplicationDbContext context, IGitHubService githubService, IRiskAnalysisService riskService)
    {
        _context = context;
        _githubService = githubService;
        _riskService = riskService;
    }

    [HttpPost("sync")]
    public async Task<ActionResult<GitHubSyncResultDto>> SyncGitHub([FromBody] GitHubSyncRequestDto request)
    {
        var result = await _githubService.SyncRepositoryActivityAsync(request.ProjectId, request.RepositoryOwner, request.RepositoryName, request.PersonalAccessToken);
        await _riskService.EvaluateProjectRiskAsync(request.ProjectId);
        return Ok(result);
    }

    [HttpPost("record-commit")]
    public async Task<ActionResult<GitHubCommitDto>> RecordCommitEvidence([FromBody] CreateMockCommitDto dto)
    {
        var commit = await _githubService.RecordCommitEvidenceAsync(dto);
        await _riskService.EvaluateTaskRiskAsync(dto.TaskItemId);
        return Ok(commit);
    }

    [HttpGet("commits")]
    public async Task<ActionResult<List<GitHubCommitDto>>> GetCommits([FromQuery] int? projectId, [FromQuery] int? taskId)
    {
        var query = _context.GitHubCommits.Include(c => c.TaskItem).AsQueryable();
        if (taskId.HasValue) query = query.Where(c => c.TaskItemId == taskId.Value);
        else if (projectId.HasValue) query = query.Where(c => c.TaskItem != null && c.TaskItem.ProjectId == projectId.Value);
        var list = await query.OrderByDescending(c => c.CommitDate).Take(100).ToListAsync();
        return Ok(list.Select(c => new GitHubCommitDto
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
        }).ToList());
    }

    [HttpGet("pull-requests")]
    public async Task<ActionResult<List<GitHubPullRequestDto>>> GetPullRequests([FromQuery] int? projectId, [FromQuery] int? taskId)
    {
        var query = _context.GitHubPullRequests.Include(p => p.TaskItem).AsQueryable();
        if (taskId.HasValue) query = query.Where(p => p.TaskItemId == taskId.Value);
        else if (projectId.HasValue) query = query.Where(p => p.TaskItem != null && p.TaskItem.ProjectId == projectId.Value);
        var list = await query.OrderByDescending(p => p.CreatedAt).Take(50).ToListAsync();
        return Ok(list.Select(p => new GitHubPullRequestDto
        {
            Id = p.Id,
            PrNumber = p.PrNumber,
            RepositoryName = p.RepositoryName,
            Title = p.Title,
            State = p.State,
            Author = p.Author,
            CreatedAt = p.CreatedAt,
            MergedAt = p.MergedAt,
            ClosedAt = p.ClosedAt,
            HtmlUrl = p.HtmlUrl,
            TaskItemId = p.TaskItemId,
            MatchedTaskCode = p.MatchedTaskCode,
            SyncedAt = p.SyncedAt
        }).ToList());
    }
}
