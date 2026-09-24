using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Veridyn.Core.DTOs;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RiskAnalysisController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRiskAnalysisService _riskService;

    public RiskAnalysisController(ApplicationDbContext context, IRiskAnalysisService riskService)
    {
        _context = context;
        _riskService = riskService;
    }

    [HttpPost("evaluate-task/{taskId}")]
    public async Task<ActionResult<RiskAssessmentDto>> EvaluateTask(int taskId)
    {
        return Ok(await _riskService.EvaluateTaskRiskAsync(taskId));
    }

    [HttpPost("evaluate-project/{projectId}")]
    public async Task<ActionResult<List<RiskAssessmentDto>>> EvaluateProject(int projectId)
    {
        return Ok(await _riskService.EvaluateProjectRiskAsync(projectId));
    }

    [HttpGet("task/{taskId}/history")]
    public async Task<ActionResult<List<RiskAssessmentDto>>> GetTaskRiskHistory(int taskId)
    {
        var assessments = await _context.RiskAssessments
            .Include(r => r.TaskItem)
            .Include(r => r.Project)
            .Where(r => r.TaskItemId == taskId)
            .OrderByDescending(r => r.AssessmentDate)
            .Take(20)
            .ToListAsync();

        return Ok(assessments.Select(r => new RiskAssessmentDto
        {
            Id = r.Id,
            TaskItemId = r.TaskItemId,
            TaskCode = r.TaskItem?.TaskCode,
            TaskTitle = r.TaskItem?.Title,
            ProjectId = r.ProjectId,
            ProjectName = r.Project?.Name,
            AssessmentDate = r.AssessmentDate,
            ProgressEvidenceScore = r.ProgressEvidenceScore,
            IsPotentiallyStalled = r.IsPotentiallyStalled,
            DelayProbability = r.DelayProbability,
            RiskLevel = r.RiskLevel,
            RuleBasedScore = r.RuleBasedScore,
            MlPredictedScore = r.MlPredictedScore,
            CalculationMethod = r.CalculationMethod,
            RiskFactors = JsonSerializer.Deserialize<List<RiskFactorExplanationDto>>(r.RiskFactorsExplanationJson) ?? new(),
            EvaluatedBy = r.EvaluatedBy
        }).ToList());
    }
}
