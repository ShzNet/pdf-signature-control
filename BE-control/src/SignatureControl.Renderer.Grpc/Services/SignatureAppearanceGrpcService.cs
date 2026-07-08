using Grpc.Core;
using SignatureControl.Contracts;
using SignatureControl.Renderer.Grpc.Protos;

namespace SignatureControl.Renderer.Grpc.Services;

public sealed class SignatureAppearanceGrpcService : SignatureAppearanceGrpc.SignatureAppearanceGrpcBase
{
    private readonly IAppearanceCacheService _cacheService;
    private readonly ISignatureAppearanceRenderer _renderer;
    private readonly ISignatureImageStore _imageStore;
    private readonly Options.RendererOptions _options;

    public SignatureAppearanceGrpcService(
        IAppearanceCacheService cacheService,
        ISignatureAppearanceRenderer renderer,
        ISignatureImageStore imageStore,
        Options.RendererOptions options)
    {
        _cacheService = cacheService;
        _renderer = renderer;
        _imageStore = imageStore;
        _options = options;
    }

    public override async Task<RenderPreviewReply> RenderPreview(RenderPreviewRequest request, ServerCallContext context)
    {
        var dto = NormalizeRenderRequest(request.ToDto());
        var asset = await _imageStore.GetAsync(dto.Content.SignatureImageId, context.CancellationToken);
        var cacheKey = AppearanceCacheKeyBuilder.BuildAppearanceCacheKey(dto, asset.ContentHash);
        var cached = await _cacheService.TryGetAsync(cacheKey, context.CancellationToken);

        var response = cached;
        if (response is null)
        {
            var pngBytes = await _renderer.RenderPngAsync(dto, context.CancellationToken);
            response = await _cacheService.SaveAsync(
                cacheKey,
                pngBytes,
                dto.Box.Width,
                dto.Box.Height,
                dto.Render.Scale,
                context.CancellationToken);
        }

        return response.ToProto();
    }

    public override async Task<RenderPreviewBatchReply> RenderPreviewBatch(RenderPreviewBatchRequest request, ServerCallContext context)
    {
        var response = new RenderPreviewBatchReply();
        foreach (var item in request.Items)
        {
            response.Items.Add(await RenderPreview(item, context));
        }

        return response;
    }

    public override async Task<GetAppearancePngReply> GetAppearancePng(GetAppearancePngRequest request, ServerCallContext context)
    {
        var pngBytes = await _cacheService.GetPngBytesAsync(request.AppearanceId, context.CancellationToken);
        return new GetAppearancePngReply { PngBytes = Google.Protobuf.ByteString.CopyFrom(pngBytes) };
    }

    private SignatureAppearancePreviewRequest NormalizeRenderRequest(SignatureAppearancePreviewRequest request)
    {
        var resolvedScale = _options.ResolveRenderScale(request.Render.Scale);
        return request with
        {
            Render = request.Render with
            {
                Scale = resolvedScale
            }
        };
    }
}

internal static class SignatureAppearanceGrpcMappings
{
    public static SignatureAppearancePreviewRequest ToDto(this RenderPreviewRequest request)
    {
        return new SignatureAppearancePreviewRequest(
            request.TemplateId,
            new SignatureBoxDto(request.Box.Width, request.Box.Height, request.Box.Unit),
            new SignatureContentDto(
                request.Content.SignerName,
                string.IsNullOrWhiteSpace(request.Content.RoleName) ? null : request.Content.RoleName,
                string.IsNullOrWhiteSpace(request.Content.Email) ? null : request.Content.Email,
                string.IsNullOrWhiteSpace(request.Content.PhoneNumber) ? null : request.Content.PhoneNumber,
                string.IsNullOrWhiteSpace(request.Content.Organization) ? null : request.Content.Organization,
                string.IsNullOrWhiteSpace(request.Content.OrganizationUnitName) ? null : request.Content.OrganizationUnitName,
                string.IsNullOrWhiteSpace(request.Content.DepartmentName) ? null : request.Content.DepartmentName,
                request.Content.SignedAtText,
                request.Content.SignatureImageId,
                new SignatureAppearanceOptionsDto(
                    (SignatureImageType)request.Content.AppearanceOptions.ImageType,
                    (SignatureLayoutDirection)request.Content.AppearanceOptions.LayoutDirection,
                    (SignatureImageSize)request.Content.AppearanceOptions.ImageSize,
                    request.Content.AppearanceOptions.TextSize,
                    request.Content.AppearanceOptions.CertificateNameFontSize,
                    (SignatureLanguageCode)request.Content.AppearanceOptions.LanguageCode,
                    request.Content.AppearanceOptions.ShowCertificateName,
                    request.Content.AppearanceOptions.ShowTimeStamp,
                    request.Content.AppearanceOptions.ShowLabel,
                    request.Content.AppearanceOptions.ShowRoleName,
                    request.Content.AppearanceOptions.ShowEmail,
                    request.Content.AppearanceOptions.ShowPhoneNumber,
                    request.Content.AppearanceOptions.ShowOrganizationUnitName,
                    request.Content.AppearanceOptions.ShowDepartmentName,
                    string.IsNullOrWhiteSpace(request.Content.AppearanceOptions.PenColor) ? "#163b7a" : request.Content.AppearanceOptions.PenColor,
                    request.Content.AppearanceOptions.PenWidth <= 0 ? 2f : request.Content.AppearanceOptions.PenWidth,
                    string.IsNullOrWhiteSpace(request.Content.AppearanceOptions.Typed?.Name)
                        ? null
                        : new SignatureTypedValueDto(request.Content.AppearanceOptions.Typed.Name),
                    (SignatureImageBackgroundMode)request.Content.AppearanceOptions.ImageBackgroundMode,
                    request.Content.AppearanceOptions.VisualGoal)),
            new SignatureRenderOptionsDto(request.Render.Format, request.Render.Scale));
    }

    public static RenderPreviewReply ToProto(this SignatureAppearanceResponse response)
    {
        return new RenderPreviewReply
        {
            AppearanceId = response.AppearanceId,
            CacheKey = response.CacheKey,
            WidthPt = response.WidthPt,
            HeightPt = response.HeightPt,
            WidthPx = response.WidthPx,
            HeightPx = response.HeightPx
        };
    }
}
