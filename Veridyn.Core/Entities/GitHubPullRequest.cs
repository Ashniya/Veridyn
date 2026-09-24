using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class GitHubPullRequest
{
    public int Id { get; set; }

    public int PrNumber { get; set; }

    [MaxLength(150)]
    public string RepositoryName { get; set; } = string.Empty;

    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(50)]
    public string State { get; set; } = "open";

    [MaxLength(100)]
    public string Author { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? MergedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    [MaxLength(250)]
    public string? HtmlUrl { get; set; }

    public int? TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    public string? MatchedTaskCode { get; set; }
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}
