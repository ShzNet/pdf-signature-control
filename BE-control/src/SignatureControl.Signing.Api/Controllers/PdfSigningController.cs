using Microsoft.AspNetCore.Mvc;
using SignatureControl.Contracts;

namespace SignatureControl.Signing.Api.Controllers;

[ApiController]
[Route("api/pdf-signing")]
public sealed class PdfSigningController : ControllerBase
{
    private readonly IPdfSignWorkflowService _workflowService;

    public PdfSigningController(IPdfSignWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpPost("prepare")]
    public async Task<ActionResult<PreparePdfSigningResponse>> Prepare(
        [FromBody] PreparePdfSigningRequest request,
        CancellationToken ct)
    {
        return Ok(await _workflowService.PrepareAsync(request, ct));
    }

    [HttpPost("fill")]
    public async Task<ActionResult<FillPdfSigningResponse>> Fill(
        [FromBody] FillPdfSigningRequest request,
        CancellationToken ct)
    {
        return Ok(await _workflowService.FillAsync(request, ct));
    }

    [HttpGet("sessions/{signingSessionId}")]
    public async Task<ActionResult<SigningSessionResponse>> GetSession(string signingSessionId, CancellationToken ct)
    {
        var session = await _workflowService.GetSessionAsync(signingSessionId, ct);
        return session is null ? NotFound() : Ok(session);
    }
}
