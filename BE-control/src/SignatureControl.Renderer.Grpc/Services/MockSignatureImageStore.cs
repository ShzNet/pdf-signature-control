using System.Collections.Concurrent;
using System.Security.Cryptography;
using SignatureControl.Contracts;
using SkiaSharp;

namespace SignatureControl.Renderer.Grpc.Services;

public sealed class MockSignatureImageStore : ISignatureImageStore
{
    private readonly ConcurrentDictionary<string, SignatureImageAsset> _cache = new();

    public Task<SignatureImageAsset> GetAsync(string imageId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult(_cache.GetOrAdd(imageId, CreateAsset));
    }

    private static SignatureImageAsset CreateAsset(string imageId)
    {
        if (imageId.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            var commaIndex = imageId.IndexOf(',');
            if (commaIndex > 0)
            {
                var uploadedBytes = Convert.FromBase64String(imageId[(commaIndex + 1)..]);
                var uploadedHash = Convert.ToHexString(SHA256.HashData(uploadedBytes)).ToLowerInvariant();
                return new SignatureImageAsset(imageId, uploadedHash, uploadedBytes);
            }
        }

        var info = new SKImageInfo(720, 240, SKColorType.Rgba8888, SKAlphaType.Premul);
        using var surface = SKSurface.Create(info);
        var canvas = surface.Canvas;
        canvas.Clear(SKColors.Transparent);

        using var pathPaint = new SKPaint
        {
            Color = new SKColor(22, 59, 122, 220),
            StrokeWidth = 8,
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeCap = SKStrokeCap.Round,
            StrokeJoin = SKStrokeJoin.Round
        };

        using var guidePaint = new SKPaint
        {
            Color = new SKColor(22, 59, 122, 120),
            TextSize = 24,
            IsAntialias = true
        };

        using var path = new SKPath();
        path.MoveTo(20, 170);
        path.CubicTo(90, 60, 160, 210, 250, 120);
        path.CubicTo(310, 60, 420, 210, 520, 90);
        path.CubicTo(575, 45, 630, 155, 700, 70);
        canvas.DrawPath(path, pathPaint);
        canvas.DrawText($"mock:{imageId}", 24, 220, guidePaint);

        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        var bytes = data.ToArray();
        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        return new SignatureImageAsset(imageId, hash, bytes);
    }
}
