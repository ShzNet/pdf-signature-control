using System.Security.Cryptography;
using System.Text;

namespace SignatureControl.Contracts;

public enum HashAlgorithmType
{
    Sha256 = 0,
    Sha384 = 1,
    Sha512 = 2,
}

public enum SignatureImageType
{
    Drawn = 0,
    Typed = 1,
    Uploaded = 2,
}

public enum SignatureLayoutDirection
{
    Horizontal = 0,
    Vertical = 1,
}

public enum SignatureImageSize
{
    Small = 0,
    Medium = 1,
    Large = 2,
}

public enum SignatureLanguageCode
{
    Vi = 0,
    En = 1,
}

public enum SignatureImageBackgroundMode
{
    Transparent = 0,
    White = 1,
}

public sealed record SignatureTypedValueDto(string Name);

public sealed record SignatureAppearanceOptionsDto(
    SignatureImageType ImageType,
    SignatureLayoutDirection LayoutDirection,
    SignatureImageSize ImageSize,
    float TextSize,
    float CertificateNameFontSize,
    SignatureLanguageCode LanguageCode,
    bool ShowCertificateName,
    bool ShowTimeStamp,
    bool ShowLabel,
    bool ShowRoleName,
    bool ShowEmail,
    bool ShowPhoneNumber,
    bool ShowOrganizationUnitName,
    bool ShowDepartmentName,
    string PenColor,
    float PenWidth,
    SignatureTypedValueDto? Typed,
    SignatureImageBackgroundMode ImageBackgroundMode,
    string VisualGoal);

public sealed record PdfRectDto(float X, float Y, float Width, float Height, string Unit = "pt");

public sealed record SignatureBoxDto(float Width, float Height, string Unit = "pt");

public sealed record SignatureRenderOptionsDto(string Format = "png", float Scale = 0f);

public sealed record SignatureContentDto(
    string SignerName,
    string? RoleName,
    string? Email,
    string? PhoneNumber,
    string? Organization,
    string? OrganizationUnitName,
    string? DepartmentName,
    string SignedAtText,
    string SignatureImageId,
    SignatureAppearanceOptionsDto AppearanceOptions);

public sealed record SignatureWidgetPlacementDto(
    string WidgetId,
    int Page,
    PdfRectDto Rect,
    string AppearanceId,
    string TemplateId,
    SignatureContentDto ContentSnapshot);

public sealed record SignatureAppearancePreviewRequest(
    string TemplateId,
    SignatureBoxDto Box,
    SignatureContentDto Content,
    SignatureRenderOptionsDto Render);

public sealed record SignatureAppearanceBatchPreviewRequest(IReadOnlyList<SignatureAppearancePreviewRequest> Items);

public sealed record SignatureAppearanceResponse(
    string AppearanceId,
    string CacheKey,
    float WidthPt,
    float HeightPt,
    int WidthPx,
    int HeightPx,
    string Url);

public sealed record PreparePdfSigningRequest(
    string DocumentId,
    string FieldName,
    List<byte[]> CertificateChains,
    HashAlgorithmType HashAlgorithm,
    DateTimeOffset SignTime,
    IReadOnlyList<SignatureWidgetPlacementDto> Widgets);

public sealed record PreparePdfSigningResponse(
    string SigningSessionId,
    string PreparedDocumentId,
    string FieldName,
    byte[] SignedAttributes,
    string HashAlgorithm);

public sealed record FillPdfSigningRequest(string SigningSessionId, string FieldName, byte[] Signature);

public sealed record FillPdfSigningResponse(string FinalDocumentId, byte[]? FileBytes);

public sealed record ResolvedSignatureWidget(string WidgetId, int Page, PdfRectDto Rect, byte[] AppearancePngBytes);

public sealed record SignatureImageAsset(string ImageId, string ContentHash, byte[] Content);

public sealed record PrepareSignResult(
    string PreparedDocumentId,
    byte[] PreparedPdfContent,
    byte[] SignedAttributes,
    byte[] SerializedCmsContainer,
    string SignatureAlgorithm);

public sealed record SignResult(string FinalDocumentId, byte[] FileContent);

public sealed record SigningSessionState(
    string SigningSessionId,
    string DocumentId,
    string PreparedDocumentId,
    string FieldName,
    HashAlgorithmType HashAlgorithm,
    string SignatureAlgorithm,
    DateTimeOffset SignTime,
    byte[] PreparedPdfContent,
    byte[] SignedAttributes,
    byte[] SerializedCmsContainer,
    IReadOnlyList<SignatureWidgetPlacementDto> Widgets,
    DateTimeOffset CreatedAtUtc,
    string Status,
    string? FinalDocumentId = null);

public sealed record SigningSessionResponse(
    string SigningSessionId,
    string PreparedDocumentId,
    string FieldName,
    string Status,
    DateTimeOffset CreatedAtUtc,
    string? FinalDocumentId);

public interface ISignatureAppearanceRenderer
{
    Task<byte[]> RenderPngAsync(SignatureAppearancePreviewRequest request, CancellationToken ct);
}

public interface IAppearanceCacheService
{
    Task<SignatureAppearanceResponse?> TryGetAsync(string cacheKey, CancellationToken ct);
    Task<SignatureAppearanceResponse> SaveAsync(string cacheKey, byte[] pngBytes, float widthPt, float heightPt, float scale, CancellationToken ct);
    Task<byte[]> GetPngBytesAsync(string appearanceId, CancellationToken ct);
}

public interface ISignatureImageStore
{
    Task<SignatureImageAsset> GetAsync(string imageId, CancellationToken ct);
}

public interface IPdfVisualWidgetStampingService
{
    Task<byte[]> StampVisualWidgetsAsync(byte[] rawPdfBytes, IReadOnlyList<ResolvedSignatureWidget> widgets, CancellationToken ct);
}

public interface IPdfTwoPhaseSignService
{
    Task<PrepareSignResult> PrepareSignFileAsync(
        byte[] pdfContentAlreadyStamped,
        string fieldName,
        List<byte[]> certificateChains,
        HashAlgorithmType hashAlgorithm,
        DateTimeOffset signTime,
        CancellationToken ct);

    Task<SignResult> FillSignFileAsync(
        byte[] preparedPdfContent,
        string fieldName,
        byte[] serializedCmsContainer,
        string signatureAlgorithm,
        HashAlgorithmType hashAlgorithm,
        byte[] signature,
        CancellationToken ct);
}

public interface IPdfSignWorkflowService
{
    Task<PreparePdfSigningResponse> PrepareAsync(PreparePdfSigningRequest request, CancellationToken ct);
    Task<FillPdfSigningResponse> FillAsync(FillPdfSigningRequest request, CancellationToken ct);
    Task<SigningSessionResponse?> GetSessionAsync(string signingSessionId, CancellationToken ct);
}

public interface ISigningSessionStore
{
    Task SaveAsync(SigningSessionState state, CancellationToken ct);
    Task<SigningSessionState?> GetAsync(string signingSessionId, CancellationToken ct);
    Task MarkCompletedAsync(string signingSessionId, string finalDocumentId, CancellationToken ct);
}

public interface IDocumentStore
{
    Task<byte[]> LoadDocumentAsync(string documentId, CancellationToken ct);
    Task<string> SaveFinalDocumentAsync(string signingSessionId, byte[] fileContent, CancellationToken ct);
}

public static class AppearanceCacheKeyBuilder
{
    public static string BuildAppearanceCacheKey(SignatureAppearancePreviewRequest request, string signatureImageHash)
    {
        var raw = string.Join("|",
            "signature-renderer-v1",
            request.TemplateId,
            request.Box.Width.ToString("0.###"),
            request.Box.Height.ToString("0.###"),
            request.Content.SignerName,
            request.Content.RoleName,
            request.Content.Email,
            request.Content.PhoneNumber,
            request.Content.Organization,
            request.Content.OrganizationUnitName,
            request.Content.DepartmentName,
            request.Content.SignedAtText,
            request.Content.SignatureImageId,
            request.Content.AppearanceOptions.ImageType,
            request.Content.AppearanceOptions.LayoutDirection,
            request.Content.AppearanceOptions.ImageSize,
            request.Content.AppearanceOptions.TextSize.ToString("0.##"),
            request.Content.AppearanceOptions.CertificateNameFontSize.ToString("0.##"),
            request.Content.AppearanceOptions.LanguageCode,
            request.Content.AppearanceOptions.ShowCertificateName,
            request.Content.AppearanceOptions.ShowTimeStamp,
            request.Content.AppearanceOptions.ShowLabel,
            request.Content.AppearanceOptions.ShowRoleName,
            request.Content.AppearanceOptions.ShowEmail,
            request.Content.AppearanceOptions.ShowPhoneNumber,
            request.Content.AppearanceOptions.ShowOrganizationUnitName,
            request.Content.AppearanceOptions.ShowDepartmentName,
            request.Content.AppearanceOptions.PenColor,
            request.Content.AppearanceOptions.PenWidth.ToString("0.##"),
            request.Content.AppearanceOptions.Typed?.Name,
            request.Content.AppearanceOptions.ImageBackgroundMode,
            request.Content.AppearanceOptions.VisualGoal,
            signatureImageHash,
            request.Render.Scale.ToString("0.##"),
            "font:workspace:v1");

        var bytes = Encoding.UTF8.GetBytes(raw);
        return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    }
}
