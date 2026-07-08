using SignatureControl.Contracts;

namespace SignatureControl.Signing.Api.Services;

public sealed class PdfSignWorkflowService : IPdfSignWorkflowService
{
    private readonly SignatureAppearanceGrpcClient _appearanceClient;
    private readonly IDocumentStore _documentStore;
    private readonly IPdfVisualWidgetStampingService _stampingService;
    private readonly IPdfTwoPhaseSignService _twoPhaseSignService;
    private readonly ISigningSessionStore _signingSessionStore;

    public PdfSignWorkflowService(
        SignatureAppearanceGrpcClient appearanceClient,
        IDocumentStore documentStore,
        IPdfVisualWidgetStampingService stampingService,
        IPdfTwoPhaseSignService twoPhaseSignService,
        ISigningSessionStore signingSessionStore)
    {
        _appearanceClient = appearanceClient;
        _documentStore = documentStore;
        _stampingService = stampingService;
        _twoPhaseSignService = twoPhaseSignService;
        _signingSessionStore = signingSessionStore;
    }

    public async Task<PreparePdfSigningResponse> PrepareAsync(PreparePdfSigningRequest request, CancellationToken ct)
    {
        var rawPdfBytes = await _documentStore.LoadDocumentAsync(request.DocumentId, ct);
        var resolvedWidgets = new List<ResolvedSignatureWidget>(request.Widgets.Count);

        foreach (var widget in request.Widgets)
        {
            var pngBytes = await _appearanceClient.GetAppearancePngAsync(widget.AppearanceId, ct);
            resolvedWidgets.Add(new ResolvedSignatureWidget(widget.WidgetId, widget.Page, widget.Rect, pngBytes));
        }

        var stampedPdf = await _stampingService.StampVisualWidgetsAsync(rawPdfBytes, resolvedWidgets, ct);
        var prepareResult = await _twoPhaseSignService.PrepareSignFileAsync(
            stampedPdf,
            request.FieldName,
            request.CertificateChains,
            request.HashAlgorithm,
            request.SignTime,
            ct);

        var signingSessionId = $"sign_{Guid.NewGuid():N}";
        await _signingSessionStore.SaveAsync(
            new SigningSessionState(
                signingSessionId,
                request.DocumentId,
                prepareResult.PreparedDocumentId,
                request.FieldName,
                request.HashAlgorithm,
                prepareResult.SignatureAlgorithm,
                request.SignTime,
                prepareResult.PreparedPdfContent,
                prepareResult.SignedAttributes,
                prepareResult.SerializedCmsContainer,
                request.Widgets,
                DateTimeOffset.UtcNow,
                "prepared"),
            ct);

        return new PreparePdfSigningResponse(
            signingSessionId,
            prepareResult.PreparedDocumentId,
            request.FieldName,
            prepareResult.SignedAttributes,
            request.HashAlgorithm.ToString());
    }

    public async Task<FillPdfSigningResponse> FillAsync(FillPdfSigningRequest request, CancellationToken ct)
    {
        var session = await _signingSessionStore.GetAsync(request.SigningSessionId, ct)
            ?? throw new InvalidOperationException($"Signing session '{request.SigningSessionId}' was not found.");

        if (!string.Equals(session.FieldName, request.FieldName, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("FieldName does not match the prepared signing session.");
        }

        var signResult = await _twoPhaseSignService.FillSignFileAsync(
            session.PreparedPdfContent,
            request.FieldName,
            session.SerializedCmsContainer,
            session.SignatureAlgorithm,
            session.HashAlgorithm,
            request.Signature,
            ct);

        var finalDocumentId = await _documentStore.SaveFinalDocumentAsync(request.SigningSessionId, signResult.FileContent, ct);
        await _signingSessionStore.MarkCompletedAsync(request.SigningSessionId, finalDocumentId, ct);

        return new FillPdfSigningResponse(finalDocumentId, signResult.FileContent);
    }

    public async Task<SigningSessionResponse?> GetSessionAsync(string signingSessionId, CancellationToken ct)
    {
        var session = await _signingSessionStore.GetAsync(signingSessionId, ct);
        return session is null
            ? null
            : new SigningSessionResponse(
                session.SigningSessionId,
                session.PreparedDocumentId,
                session.FieldName,
                session.Status,
                session.CreatedAtUtc,
                session.FinalDocumentId);
    }
}
