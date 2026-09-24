using Veridyn.Core.DTOs;

namespace Veridyn.Core.Interfaces;

public interface IGitHubService
{
    Task<GitHubSyncResultDto> SyncRepositoryActivityAsync(int projectId, string? owner = null, string? repo = null, string? token = null, CancellationToken cancellationToken = default);
    Task<GitHubCommitDto> RecordCommitEvidenceAsync(CreateMockCommitDto dto, CancellationToken cancellationToken = default);
    string? ExtractTaskCode(string message, string? projectKey = null);
}
