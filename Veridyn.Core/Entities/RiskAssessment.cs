using System.ComponentModel.DataAnnotations;
using Veridyn.Core.Enums;

namespace Veridyn.Core.Entities;

public class RiskAssessment
{
    public int Id { get; set; }

    public int? TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;

    public double ProgressEvidenceScore { get; set; }
    public bool IsPotentiallyStalled { get; set; }
    public double DelayProbability { get; set; }
    public RiskLevel RiskLevel { get; set; } = RiskLevel.Low;

    public double RuleBasedScore { get; set; }
    public double? MlPredictedScore { get; set; }
    
    [MaxLength(50)]
    public string CalculationMethod { get; set; } = "Hybrid";

    [MaxLength(2000)]
    public string RiskFactorsExplanationJson { get; set; } = "[]";

    public string? EvaluatedBy { get; set; } = "System";
}
