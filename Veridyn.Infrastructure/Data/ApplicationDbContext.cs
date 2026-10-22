using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.Entities;

namespace Veridyn.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();
    public DbSet<Subtask> Subtasks => Set<Subtask>();
    public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
    public DbSet<WorkLog> WorkLogs => Set<WorkLog>();
    public DbSet<DailyProgressUpdate> DailyProgressUpdates => Set<DailyProgressUpdate>();
    public DbSet<GitHubCommit> GitHubCommits => Set<GitHubCommit>();
    public DbSet<GitHubPullRequest> GitHubPullRequests => Set<GitHubPullRequest>();
    public DbSet<RiskAssessment> RiskAssessments => Set<RiskAssessment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ProjectNote> ProjectNotes => Set<ProjectNote>();
    public DbSet<ProjectMessage> ProjectMessages => Set<ProjectMessage>();
    public DbSet<Announcement> Announcements => Set<Announcement>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Project
        builder.Entity<Project>(entity =>
        {
            entity.HasIndex(p => p.Key).IsUnique();
        });

        // ProjectMember
        builder.Entity<ProjectMember>(entity =>
        {
            entity.HasOne(pm => pm.Project)
                  .WithMany(p => p.Members)
                  .HasForeignKey(pm => pm.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pm => pm.User)
                  .WithMany(u => u.ProjectMemberships)
                  .HasForeignKey(pm => pm.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(pm => new { pm.ProjectId, pm.UserId }).IsUnique();
        });

        // TaskItem
        builder.Entity<TaskItem>(entity =>
        {
            entity.HasIndex(t => t.TaskCode).IsUnique();
            entity.HasIndex(t => t.ProjectId);
            entity.HasIndex(t => t.AssigneeId);

            entity.HasOne(t => t.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(t => t.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Assignee)
                  .WithMany(u => u.AssignedTasks)
                  .HasForeignKey(t => t.AssigneeId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.Creator)
                  .WithMany()
                  .HasForeignKey(t => t.CreatorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Subtask
        builder.Entity<Subtask>(entity =>
        {
            entity.HasOne(s => s.TaskItem)
                  .WithMany(t => t.Subtasks)
                  .HasForeignKey(s => s.TaskItemId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TaskDependency
        builder.Entity<TaskDependency>(entity =>
        {
            entity.HasOne(d => d.TaskItem)
                  .WithMany(t => t.Dependencies)
                  .HasForeignKey(d => d.TaskItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.DependsOnTask)
                  .WithMany(t => t.Successors)
                  .HasForeignKey(d => d.DependsOnTaskId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(d => new { d.TaskItemId, d.DependsOnTaskId }).IsUnique();
        });

        // WorkLog
        builder.Entity<WorkLog>(entity =>
        {
            entity.HasOne(w => w.TaskItem)
                  .WithMany(t => t.WorkLogs)
                  .HasForeignKey(w => w.TaskItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(w => w.User)
                  .WithMany(u => u.WorkLogs)
                  .HasForeignKey(w => w.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // DailyProgressUpdate
        builder.Entity<DailyProgressUpdate>(entity =>
        {
            entity.HasOne(d => d.TaskItem)
                  .WithMany(t => t.DailyProgressUpdates)
                  .HasForeignKey(d => d.TaskItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.User)
                  .WithMany(u => u.DailyProgressUpdates)
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // GitHubCommit
        builder.Entity<GitHubCommit>(entity =>
        {
            entity.HasIndex(c => c.CommitSha);
            entity.HasOne(c => c.TaskItem)
                  .WithMany(t => t.GitHubCommits)
                  .HasForeignKey(c => c.TaskItemId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // GitHubPullRequest
        builder.Entity<GitHubPullRequest>(entity =>
        {
            entity.HasOne(pr => pr.TaskItem)
                  .WithMany(t => t.PullRequests)
                  .HasForeignKey(pr => pr.TaskItemId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // RiskAssessment
        builder.Entity<RiskAssessment>(entity =>
        {
            entity.HasOne(r => r.TaskItem)
                  .WithMany(t => t.RiskAssessments)
                  .HasForeignKey(r => r.TaskItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.Project)
                  .WithMany(p => p.RiskAssessments)
                  .HasForeignKey(r => r.ProjectId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification
        builder.Entity<Notification>(entity =>
        {
            entity.HasOne(n => n.User)
                  .WithMany(u => u.Notifications)
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        // Announcement
        builder.Entity<Announcement>(entity =>
        {
            entity.HasOne(a => a.Project)
                  .WithMany()
                  .HasForeignKey(a => a.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Author)
                  .WithMany()
                  .HasForeignKey(a => a.AuthorId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => a.ProjectId);
        });
    }
}