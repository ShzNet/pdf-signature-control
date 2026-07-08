using Microsoft.AspNetCore.Mvc;
using SignatureControl.Contracts;
using SignatureControl.Signing.Api.Services;

namespace SignatureControl.Signing.Api.Controllers;

[ApiController]
[Route("api/signature-appearance")]
public sealed class SignatureAppearanceController : ControllerBase
{
    private readonly SignatureAppearanceGrpcClient _appearanceClient;

    public SignatureAppearanceController(SignatureAppearanceGrpcClient appearanceClient)
    {
        _appearanceClient = appearanceClient;
    }

    [HttpPost("preview")]
    public async Task<ActionResult<SignatureAppearanceResponse>> Preview(
        [FromBody] SignatureAppearancePreviewRequest request,
        CancellationToken ct)
    {
        return Ok(await _appearanceClient.RenderPreviewAsync(request, GetBaseUrl(), ct));
    }

    [HttpPost("preview-batch")]
    public async Task<ActionResult<IReadOnlyList<SignatureAppearanceResponse>>> PreviewBatch(
        [FromBody] SignatureAppearanceBatchPreviewRequest request,
        CancellationToken ct)
    {
        return Ok(await _appearanceClient.RenderPreviewBatchAsync(request.Items, GetBaseUrl(), ct));
    }

    [HttpGet("{appearanceId}.png")]
    public async Task<IActionResult> GetAppearancePng(string appearanceId, CancellationToken ct)
    {
        return File(await _appearanceClient.GetAppearancePngAsync(appearanceId, ct), "image/png");
    }

    private string GetBaseUrl() => $"{Request.Scheme}://{Request.Host}";
}
