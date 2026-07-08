using Microsoft.Extensions.Options;
using SignatureControl.Contracts;
using SignatureControl.Renderer.Grpc.Options;
using SignatureControl.Renderer.Grpc.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<RendererOptions>(builder.Configuration.GetSection("Renderer"));
builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<RendererOptions>>().Value);
builder.Services.AddSingleton<FontResolver>();
builder.Services.AddSingleton<IAppearanceCacheService, AppearanceCacheService>();
builder.Services.AddSingleton<ISignatureImageStore, MockSignatureImageStore>();
builder.Services.AddSingleton<ISignatureAppearanceRenderer, SignatureAppearanceRenderer>();
builder.Services.AddGrpc();

var app = builder.Build();

app.MapGrpcService<SignatureAppearanceGrpcService>();
app.MapGet("/", () => Results.Ok(new
{
    service = "SignatureControl.Renderer.Grpc",
    health = "ok"
}));

app.Run();
