using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Veridyn.Core.Interfaces;

namespace Veridyn.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<bool> SendInvitationEmailAsync(string toEmail, string fullName, string roleName, string tempPassword)
    {
        var subject = "Welcome to Alliure - Your Account Credentials & Login Access";
        var loginUrl = _configuration["App:ClientUrl"] ?? "http://localhost:3000/login";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .header {{ border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; }}
    .logo {{ font-size: 24px; font-weight: 800; letter-spacing: -0.05em; color: #0f172a; }}
    .badge {{ display: inline-block; background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 10px; }}
    .greeting {{ font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px; }}
    .credentials-box {{ background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0; }}
    .field {{ margin-bottom: 12px; }}
    .field:last-child {{ margin-bottom: 0; }}
    .label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }}
    .value {{ font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #0f172a; word-break: break-all; }}
    .button {{ display: inline-block; background: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; margin-top: 10px; transition: background 0.2s; }}
    .notice {{ font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.5; }}
    .footer {{ margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <div class='logo'>ALLIURE</div>
      <div class='badge'>Assigned Role: {roleName}</div>
    </div>
    
    <div class='greeting'>
      Hello <strong>{fullName}</strong>,<br/><br/>
      An administrator has provisioned your access to the <strong>Alliure Engineering Intelligence Platform</strong>. You can now access your project boards, track deliverables, and collaborate with your team.
    </div>

    <div class='credentials-box'>
      <div class='field'>
        <div class='label'>Login Email</div>
        <div class='value'>{toEmail}</div>
      </div>
      <div class='field'>
        <div class='label'>Temporary Login Password</div>
        <div class='value'>{tempPassword}</div>
      </div>
    </div>

    <div>
      <a href='{loginUrl}' class='button'>Sign In to Alliure Workspace &rarr;</a>
    </div>

    <div class='notice'>
      <strong>Important:</strong> For security compliance, please sign in with this temporary password and update your credentials under account settings.
    </div>

    <div class='footer'>
      &copy; {DateTime.UtcNow.Year} Alliure Software Intelligence Systems. All rights reserved.
    </div>
  </div>
</body>
</html>";

        // Formatted console banner so administrators can easily view generated credentials during dev/testing
        var consoleLog = $@"
================================================================================
📧 [ALLIURE AUTOMATED EMAIL DISPATCH]
To:       {toEmail} ({fullName})
Role:     {roleName}
Subject:  {subject}
--------------------------------------------------------------------------------
Your temporary login credentials are:
  Login Email:  {toEmail}
  Password:     {tempPassword}
  Login Link:   {loginUrl}
================================================================================";

        _logger.LogInformation(consoleLog);
        Console.WriteLine(consoleLog);

        // Attempt sending real email via MailKit
        var smtpHost = _configuration["Email:SmtpHost"];
        if (!string.IsNullOrEmpty(smtpHost))
        {
            try
            {
                var smtpPort = int.TryParse(_configuration["Email:SmtpPort"], out var port) ? port : 587;
                var smtpUser = _configuration["Email:SmtpUser"];
                var rawPass = _configuration["Email:SmtpPassword"] ?? string.Empty;
                // Gmail app passwords can contain spaces, e.g. "abcd efgh ijkl mnop" -> strip them for SMTP
                var smtpPass = rawPass.Replace(" ", "");
                var fromEmail = _configuration["Email:FromEmail"] ?? smtpUser ?? "noreply@veridyn.com";
                var fromName = _configuration["Email:FromName"] ?? "Veridyn Platform";

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, fromEmail));
                message.To.Add(new MailboxAddress(fullName, toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                // Select SSL/TLS socket options based on port
                var socketOption = smtpPort == 465 
                    ? SecureSocketOptions.SslOnConnect 
                    : SecureSocketOptions.StartTls;

                // Timeout after 15 seconds to avoid freezing
                client.Timeout = 15000;

                await client.ConnectAsync(smtpHost, smtpPort, socketOption);

                if (!string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass))
                {
                    await client.AuthenticateAsync(smtpUser, smtpPass);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Invitation email sent successfully via SMTP to {ToEmail}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send invitation email via SMTP to {ToEmail}. Local dispatch logged. If using Gmail, an App Password is required.", toEmail);
            }
        }

        return true;
    }
}
