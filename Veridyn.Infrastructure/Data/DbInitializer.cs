using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;
using Veridyn.Core.Interfaces;

namespace Veridyn.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedDataAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IRiskAnalysisService riskService)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Roles
        string[] roles = { "Admin", "ProjectManager", "Developer" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Seed Users
        if (!context.Users.Any())
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin@veridyn.com",
                Email = "admin@veridyn.com",
                FullName = "System Administrator",
                Role = UserRoleType.Admin,
                JobTitle = "Principal IT Admin",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(adminUser, "Admin@12345");
            await userManager.AddToRoleAsync(adminUser, "Admin");

            var pmUser = new ApplicationUser
            {
                UserName = "sarah.pm@veridyn.com",
                Email = "sarah.pm@veridyn.com",
                FullName = "Sarah Jenkins",
                Role = UserRoleType.ProjectManager,
                JobTitle = "Lead Agile Project Manager",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(pmUser, "Manager@12345");
            await userManager.AddToRoleAsync(pmUser, "ProjectManager");

            var pm2 = new ApplicationUser
            {
                UserName = "michael.pm@veridyn.com",
                Email = "michael.pm@veridyn.com",
                FullName = "Michael Chang",
                Role = UserRoleType.ProjectManager,
                JobTitle = "Technical Program Manager",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(pm2, "Manager@12345");
            await userManager.AddToRoleAsync(pm2, "ProjectManager");

            var dev1 = new ApplicationUser
            {
                UserName = "alex.dev@veridyn.com",
                Email = "alex.dev@veridyn.com",
                FullName = "Alex Rivera",
                Role = UserRoleType.Developer,
                JobTitle = "Senior Full-Stack Engineer",
                GitHubUsername = "arivera-dev",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(dev1, "Dev@12345");
            await userManager.AddToRoleAsync(dev1, "Developer");

            var dev2 = new ApplicationUser
            {
                UserName = "priya.dev@veridyn.com",
                Email = "priya.dev@veridyn.com",
                FullName = "Priya Sharma",
                Role = UserRoleType.Developer,
                JobTitle = "Cloud Infrastructure & Backend Engineer",
                GitHubUsername = "psharma-cloud",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(dev2, "Dev@12345");
            await userManager.AddToRoleAsync(dev2, "Developer");

            var dev3 = new ApplicationUser
            {
                UserName = "david.dev@veridyn.com",
                Email = "david.dev@veridyn.com",
                FullName = "David Kim",
                Role = UserRoleType.Developer,
                JobTitle = "Frontend React Specialist",
                GitHubUsername = "dkim-ui",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(dev3, "Dev@12345");
            await userManager.AddToRoleAsync(dev3, "Developer");
        }

        // 3. Seed Projects & Tasks if empty
        if (!context.Projects.Any())
        {
            var pmUser = await userManager.FindByEmailAsync("sarah.pm@veridyn.com");
            var pm2 = await userManager.FindByEmailAsync("michael.pm@veridyn.com");
            var dev1 = await userManager.FindByEmailAsync("alex.dev@veridyn.com");
            var dev2 = await userManager.FindByEmailAsync("priya.dev@veridyn.com");
            var dev3 = await userManager.FindByEmailAsync("david.dev@veridyn.com");

            var proj1 = new Project
            {
                Name = "Cloud Sentinel API Gateway",
                Key = "CSG",
                Description = "High-throughput edge API gateway with distributed token throttling, telemetry pipelines, and mTLS verification.",
                StartDate = DateTime.UtcNow.AddDays(-20),
                TargetEndDate = DateTime.UtcNow.AddDays(25),
                BudgetHours = 320,
                IsActive = true,
                RepositoryUrl = "https://github.com/veridyn-corp/cloud-sentinel-gateway",
                GitHubRepoOwner = "veridyn-corp",
                GitHubRepoName = "cloud-sentinel-gateway",
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            };

            var proj2 = new Project
            {
                Name = "FinTech Core Ledger v2",
                Key = "FTL",
                Description = "Double-entry bookkeeping and transaction settlement engine with strict idempotency and audit logs.",
                StartDate = DateTime.UtcNow.AddDays(-14),
                TargetEndDate = DateTime.UtcNow.AddDays(40),
                BudgetHours = 450,
                IsActive = true,
                RepositoryUrl = "https://github.com/veridyn-corp/fintech-core-ledger",
                GitHubRepoOwner = "veridyn-corp",
                GitHubRepoName = "fintech-core-ledger",
                CreatedAt = DateTime.UtcNow.AddDays(-14)
            };

            var proj3 = new Project
            {
                Name = "Intelligent Risk Engine ML Platform",
                Key = "IRE",
                Description = "Predictive risk modeling engine using developer signals, commit cadences, and task dependency graphs.",
                StartDate = DateTime.UtcNow.AddDays(-30),
                TargetEndDate = DateTime.UtcNow.AddDays(15),
                BudgetHours = 280,
                IsActive = true,
                RepositoryUrl = "https://github.com/veridyn-corp/intelligent-risk-engine",
                GitHubRepoOwner = "veridyn-corp",
                GitHubRepoName = "intelligent-risk-engine",
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };

            context.Projects.AddRange(proj1, proj2, proj3);
            await context.SaveChangesAsync();

            // Project Memberships
            if (pmUser != null && dev1 != null && dev2 != null && dev3 != null)
            {
                context.ProjectMembers.AddRange(
                    new ProjectMember { ProjectId = proj1.Id, UserId = pmUser.Id, RoleInProject = UserRoleType.ProjectManager },
                    new ProjectMember { ProjectId = proj1.Id, UserId = dev1.Id, RoleInProject = UserRoleType.Developer },
                    new ProjectMember { ProjectId = proj1.Id, UserId = dev2.Id, RoleInProject = UserRoleType.Developer },
                    new ProjectMember { ProjectId = proj1.Id, UserId = dev3.Id, RoleInProject = UserRoleType.Developer },
                    new ProjectMember { ProjectId = proj2.Id, UserId = pmUser.Id, RoleInProject = UserRoleType.ProjectManager },
                    new ProjectMember { ProjectId = proj2.Id, UserId = dev1.Id, RoleInProject = UserRoleType.Developer },
                    new ProjectMember { ProjectId = proj2.Id, UserId = dev2.Id, RoleInProject = UserRoleType.Developer },
                    new ProjectMember { ProjectId = proj3.Id, UserId = pm2?.Id ?? pmUser.Id, RoleInProject = UserRoleType.ProjectManager },
                    new ProjectMember { ProjectId = proj3.Id, UserId = dev1.Id, RoleInProject = UserRoleType.Developer },
                    new ProjectMember { ProjectId = proj3.Id, UserId = dev3.Id, RoleInProject = UserRoleType.Developer }
                );
                await context.SaveChangesAsync();
            }

            // Tasks for Project 1 (Cloud Sentinel Gateway)
            // Task 1: Completed Architecture
            var task1 = new TaskItem
            {
                ProjectId = proj1.Id,
                TaskCode = "CSG-101",
                Title = "Implement JWT and mTLS Auth Middleware",
                Description = "Setup ASP.NET Core middleware to validate asymmetric JWT tokens and enforce client mTLS certificates.",
                AssigneeId = dev1?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.Completed,
                Priority = PriorityLevel.Critical,
                ComplexityPoints = 6,
                EstimatedHours = 24,
                ActualHours = 22,
                ProgressPercentage = 100,
                StartDate = DateTime.UtcNow.AddDays(-18),
                DueDate = DateTime.UtcNow.AddDays(-5),
                CompletedDate = DateTime.UtcNow.AddDays(-6),
                ProgressEvidenceScore = 100,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Low,
                LatestDelayProbability = 0
            };

            // Task 2: Healthy In Progress
            var task2 = new TaskItem
            {
                ProjectId = proj1.Id,
                TaskCode = "CSG-102",
                Title = "Distributed Redis Token Bucket Rate Limiter",
                Description = "Develop Redis-backed sliding window rate limiter to throttle abusive IP calls at the edge gateway.",
                AssigneeId = dev2?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.InProgress,
                Priority = PriorityLevel.High,
                ComplexityPoints = 5,
                EstimatedHours = 20,
                ActualHours = 12,
                ProgressPercentage = 65,
                StartDate = DateTime.UtcNow.AddDays(-7),
                DueDate = DateTime.UtcNow.AddDays(5),
                ProgressEvidenceScore = 80,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Low,
                LatestDelayProbability = 14
            };

            // Task 3: Potentially Stalled Task (In Progress, high reported progress, 0 commits, approaching deadline, 0 subtasks done)
            var task3 = new TaskItem
            {
                ProjectId = proj1.Id,
                TaskCode = "CSG-103",
                Title = "Prometheus Metrics & OpenTelemetry Exporter",
                Description = "Instrument HTTP request pipeline to emit Prometheus metrics and OpenTelemetry trace spans to Jaeger collector.",
                AssigneeId = dev3?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.InProgress,
                Priority = PriorityLevel.High,
                ComplexityPoints = 7,
                EstimatedHours = 28,
                ActualHours = 4,
                ProgressPercentage = 60, // Reported 60% but no evidence!
                StartDate = DateTime.UtcNow.AddDays(-10),
                DueDate = DateTime.UtcNow.AddDays(2), // Imminent deadline!
                ProgressEvidenceScore = 12,
                IsPotentiallyStalled = true,
                LatestRiskLevel = RiskLevel.High,
                LatestDelayProbability = 68,
                RiskExplanationSummary = "Flagged as Potentially Stalled: Zero commits or logs in last 7 days; reported progress (60%) sharply conflicts with evidence (12%)."
            };

            // Task 4: High Risk Overrun & Blocked Task
            var task4 = new TaskItem
            {
                ProjectId = proj1.Id,
                TaskCode = "CSG-104",
                Title = "gRPC Payload Schema Validation Pipeline",
                Description = "Validate incoming Protobuf and JSON payloads against schema registries with strict backward compatibility rules.",
                AssigneeId = dev1?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.InProgress,
                Priority = PriorityLevel.Critical,
                ComplexityPoints = 9,
                EstimatedHours = 16,
                ActualHours = 32, // 100% hours overrun!
                ProgressPercentage = 35,
                StartDate = DateTime.UtcNow.AddDays(-12),
                DueDate = DateTime.UtcNow.AddDays(-2), // Overdue!
                ProgressEvidenceScore = 28,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Critical,
                LatestDelayProbability = 86,
                RiskExplanationSummary = "Task is overdue by 2 days with 100% budget hours overrun (32h logged vs 16h estimated) and low progress."
            };

            // Task 5: Blocked by CSG-104
            var task5 = new TaskItem
            {
                ProjectId = proj1.Id,
                TaskCode = "CSG-105",
                Title = "End-to-End Gateway Integration Test Suite",
                Description = "Automated integration test suite running in GitHub Actions with mock upstream downstream services.",
                AssigneeId = dev2?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.Blocked,
                Priority = PriorityLevel.Medium,
                ComplexityPoints = 4,
                EstimatedHours = 18,
                ActualHours = 2,
                ProgressPercentage = 10,
                StartDate = DateTime.UtcNow.AddDays(-4),
                DueDate = DateTime.UtcNow.AddDays(14),
                ProgressEvidenceScore = 15,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Medium,
                LatestDelayProbability = 42
            };

            // Task 6: FinTech Project Task
            var task6 = new TaskItem
            {
                ProjectId = proj2.Id,
                TaskCode = "FTL-201",
                Title = "Postgres Idempotent Ledger Transaction Writer",
                Description = "Implement transactional outbox pattern for settlement events with cryptographic signature verification.",
                AssigneeId = dev1?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.InProgress,
                Priority = PriorityLevel.High,
                ComplexityPoints = 8,
                EstimatedHours = 30,
                ActualHours = 18,
                ProgressPercentage = 50,
                StartDate = DateTime.UtcNow.AddDays(-8),
                DueDate = DateTime.UtcNow.AddDays(12),
                ProgressEvidenceScore = 65,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Low,
                LatestDelayProbability = 20
            };

            // Task 7: FinTech Project Task
            var task7 = new TaskItem
            {
                ProjectId = proj2.Id,
                TaskCode = "FTL-202",
                Title = "Automated Reconciliation & Discrepancy Alerting",
                Description = "Nightly reconciliation cron worker matching bank settlement files against internal ledger balances.",
                AssigneeId = dev2?.Id,
                CreatorId = pmUser?.Id,
                Status = TaskItemStatus.ToDo,
                Priority = PriorityLevel.Medium,
                ComplexityPoints = 6,
                EstimatedHours = 24,
                ActualHours = 0,
                ProgressPercentage = 0,
                StartDate = DateTime.UtcNow.AddDays(2),
                DueDate = DateTime.UtcNow.AddDays(20),
                ProgressEvidenceScore = 0,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Low,
                LatestDelayProbability = 8
            };

            // Task 8: Risk Engine ML Platform Task
            var task8 = new TaskItem
            {
                ProjectId = proj3.Id,
                TaskCode = "IRE-301",
                Title = "Scikit-Learn Delay Prediction Classifier Pipeline",
                Description = "Train and evaluate RandomForest and GradientBoosting regressors on historical developer activity signals.",
                AssigneeId = dev1?.Id,
                CreatorId = pm2?.Id ?? pmUser?.Id,
                Status = TaskItemStatus.InProgress,
                Priority = PriorityLevel.High,
                ComplexityPoints = 7,
                EstimatedHours = 25,
                ActualHours = 15,
                ProgressPercentage = 70,
                StartDate = DateTime.UtcNow.AddDays(-10),
                DueDate = DateTime.UtcNow.AddDays(4),
                ProgressEvidenceScore = 85,
                IsPotentiallyStalled = false,
                LatestRiskLevel = RiskLevel.Low,
                LatestDelayProbability = 12
            };

            context.TaskItems.AddRange(task1, task2, task3, task4, task5, task6, task7, task8);
            await context.SaveChangesAsync();

            // Task Dependencies (CSG-105 is blocked by CSG-104)
            context.TaskDependencies.AddRange(
                new TaskDependency { TaskItemId = task5.Id, DependsOnTaskId = task4.Id, Type = DependencyType.Blocks, IsBlocking = true },
                new TaskDependency { TaskItemId = task2.Id, DependsOnTaskId = task1.Id, Type = DependencyType.FinishToStart, IsBlocking = false }
            );

            // Subtasks
            context.Subtasks.AddRange(
                new Subtask { TaskItemId = task1.Id, Title = "JWT token handler", IsCompleted = true, CompletedAt = DateTime.UtcNow.AddDays(-12), OrderIndex = 1 },
                new Subtask { TaskItemId = task1.Id, Title = "mTLS certificate check", IsCompleted = true, CompletedAt = DateTime.UtcNow.AddDays(-7), OrderIndex = 2 },
                new Subtask { TaskItemId = task2.Id, Title = "Redis connection pool", IsCompleted = true, CompletedAt = DateTime.UtcNow.AddDays(-5), OrderIndex = 1 },
                new Subtask { TaskItemId = task2.Id, Title = "Sliding window Lua script", IsCompleted = true, CompletedAt = DateTime.UtcNow.AddDays(-2), OrderIndex = 2 },
                new Subtask { TaskItemId = task2.Id, Title = "Unit tests with TestContainers", IsCompleted = false, OrderIndex = 3 },
                new Subtask { TaskItemId = task3.Id, Title = "Prometheus middleware config", IsCompleted = false, OrderIndex = 1 },
                new Subtask { TaskItemId = task3.Id, Title = "OTel Jaeger trace exporter", IsCompleted = false, OrderIndex = 2 },
                new Subtask { TaskItemId = task4.Id, Title = "Protobuf validator", IsCompleted = true, CompletedAt = DateTime.UtcNow.AddDays(-8), OrderIndex = 1 },
                new Subtask { TaskItemId = task4.Id, Title = "Schema registry caching", IsCompleted = false, OrderIndex = 2 }
            );

            // Work Logs
            context.WorkLogs.AddRange(
                new WorkLog { TaskItemId = task1.Id, UserId = dev1?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-12), HoursSpent = 10, Description = "Created JWT token validation handler and certificate resolver." },
                new WorkLog { TaskItemId = task1.Id, UserId = dev1?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-7), HoursSpent = 12, Description = "Added mTLS validation and wrote unit tests." },
                new WorkLog { TaskItemId = task2.Id, UserId = dev2?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-4), HoursSpent = 6, Description = "Setup Redis stack connection multiplexer and baseline middleware." },
                new WorkLog { TaskItemId = task2.Id, UserId = dev2?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-1), HoursSpent = 6, Description = "Implemented sliding window Lua script for distributed throttling." },
                new WorkLog { TaskItemId = task3.Id, UserId = dev3?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-9), HoursSpent = 4, Description = "Initial research on OpenTelemetry .NET SDK package updates." },
                new WorkLog { TaskItemId = task4.Id, UserId = dev1?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-8), HoursSpent = 14, Description = "Wrote Protobuf serialization layer. Encountered schema drift blockers.", BlockersEncountered = "Upstream schema registry breaking changes." },
                new WorkLog { TaskItemId = task4.Id, UserId = dev1?.Id ?? "", WorkDate = DateTime.UtcNow.AddDays(-3), HoursSpent = 18, Description = "Debugging complex gRPC payload compatibility issues with team.", BlockersEncountered = "Awaiting upstream payload specifications from external partner." }
            );

            // Daily Progress Updates
            context.DailyProgressUpdates.AddRange(
                new DailyProgressUpdate { TaskItemId = task2.Id, UserId = dev2?.Id ?? "", UpdateDate = DateTime.UtcNow.AddDays(-1), ReportedProgressPercentage = 65, Summary = "Completed Lua rate limit script. Now integrating TestContainers for CI." },
                new DailyProgressUpdate { TaskItemId = task3.Id, UserId = dev3?.Id ?? "", UpdateDate = DateTime.UtcNow.AddDays(-8), ReportedProgressPercentage = 60, Summary = "Working on telemetry pipeline.", BlockersDescription = "Awaiting collector credentials from DevOps." },
                new DailyProgressUpdate { TaskItemId = task4.Id, UserId = dev1?.Id ?? "", UpdateDate = DateTime.UtcNow.AddDays(-1), ReportedProgressPercentage = 35, Summary = "Spent all day attempting to resolve binary Protobuf decoding bugs.", BlockersDescription = "Blocked on schema compatibility specs." }
            );

            // GitHub Commits & PRs
            context.GitHubCommits.AddRange(
                new GitHubCommit { TaskItemId = task1.Id, CommitSha = "a7b3c91d4e", RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Message = "[CSG-101] Feat: Add JWT token authentication middleware and X.509 cert validation", AuthorName = "Alex Rivera", CommitDate = DateTime.UtcNow.AddDays(-12), LinesAdded = 240, LinesDeleted = 15, MatchedTaskCode = "CSG-101" },
                new GitHubCommit { TaskItemId = task1.Id, CommitSha = "b8c4d02e5f", RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Message = "[CSG-101] Test: Add unit and integration tests for mTLS handshake", AuthorName = "Alex Rivera", CommitDate = DateTime.UtcNow.AddDays(-7), LinesAdded = 185, LinesDeleted = 8, MatchedTaskCode = "CSG-101" },
                new GitHubCommit { TaskItemId = task2.Id, CommitSha = "c9d5e13f6a", RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Message = "[CSG-102] Feat: Setup Redis connection multiplexer and sliding window limiter", AuthorName = "Priya Sharma", CommitDate = DateTime.UtcNow.AddDays(-3), LinesAdded = 310, LinesDeleted = 24, MatchedTaskCode = "CSG-102" },
                new GitHubCommit { TaskItemId = task2.Id, CommitSha = "d0e6f24a7b", RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Message = "[CSG-102] Refactor: Optimize Lua script execution and memory allocation", AuthorName = "Priya Sharma", CommitDate = DateTime.UtcNow.AddDays(-1), LinesAdded = 95, LinesDeleted = 40, MatchedTaskCode = "CSG-102" },
                new GitHubCommit { TaskItemId = task4.Id, CommitSha = "e1f7a35b8c", RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Message = "[CSG-104] WIP: Initial schema validator for incoming gRPC packets", AuthorName = "Alex Rivera", CommitDate = DateTime.UtcNow.AddDays(-8), LinesAdded = 120, LinesDeleted = 10, MatchedTaskCode = "CSG-104" },
                new GitHubCommit { TaskItemId = task6.Id, CommitSha = "f2a8b46c9d", RepositoryName = "veridyn-corp/fintech-core-ledger", Message = "[FTL-201] Feat: Add transactional outbox table and idempotency filter", AuthorName = "Alex Rivera", CommitDate = DateTime.UtcNow.AddDays(-4), LinesAdded = 410, LinesDeleted = 35, MatchedTaskCode = "FTL-201" },
                new GitHubCommit { TaskItemId = task8.Id, CommitSha = "a3b9c57d0e", RepositoryName = "veridyn-corp/intelligent-risk-engine", Message = "[IRE-301] Feat: Add feature engineering pipeline and RandomForest trainer", AuthorName = "Alex Rivera", CommitDate = DateTime.UtcNow.AddDays(-2), LinesAdded = 520, LinesDeleted = 45, MatchedTaskCode = "IRE-301" }
            );

            context.GitHubPullRequests.AddRange(
                new GitHubPullRequest { TaskItemId = task1.Id, PrNumber = 14, RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Title = "[CSG-101] JWT and mTLS Auth Middleware Implementation", State = "merged", Author = "arivera-dev", CreatedAt = DateTime.UtcNow.AddDays(-10), MergedAt = DateTime.UtcNow.AddDays(-6), MatchedTaskCode = "CSG-101" },
                new GitHubPullRequest { TaskItemId = task2.Id, PrNumber = 18, RepositoryName = "veridyn-corp/cloud-sentinel-gateway", Title = "[CSG-102] Redis Token Bucket Rate Limiting Engine", State = "open", Author = "psharma-cloud", CreatedAt = DateTime.UtcNow.AddDays(-2), MatchedTaskCode = "CSG-102" }
            );

            await context.SaveChangesAsync();

            // Run initial risk evaluation across seeded tasks
            try
            {
                await riskService.EvaluateProjectRiskAsync(proj1.Id);
                await riskService.EvaluateProjectRiskAsync(proj2.Id);
                await riskService.EvaluateProjectRiskAsync(proj3.Id);
            }
            catch
            {
                // Fallback graceful
            }
        }
    }
}
