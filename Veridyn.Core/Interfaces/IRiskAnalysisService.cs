using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;

namespace Veridyn.Core.Interfaces;

public interface IRiskAnalysisService
{
    Task<RiskAssessmentDto> EvaluateTaskRiskAsync(int taskId, CancellationToken cancellationToken = default);
    Task<List<RiskAssessmentDto>> EvaluateProjectRiskAsync(int projectId, CancellationToken cancellationToken = default);
    Task<DashboardOverviewDto> GetDashboardOverviewAsync(string? userId = null, CancellationToken cancellationToken = default);
}
