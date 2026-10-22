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

        // 2. Seed Only System Administrator (Clean slate - no fake projects or mock users)
        // Ensure admin@alliure.com always exists with password Admin@12345
        var adminEmail = "admin@alliure.com";
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);

        // If old admin@veridyn.com exists, migrate it to admin@alliure.com
        var oldAdmin = await userManager.FindByEmailAsync("admin@veridyn.com");
        if (oldAdmin != null && existingAdmin == null)
        {
            oldAdmin.Email = adminEmail;
            oldAdmin.UserName = adminEmail;
            await userManager.UpdateAsync(oldAdmin);
            existingAdmin = oldAdmin;
        }

        if (existingAdmin == null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                Role = UserRoleType.Admin,
                JobTitle = "Principal IT Admin",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(adminUser, "Admin@12345");
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
        else
        {
            // Always guarantee the admin password is Admin@12345
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(existingAdmin);
            await userManager.ResetPasswordAsync(existingAdmin, resetToken, "Admin@12345");
            if (!await userManager.IsInRoleAsync(existingAdmin, "Admin"))
            {
                await userManager.AddToRoleAsync(existingAdmin, "Admin");
            }
        }
    }
}
