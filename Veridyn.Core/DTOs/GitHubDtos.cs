namespace Veridyn.Core.DTOs;

public class GitHubCommitDto
{
    public int Id { get; set; }
    public string CommitSha { get; set; } = string.Empty;
    public string RepositoryName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorEmail { get; set; }
    public DateTime CommitDate { get; set; }
    public int LinesAdded { get; set; }
    public int LinesDeleted { get; set; }
    public string? HtmlUrl { get; set; }
    public int? TaskItemId { get; set; }
    public string? MatchedTaskCode { get; set; }
    public DateTime SyncedAt { get; set; }
}

public class GitHubPullRequestDto
{
    public int Id { get; set; }
    public int PrNumber { get; set; }
    public string RepositoryName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? MergedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? HtmlUrl { get; set; }
    public int? TaskItemId { get; set; }
    public string? MatchedTaskCode { get; set; }
    public DateTime SyncedAt { get; set; }
}

public class GitHubSyncRequestDto
{
    public int ProjectId { get; set; }
    public string? RepositoryOwner { get; set; }
    public string? RepositoryName { get; set; }
    public string? PersonalAccessToken { get; set; }
}

public class GitHubSyncResultDto
{
    public int CommitsSynced { get; set; }
    public int PullRequestsSynced { get; set; }
    public int AssociatedTasksCount { get; set; }
    public List<string> MatchedTasks { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

public class CreateMockCommitDto
{
    public int TaskItemId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public int LinesAdded { get; set; } = 25;
    public int LinesDeleted { get; set; } = 5;
}
