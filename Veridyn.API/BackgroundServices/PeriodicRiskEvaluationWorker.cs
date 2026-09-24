using Microsoft.EntityFrameworkCore;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.BackgroundServices;

public class PeriodicRiskEvaluationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PeriodicRiskEvaluationWorker> _logger;

    public PeriodicRiskEvaluationWorker(IServiceProvider serviceProvider, ILogger<PeriodicRiskEvaluationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Veridyn Periodic Risk Evaluation Worker started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var riskService = scope.ServiceProvider.GetRequiredService<IRiskAnalysisService>();
                var activeProjects = await context.Projects.Where(p => p.IsActive).Select(p => p.Id).ToListAsync(stoppingToken);
                foreach (var projectId in activeProjects)
                {
                    await riskService.EvaluateProjectRiskAsync(projectId, stoppingToken);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _logger.LogError(ex, "Error in PeriodicRiskEvaluationWorker"); }
        }
    }
}
