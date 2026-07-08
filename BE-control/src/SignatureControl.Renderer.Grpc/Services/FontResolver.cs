using Microsoft.Extensions.Options;
using SignatureControl.Renderer.Grpc.Options;
using SkiaSharp;

namespace SignatureControl.Renderer.Grpc.Services;

public sealed class FontResolver : IDisposable
{
    private readonly SKTypeface? _regularTypeface;
    private readonly SKTypeface? _boldTypeface;

    public FontResolver(IWebHostEnvironment environment, IOptions<RendererOptions> options)
    {
        var regularPath = Path.Combine(environment.ContentRootPath, options.Value.FontRegularPath);
        var boldPath = Path.Combine(environment.ContentRootPath, options.Value.FontBoldPath);

        if (File.Exists(regularPath))
        {
            _regularTypeface = SKTypeface.FromFile(regularPath);
        }

        if (File.Exists(boldPath))
        {
            _boldTypeface = SKTypeface.FromFile(boldPath);
        }
    }

    public SKTypeface Regular => _regularTypeface ?? SKTypeface.Default;
    public SKTypeface Bold => _boldTypeface ?? SKTypeface.Default;

    public void Dispose()
    {
        _regularTypeface?.Dispose();
        _boldTypeface?.Dispose();
    }
}
