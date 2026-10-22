using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Veridyn.Core.DTOs;
using Veridyn.Core.Entities;
using Veridyn.Core.Enums;
using Veridyn.Core.Interfaces;
using Veridyn.Infrastructure.Data;

namespace Veridyn.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _auditService;
    private readonly IEmailService _emailService;
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        IAuditService auditService,
        IEmailService emailService,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _auditService = auditService;
        _emailService = emailService;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "User account has been deactivated." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var authClaims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
        {
            authClaims.Add(new Claim(ClaimTypes.Role, role));
        }

        var jwtKey = _configuration["Jwt:Key"] ?? "VeridynSecureSecretKeyForJwtAuthentication2026!@#$%^";
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var expires = DateTime.UtcNow.AddDays(7);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "Veridyn",
            audience: _configuration["Jwt:Audience"] ?? "VeridynClient",
            expires: expires,
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        await _auditService.LogAsync(user.Id, user.Email, "UserLogin", "User", user.Id, ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Expiration = expires,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FullName = user.FullName,
                Role = Enum.TryParse<UserRoleType>(roles.FirstOrDefault() ?? "Developer", out var parsedRole) ? parsedRole : UserRoleType.Developer,
                JobTitle = user.JobTitle,
                AvatarUrl = user.AvatarUrl,
                GitHubUsername = user.GitHubUsername,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        // Enforce role hierarchy: Project Managers can only create Developers
        var isManager = User.IsInRole("ProjectManager");
        if (isManager && request.Role != UserRoleType.Developer)
        {
            return StatusCode(403, new { message = "Project Managers are only authorized to create Developer accounts." });
        }

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
        {
            return BadRequest(new { message = "A user with this email address already exists." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            Role = request.Role,
            JobTitle = request.JobTitle,
            GitHubUsername = request.GitHubUsername,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        string tempPassword = string.IsNullOrWhiteSpace(request.Password)
            ? $"Vrd#{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}!9"
            : request.Password;

        var result = await _userManager.CreateAsync(user, tempPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        string roleName = request.Role.ToString();
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }
        await _userManager.AddToRoleAsync(user, roleName);

        // Dispatch invitation email with temporary login password
        await _emailService.SendInvitationEmailAsync(user.Email!, user.FullName, roleName, tempPassword);

        await _auditService.LogAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "System",
            User.FindFirstValue(ClaimTypes.Email) ?? "System",
            "UserCreated",
            "User",
            user.Id,
            new { CreatedUser = user.Email, AssignedRole = roleName }
        );

        return Ok(new
        {
            message = $"User {user.FullName} ({user.Email}) created successfully as {roleName}. Invitation email dispatched with login credentials.",
            temporaryPassword = tempPassword,
            recipientEmail = user.Email,
            emailSent = true,
            user = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FullName = user.FullName,
                Role = user.Role,
                JobTitle = user.JobTitle,
                AvatarUrl = user.AvatarUrl,
                GitHubUsername = user.GitHubUsername,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [AllowAnonymous]
    [HttpPost("register-admin")]
    public async Task<ActionResult<AuthResponse>> RegisterAdmin([FromBody] RegisterRequest request)
    {
        request.Role = UserRoleType.Admin;
        
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
        {
            return BadRequest(new { message = "A user with this email address already exists." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            Role = request.Role,
            JobTitle = request.JobTitle,
            GitHubUsername = request.GitHubUsername,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password ?? "Admin#2026!Secure");
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        string roleName = request.Role.ToString();
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }
        await _userManager.AddToRoleAsync(user, roleName);

        return await Login(new LoginRequest { Email = request.Email, Password = request.Password ?? "Admin#2026!Secure" });
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "User not authenticated" });

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        await _auditService.LogAsync(
            userId,
            user.Email ?? "",
            "PasswordChanged",
            "User",
            user.Id,
            new { ChangedAt = DateTime.UtcNow }
        );

        return Ok(new { message = "Password changed successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? "",
            FullName = user.FullName,
            Role = user.Role,
            JobTitle = user.JobTitle,
            AvatarUrl = user.AvatarUrl,
            GitHubUsername = user.GitHubUsername,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    [Authorize]
    [HttpGet("users")]
    public async Task<ActionResult<List<UserDto>>> GetAllUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.FullName)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email ?? "",
                FullName = u.FullName,
                Role = u.Role,
                JobTitle = u.JobTitle,
                AvatarUrl = u.AvatarUrl,
                GitHubUsername = u.GitHubUsername,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("change-role")]
    public async Task<IActionResult> ChangeUserRole([FromBody] ChangeUserRoleRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null) return NotFound(new { message = "User not found" });

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);

        string newRoleName = request.NewRole.ToString();
        if (!await _roleManager.RoleExistsAsync(newRoleName))
        {
            await _roleManager.CreateAsync(new IdentityRole(newRoleName));
        }
        await _userManager.AddToRoleAsync(user, newRoleName);

        user.Role = request.NewRole;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            User.FindFirstValue(ClaimTypes.Email),
            "ChangedUserRole",
            "User",
            user.Id,
            new { NewRole = newRoleName }
        );

        return Ok(new { message = $"User role updated to {newRoleName} successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == id)
        {
            return BadRequest(new { message = "You cannot delete your own administrator account." });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        if (user.Email?.ToLowerInvariant() == "admin@veridyn.com")
        {
            return BadRequest(new { message = "The primary System Administrator cannot be deleted." });
        }

        // Remove from all project memberships
        var projectMembers = await _context.ProjectMembers.Where(pm => pm.UserId == id).ToListAsync();
        _context.ProjectMembers.RemoveRange(projectMembers);

        // Unassign any tasks assigned to this user
        var assignedTasks = await _context.TaskItems.Where(t => t.AssigneeId == id).ToListAsync();
        foreach (var task in assignedTasks)
        {
            task.AssigneeId = null;
        }

        // Remove worklogs
        var workLogs = await _context.WorkLogs.Where(w => w.UserId == id).ToListAsync();
        _context.WorkLogs.RemoveRange(workLogs);

        // Remove audit logs and notifications for user
        var notifications = await _context.Notifications.Where(n => n.UserId == id).ToListAsync();
        _context.Notifications.RemoveRange(notifications);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            currentUserId ?? "System",
            User.FindFirstValue(ClaimTypes.Email) ?? "System",
            "UserDeleted",
            "User",
            id,
            new { DeletedUser = user.Email, user.FullName }
        );

        return Ok(new { message = $"User {user.FullName} ({user.Email}) has been deleted successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        var tempPassword = $"Vrd#{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}!9";
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var roleName = roles.FirstOrDefault() ?? user.Role.ToString();

        // Dispatch email
        await _emailService.SendInvitationEmailAsync(user.Email!, user.FullName, roleName, tempPassword);

        return Ok(new
        {
            message = $"Password reset for {user.FullName}. New temporary password generated.",
            temporaryPassword = tempPassword,
            recipientEmail = user.Email
        });
    }
}
