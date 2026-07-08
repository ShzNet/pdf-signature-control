using SignatureControl.Contracts;
using SkiaSharp;

namespace SignatureControl.Renderer.Grpc.Services;

public sealed class SignatureAppearanceRenderer : ISignatureAppearanceRenderer
{
    private readonly ISignatureImageStore _imageStore;
    private readonly FontResolver _fontResolver;
    private readonly SemaphoreSlim _renderLimiter;
    private readonly Options.RendererOptions _options;

    public SignatureAppearanceRenderer(
        ISignatureImageStore imageStore,
        FontResolver fontResolver,
        Options.RendererOptions options)
    {
        _imageStore = imageStore;
        _fontResolver = fontResolver;
        _options = options;
        _renderLimiter = new SemaphoreSlim(Math.Max(1, options.MaxConcurrentRenders));
    }

    public async Task<byte[]> RenderPngAsync(SignatureAppearancePreviewRequest request, CancellationToken ct)
    {
        await _renderLimiter.WaitAsync(ct);

        try
        {
            byte[]? imageBytes = null;
            if (request.Content.AppearanceOptions.ImageType is SignatureImageType.Drawn or SignatureImageType.Uploaded)
            {
                var asset = await _imageStore.GetAsync(request.Content.SignatureImageId, ct);
                imageBytes = asset.Content;
            }

            var scale = _options.ResolveRenderScale(request.Render.Scale);
            var widthPx = Math.Max(1, (int)MathF.Round(request.Box.Width * scale));
            var heightPx = Math.Max(1, (int)MathF.Round(request.Box.Height * scale));

            var info = new SKImageInfo(widthPx, heightPx, SKColorType.Rgba8888, SKAlphaType.Premul);
            using var surface = SKSurface.Create(info);
            var canvas = surface.Canvas;
            canvas.Clear(SKColors.Transparent);
            canvas.Scale(scale);

            DrawLayout(canvas, request, imageBytes);

            using var image = surface.Snapshot();
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            return data.ToArray();
        }
        finally
        {
            _renderLimiter.Release();
        }
    }

    private void DrawLayout(SKCanvas canvas, SignatureAppearancePreviewRequest request, byte[]? imageBytes)
    {
        var options = request.Content.AppearanceOptions;
        var width = request.Box.Width;
        var height = request.Box.Height;
        var padding = MathF.Max(8f, width * 0.06f);
        var isVertical = options.LayoutDirection == SignatureLayoutDirection.Vertical || Contains(options.VisualGoal, "bố cục dọc");

        var imageRect = CalculateImageRect(width, height, padding, isVertical, options.ImageSize);
        var textRect = CalculateTextRect(width, height, padding, imageRect, isVertical);

        if (options.ImageBackgroundMode == SignatureImageBackgroundMode.White)
        {
            using var backgroundPaint = new SKPaint
            {
                Color = new SKColor(255, 255, 255, 235),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            };
            canvas.DrawRoundRect(new SKRoundRect(imageRect, 4f, 4f), backgroundPaint);
        }

        DrawSignatureVisual(canvas, request, imageBytes, imageRect);

        var lines = BuildLines(request.Content);
        if (Contains(options.VisualGoal, "ít thông tin hơn") || Contains(options.VisualGoal, "chỉ hiện tên và thời gian"))
        {
            lines = lines
                .Where(line => line.Kind is SignatureLineKind.Name or SignatureLineKind.Time)
                .ToArray();
        }

        if (Contains(options.VisualGoal, "chữ nhỏ hơn"))
        {
            lines = lines.Select(line => line with { FontSize = Math.Max(8f, line.FontSize * 0.88f) }).ToArray();
        }

        var lineSpacing = Math.Max(2f, textRect.Height * 0.024f);
        var laidOutLines = new List<LaidOutLine>();

        foreach (var line in lines)
        {
            using var paint = CreateLinePaint(line);

            var metrics = paint.FontMetrics;
            var lineHeight = (metrics.Descent - metrics.Ascent) + lineSpacing;
            var remainingHeight = textRect.Height - laidOutLines.Sum(item => item.LineHeight);
            if (remainingHeight <= 0f)
            {
                break;
            }

            var maxLines = Math.Max(1, (int)MathF.Floor((remainingHeight + lineSpacing) / lineHeight));
            var wrappedLines = WrapText(line.Text, paint, textRect.Width, maxLines);

            foreach (var wrappedLine in wrappedLines)
            {
                laidOutLines.Add(new LaidOutLine(wrappedLine, line, metrics, lineHeight));
            }
        }

        if (laidOutLines.Count == 0)
        {
            return;
        }

        var totalHeight = laidOutLines.Sum(item => item.LineHeight) - lineSpacing;
        var y = textRect.Top + Math.Max(0f, (textRect.Height - totalHeight) / 2f);

        foreach (var laidOutLine in laidOutLines)
        {
            using var paint = CreateLinePaint(laidOutLine.Source);
            var drawY = y - laidOutLine.Metrics.Ascent;
            if (drawY > textRect.Bottom)
            {
                return;
            }

            canvas.DrawText(laidOutLine.Text, textRect.Left, drawY, paint);
            y += laidOutLine.LineHeight;
        }
    }

    private void DrawSignatureVisual(SKCanvas canvas, SignatureAppearancePreviewRequest request, byte[]? imageBytes, SKRect imageRect)
    {
        var options = request.Content.AppearanceOptions;

        if (options.ImageType == SignatureImageType.Typed)
        {
            var typedName = string.IsNullOrWhiteSpace(options.Typed?.Name)
                ? request.Content.SignerName
                : options.Typed.Name;

            using var paint = new SKPaint
            {
                Color = ParseColorOrDefault(options.PenColor, new SKColor(22, 59, 122)),
                IsAntialias = true,
                Typeface = _fontResolver.Bold,
                TextSize = Math.Max(16f, imageRect.Height * 0.38f)
            };

            var text = FitTextWithEllipsis(typedName, paint, imageRect.Width);
            var bounds = new SKRect();
            paint.MeasureText(text, ref bounds);
            var x = imageRect.MidX - (bounds.Width / 2f) - bounds.Left;
            var y = imageRect.MidY - ((bounds.Top + bounds.Bottom) / 2f);
            canvas.DrawText(text, x, y, paint);
            return;
        }

        if (imageBytes is null)
        {
            return;
        }

        DrawSignatureImage(canvas, imageBytes, imageRect, options.ImageType == SignatureImageType.Drawn ? options.PenColor : null);
    }

    private void DrawSignatureImage(SKCanvas canvas, byte[] imageBytes, SKRect target, string? tintColor)
    {
        using var codec = SKCodec.Create(new MemoryStream(imageBytes));
        if (codec is null)
        {
            return;
        }

        var info = new SKImageInfo(codec.Info.Width, codec.Info.Height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using var bitmap = new SKBitmap(info);
        codec.GetPixels(info, bitmap.GetPixels());

        var sourceAspect = (float)bitmap.Width / bitmap.Height;
        var targetAspect = target.Width / target.Height;
        SKRect drawRect;

        if (sourceAspect > targetAspect)
        {
            var height = target.Width / sourceAspect;
            var top = target.MidY - (height / 2f);
            drawRect = new SKRect(target.Left, top, target.Right, top + height);
        }
        else
        {
            var width = target.Height * sourceAspect;
            var left = target.MidX - (width / 2f);
            drawRect = new SKRect(left, target.Top, left + width, target.Bottom);
        }

        using var paint = new SKPaint { IsAntialias = true, FilterQuality = SKFilterQuality.High };
        canvas.DrawBitmap(bitmap, drawRect, paint);

        if (!string.IsNullOrWhiteSpace(tintColor))
        {
            using var tintPaint = new SKPaint
            {
                ColorFilter = SKColorFilter.CreateBlendMode(ParseColorOrDefault(tintColor, new SKColor(22, 59, 122)), SKBlendMode.SrcIn),
                IsAntialias = true
            };
            canvas.DrawBitmap(bitmap, drawRect, tintPaint);
        }
    }

    private static SKRect CalculateImageRect(float width, float height, float padding, bool isVertical, SignatureImageSize imageSize)
    {
        var ratio = imageSize switch
        {
            SignatureImageSize.Small => isVertical ? 0.28f : 0.24f,
            SignatureImageSize.Large => isVertical ? 0.48f : 0.42f,
            _ => isVertical ? 0.38f : 0.32f
        };

        if (isVertical)
        {
            var imageHeight = MathF.Max(24f, (height - (padding * 3f)) * ratio);
            return new SKRect(padding, padding, width - padding, padding + imageHeight);
        }

        var imageWidth = MathF.Max(32f, (width - (padding * 3f)) * ratio);
        return new SKRect(padding, padding, padding + imageWidth, height - padding);
    }

    private static SKRect CalculateTextRect(float width, float height, float padding, SKRect imageRect, bool isVertical)
    {
        return isVertical
            ? new SKRect(padding, imageRect.Bottom + padding, width - padding, height - padding)
            : new SKRect(imageRect.Right + padding, padding, width - padding, height - padding);
    }

    private static SignatureLine[] BuildLines(SignatureContentDto content)
    {
        var options = content.AppearanceOptions;
        var bodyFontSize = ResolveFontSizePt(options.TextSize, 6f, 72f);
        var certificateFontSize = ResolveFontSizePt(options.CertificateNameFontSize, 6f, 72f);
        var labelFontSize = Math.Max(8f, bodyFontSize * 0.86f);
        var timeFontSize = Math.Max(8f, bodyFontSize * 0.94f);

        var label = options.LanguageCode == SignatureLanguageCode.Vi ? "Ky boi" : "Signed by";
        var roleLabel = options.LanguageCode == SignatureLanguageCode.Vi ? "Chuc vu" : "Role";
        var emailLabel = options.LanguageCode == SignatureLanguageCode.Vi ? "Email" : "Email";
        var phoneLabel = options.LanguageCode == SignatureLanguageCode.Vi ? "Dien thoai" : "Phone";
        var orgUnitLabel = options.LanguageCode == SignatureLanguageCode.Vi ? "Don vi" : "Org Unit";
        var departmentLabel = options.LanguageCode == SignatureLanguageCode.Vi ? "Phong ban" : "Department";
        var timestampLabel = options.LanguageCode == SignatureLanguageCode.Vi ? "Thoi gian" : "Timestamp";

        var lines = new List<SignatureLine>();

        if (options.ShowLabel)
        {
            lines.Add(new SignatureLine($"{label}:", false, labelFontSize, SignatureLineKind.Label));
        }

        if (options.ShowCertificateName)
        {
            lines.Add(new SignatureLine(content.SignerName, true, certificateFontSize, SignatureLineKind.Name));
        }

        if (options.ShowRoleName && !string.IsNullOrWhiteSpace(content.RoleName))
        {
            lines.Add(new SignatureLine($"{roleLabel}: {content.RoleName}", false, bodyFontSize, SignatureLineKind.Role));
        }

        if (options.ShowEmail && !string.IsNullOrWhiteSpace(content.Email))
        {
            lines.Add(new SignatureLine($"{emailLabel}: {content.Email}", false, bodyFontSize, SignatureLineKind.Email));
        }

        if (options.ShowPhoneNumber && !string.IsNullOrWhiteSpace(content.PhoneNumber))
        {
            lines.Add(new SignatureLine($"{phoneLabel}: {content.PhoneNumber}", false, bodyFontSize, SignatureLineKind.Phone));
        }

        if (options.ShowOrganizationUnitName && !string.IsNullOrWhiteSpace(content.OrganizationUnitName))
        {
            lines.Add(new SignatureLine($"{orgUnitLabel}: {content.OrganizationUnitName}", false, bodyFontSize, SignatureLineKind.OrgUnit));
        }

        if (options.ShowDepartmentName && !string.IsNullOrWhiteSpace(content.DepartmentName))
        {
            lines.Add(new SignatureLine($"{departmentLabel}: {content.DepartmentName}", false, bodyFontSize, SignatureLineKind.Department));
        }

        if (!string.IsNullOrWhiteSpace(content.Organization))
        {
            lines.Add(new SignatureLine(content.Organization, false, bodyFontSize, SignatureLineKind.Organization));
        }

        if (options.ShowTimeStamp)
        {
            lines.Add(new SignatureLine($"{timestampLabel}: {content.SignedAtText}", false, timeFontSize, SignatureLineKind.Time));
        }

        return lines.ToArray();
    }

    private static float ResolveFontSizePt(float optionValue, float min, float max)
    {
        return Math.Clamp(optionValue, min, max);
    }

    private static string[] WrapText(string text, SKPaint paint, float maxWidth, int maxLines)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return [string.Empty];
        }

        if (paint.MeasureText(text) <= maxWidth)
        {
            return [text];
        }

        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0)
        {
            return [FitTextWithEllipsis(text, paint, maxWidth)];
        }

        var lines = new List<string>();
        var current = words[0];

        for (var i = 1; i < words.Length; i += 1)
        {
            var candidate = $"{current} {words[i]}";
            if (paint.MeasureText(candidate) <= maxWidth)
            {
                current = candidate;
                continue;
            }

            lines.Add(current);
            current = words[i];

            if (lines.Count == maxLines - 1)
            {
                var rest = string.Join(' ', words[i..]);
                lines.Add(FitTextWithEllipsis(rest, paint, maxWidth));
                return lines.ToArray();
            }
        }

        lines.Add(current);
        if (lines.Count <= maxLines)
        {
            return lines.ToArray();
        }

        return lines
            .Take(maxLines - 1)
            .Append(FitTextWithEllipsis(lines[maxLines - 1], paint, maxWidth))
            .ToArray();
    }

    private static string FitTextWithEllipsis(string text, SKPaint paint, float maxWidth)
    {
        if (string.IsNullOrWhiteSpace(text) || paint.MeasureText(text) <= maxWidth)
        {
            return text;
        }

        const string ellipsis = "...";
        var current = text.TrimEnd();
        while (current.Length > 1 && paint.MeasureText(current + ellipsis) > maxWidth)
        {
            current = current[..^1].TrimEnd();
        }

        return current.Length <= 1 ? ellipsis : current + ellipsis;
    }

    private static SKColor ParseColorOrDefault(string? value, SKColor fallback)
    {
        return SKColor.TryParse(value, out var color) ? color : fallback;
    }

    private static bool Contains(string? source, string value)
    {
        return !string.IsNullOrWhiteSpace(source) &&
               source.Contains(value, StringComparison.OrdinalIgnoreCase);
    }

    private SKPaint CreateLinePaint(SignatureLine line)
    {
        return new SKPaint
        {
            Color = line.Kind == SignatureLineKind.Label ? new SKColor(55, 65, 81) : new SKColor(17, 24, 39),
            IsAntialias = true,
            Typeface = line.IsBold ? _fontResolver.Bold : _fontResolver.Regular,
            TextSize = line.FontSize
        };
    }

    private sealed record LaidOutLine(string Text, SignatureLine Source, SKFontMetrics Metrics, float LineHeight);
    private sealed record SignatureLine(string Text, bool IsBold, float FontSize, SignatureLineKind Kind);

    private enum SignatureLineKind
    {
        Label,
        Name,
        Role,
        Email,
        Phone,
        OrgUnit,
        Department,
        Organization,
        Time,
    }
}
