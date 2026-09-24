using System.ComponentModel.DataAnnotations;

namespace Veridyn.Core.Entities;

public class GitHubCommit
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string CommitSha { get; set; } = string.Empty;

    [MaxLength(150)]
    public string RepositoryName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(100)]
    public string AuthorName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? AuthorEmail { get; set; }

    public DateTime CommitDate { get; set; }
    public int LinesAdded { get; set; } = 0;
    public int LinesDeleted { get; set; } = 0;

    [MaxLength(250)]
    public string? HtmlUrl { get; set; }

    public int? TaskItemId { get; set; }
    public TaskItem? TaskItem { get; set; }

    public string? MatchedTaskCode { get; set; }
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}
