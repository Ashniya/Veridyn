using Veridyn.Core.Enums;

namespace Veridyn.Core.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRoleType Role { get; set; } = UserRoleType.Developer;
    public string? JobTitle { get; set; }
    public string? GitHubUsername { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public UserDto User { get; set; } = default!;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRoleType Role { get; set; }
    public string RoleName => Role.ToString();
    public string? JobTitle { get; set; }
    public string? AvatarUrl { get; set; }
    public string? GitHubUsername { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChangeUserRoleRequest
{
    public string UserId { get; set; } = string.Empty;
    public UserRoleType NewRole { get; set; }
}
