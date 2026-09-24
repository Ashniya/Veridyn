using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veridyn.Core.DTOs;
using Veridyn.Core.Interfaces;

namespace Veridyn.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IRiskAnalysisService _riskService;

    public DashboardController(IRiskAnalysisService riskService)
    {
        _riskService = riskService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<DashboardOverviewDto>> GetOverview()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var overview = await _riskService.GetDashboardOverviewAsync(userId);
        return Ok(overview);
    }
}
