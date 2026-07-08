using Microsoft.Extensions.Options;
using SignatureControl.Contracts;
using SignatureControl.Signing.Api.Options;
using SignatureControl.Signing.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.Configure<RendererGrpcOptions>(builder.Configuration.GetSection("RendererGrpc"));
builder.Services.Configure<SampleDocumentOptions>(builder.Configuration.GetSection("SampleDocuments"));
builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<RendererGrpcOptions>>().Value);
builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<SampleDocumentOptions>>().Value);
builder.Services.AddSingleton<SignatureAppearanceGrpcClient>();
builder.Services.AddSingleton<FakeCertificateProvider>();
builder.Services.AddSingleton<ISigningSessionStore, InMemorySigningSessionStore>();
builder.Services.AddSingleton<IDocumentStore, SampleDocumentStore>();
builder.Services.AddSingleton<IPdfVisualWidgetStampingService, ITextPdfVisualWidgetStampingService>();
builder.Services.AddSingleton<IPdfTwoPhaseSignService, ITextPdfTwoPhaseSignService>();
builder.Services.AddSingleton<IPdfSignWorkflowService, PdfSignWorkflowService>();

var app = builder.Build();

app.MapControllers();
app.MapGet("/", () => Results.Ok(new
{
    service = "SignatureControl.Signing.Api",
    health = "ok"
}));

app.Run();
