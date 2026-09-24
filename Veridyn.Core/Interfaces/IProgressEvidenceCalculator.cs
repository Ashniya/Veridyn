using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;

namespace Veridyn.Core.Interfaces;

public interface IProgressEvidenceCalculator
{
    ProgressEvidenceScoreResultDto CalculateEvidence(TaskItem task);
}
