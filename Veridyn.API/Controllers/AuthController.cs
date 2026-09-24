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
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        IAuditService auditService,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _auditService = auditService;
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

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
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

        var result = await _userManager.CreateAsync(user, request.Password);
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

        return await Login(new LoginRequest { Email = request.Email, Password = request.Password });
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

        var result = await _userManager.CreateAsync(user, request.Password);
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

        return await Login(new LoginRequest { Email = request.Email, Password = request.Password });
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
}
