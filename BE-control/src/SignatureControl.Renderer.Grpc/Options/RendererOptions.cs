namespace SignatureControl.Renderer.Grpc.Options;

public sealed class RendererOptions
{
    public string CacheRoot { get; set; } = "data/appearance-cache";
    public string FontRegularPath { get; set; } = "assets/fonts/Arial.ttf";
    public string FontBoldPath { get; set; } = "assets/fonts/Arial Bold.ttf";
    public int MaxConcurrentRenders { get; set; } = Environment.ProcessorCount;
    public float DefaultRenderScale { get; set; } = 4f;
    public float MinRenderScale { get; set; } = 2f;

    public float ResolveRenderScale(float requestedScale)
    {
        if (requestedScale <= 0f)
        {
            return Math.Max(1f, DefaultRenderScale);
        }

        return Math.Max(Math.Max(1f, MinRenderScale), requestedScale);
    }
}
