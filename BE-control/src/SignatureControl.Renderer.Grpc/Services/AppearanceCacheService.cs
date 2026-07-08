using System.Collections.Concurrent;
using SignatureControl.Contracts;

namespace SignatureControl.Renderer.Grpc.Services;

public sealed class AppearanceCacheService : IAppearanceCacheService
{
    private readonly ConcurrentDictionary<string, SignatureAppearanceResponse> _cacheByKey = new();
    private readonly ConcurrentDictionary<string, string> _appearanceToPath = new();
    private readonly string _cacheRoot;

    public AppearanceCacheService(IWebHostEnvironment environment, Options.RendererOptions options)
    {
        _cacheRoot = Path.Combine(environment.ContentRootPath, options.CacheRoot);
        Directory.CreateDirectory(_cacheRoot);
    }

    public Task<SignatureAppearanceResponse?> TryGetAsync(string cacheKey, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        _cacheByKey.TryGetValue(cacheKey, out var response);
        return Task.FromResult(response);
    }

    public async Task<SignatureAppearanceResponse> SaveAsync(
        string cacheKey,
        byte[] pngBytes,
        float widthPt,
        float heightPt,
        float scale,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var filePath = Path.Combine(_cacheRoot, $"{cacheKey}.png");
        await File.WriteAllBytesAsync(filePath, pngBytes, ct);

        var response = new SignatureAppearanceResponse(
            cacheKey,
            cacheKey,
            widthPt,
            heightPt,
            (int)MathF.Round(widthPt * scale),
            (int)MathF.Round(heightPt * scale),
            string.Empty);

        _cacheByKey[cacheKey] = response;
        _appearanceToPath[cacheKey] = filePath;
        return response;
    }

    public async Task<byte[]> GetPngBytesAsync(string appearanceId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_appearanceToPath.TryGetValue(appearanceId, out var filePath) || !File.Exists(filePath))
        {
            throw new FileNotFoundException($"Appearance '{appearanceId}' was not found.", appearanceId);
        }

        return await File.ReadAllBytesAsync(filePath, ct);
    }
}
