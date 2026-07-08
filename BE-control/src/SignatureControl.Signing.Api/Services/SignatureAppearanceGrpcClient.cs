using Grpc.Net.Client;
using SignatureControl.Contracts;
using SignatureControl.Renderer.Grpc.Protos;
using SignatureControl.Signing.Api.Options;

namespace SignatureControl.Signing.Api.Services;

public sealed class SignatureAppearanceGrpcClient : IDisposable
{
    private readonly GrpcChannel _channel;
    private readonly SignatureAppearanceGrpc.SignatureAppearanceGrpcClient _client;

    public SignatureAppearanceGrpcClient(RendererGrpcOptions options)
    {
        _channel = GrpcChannel.ForAddress(options.Address);
        _client = new SignatureAppearanceGrpc.SignatureAppearanceGrpcClient(_channel);
    }

    public async Task<SignatureAppearanceResponse> RenderPreviewAsync(SignatureAppearancePreviewRequest request, string baseUrl, CancellationToken ct)
    {
        var reply = await _client.RenderPreviewAsync(request.ToProto(), cancellationToken: ct);
        return reply.ToDto(baseUrl);
    }

    public async Task<IReadOnlyList<SignatureAppearanceResponse>> RenderPreviewBatchAsync(
        IReadOnlyList<SignatureAppearancePreviewRequest> requests,
        string baseUrl,
        CancellationToken ct)
    {
        var payload = new RenderPreviewBatchRequest();
        payload.Items.AddRange(requests.Select(static request => request.ToProto()));
        var reply = await _client.RenderPreviewBatchAsync(payload, cancellationToken: ct);
        return reply.Items.Select(item => item.ToDto(baseUrl)).ToArray();
    }

    public async Task<byte[]> GetAppearancePngAsync(string appearanceId, CancellationToken ct)
    {
        var reply = await _client.GetAppearancePngAsync(new GetAppearancePngRequest { AppearanceId = appearanceId }, cancellationToken: ct);
        return reply.PngBytes.ToByteArray();
    }

    public void Dispose()
    {
        _channel.Dispose();
    }
}

internal static class SignatureAppearanceGrpcClientMappings
{
    public static RenderPreviewRequest ToProto(this SignatureAppearancePreviewRequest request)
    {
        return new RenderPreviewRequest
        {
            TemplateId = request.TemplateId,
            Box = new SignatureBoxMessage
            {
                Width = request.Box.Width,
                Height = request.Box.Height,
                Unit = request.Box.Unit
            },
            Content = new SignatureContentMessage
            {
                SignerName = request.Content.SignerName,
                RoleName = request.Content.RoleName ?? string.Empty,
                Organization = request.Content.Organization ?? string.Empty,
                SignedAtText = request.Content.SignedAtText,
                SignatureImageId = request.Content.SignatureImageId,
                Email = request.Content.Email ?? string.Empty,
                PhoneNumber = request.Content.PhoneNumber ?? string.Empty,
                OrganizationUnitName = request.Content.OrganizationUnitName ?? string.Empty,
                DepartmentName = request.Content.DepartmentName ?? string.Empty,
                AppearanceOptions = new SignatureAppearanceOptionsMessage
                {
                    ImageType = (int)request.Content.AppearanceOptions.ImageType,
                    LayoutDirection = (int)request.Content.AppearanceOptions.LayoutDirection,
                    ImageSize = (int)request.Content.AppearanceOptions.ImageSize,
                    TextSize = request.Content.AppearanceOptions.TextSize,
                    CertificateNameFontSize = request.Content.AppearanceOptions.CertificateNameFontSize,
                    LanguageCode = (int)request.Content.AppearanceOptions.LanguageCode,
                    ShowCertificateName = request.Content.AppearanceOptions.ShowCertificateName,
                    ShowTimeStamp = request.Content.AppearanceOptions.ShowTimeStamp,
                    ShowLabel = request.Content.AppearanceOptions.ShowLabel,
                    ShowRoleName = request.Content.AppearanceOptions.ShowRoleName,
                    ShowEmail = request.Content.AppearanceOptions.ShowEmail,
                    ShowPhoneNumber = request.Content.AppearanceOptions.ShowPhoneNumber,
                    ShowOrganizationUnitName = request.Content.AppearanceOptions.ShowOrganizationUnitName,
                    ShowDepartmentName = request.Content.AppearanceOptions.ShowDepartmentName,
                    PenColor = request.Content.AppearanceOptions.PenColor,
                    PenWidth = request.Content.AppearanceOptions.PenWidth,
                    Typed = request.Content.AppearanceOptions.Typed is null
                        ? null
                        : new SignatureTypedValueMessage { Name = request.Content.AppearanceOptions.Typed.Name },
                    ImageBackgroundMode = (int)request.Content.AppearanceOptions.ImageBackgroundMode,
                    VisualGoal = request.Content.AppearanceOptions.VisualGoal ?? string.Empty
                }
            },
            Render = new SignatureRenderOptionsMessage
            {
                Format = request.Render.Format,
                Scale = request.Render.Scale
            }
        };
    }

    public static SignatureAppearanceResponse ToDto(this RenderPreviewReply reply, string baseUrl)
    {
        return new SignatureAppearanceResponse(
            reply.AppearanceId,
            reply.CacheKey,
            reply.WidthPt,
            reply.HeightPt,
            reply.WidthPx,
            reply.HeightPx,
            $"{baseUrl.TrimEnd('/')}/api/signature-appearance/{reply.AppearanceId}.png");
    }
}
