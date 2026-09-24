using Veridyn.Core.Entities;

namespace Veridyn.Core.Interfaces;

public class MlPredictionResult
{
    public double DelayProbability { get; set; }
    public string PredictedRiskLevel { get; set; } = "Low";
    public List<string> TopContributingFeatures { get; set; } = new();
    public bool IsMlModelAvailable { get; set; }
}

public interface IMlPredictionService
{
    Task<MlPredictionResult> PredictTaskDelayAsync(TaskItem task, double evidenceScore, CancellationToken cancellationToken = default);
}
