namespace Veridyn.Core.Interfaces;

public interface IEmailService
{
    Task<bool> SendInvitationEmailAsync(string toEmail, string fullName, string roleName, string tempPassword);
}
