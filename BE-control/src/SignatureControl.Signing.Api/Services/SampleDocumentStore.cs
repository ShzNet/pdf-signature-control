using SignatureControl.Contracts;
using SignatureControl.Signing.Api.Options;

namespace SignatureControl.Signing.Api.Services;

public sealed class SampleDocumentStore : IDocumentStore
{
    private readonly string _documentsRoot;
    private readonly string _finalRoot;

    public SampleDocumentStore(IWebHostEnvironment environment, SampleDocumentOptions options)
    {
        _documentsRoot = Path.Combine(environment.ContentRootPath, options.DocumentsRoot);
        _finalRoot = Path.Combine(environment.ContentRootPath, "data/final-documents");
        Directory.CreateDirectory(_documentsRoot);
        Directory.CreateDirectory(_finalRoot);
    }

    public async Task<byte[]> LoadDocumentAsync(string documentId, CancellationToken ct)
    {
        var filePath = Path.Combine(_documentsRoot, $"{documentId}.pdf");
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Document '{documentId}' was not found in sample store.", filePath);
        }

        return await File.ReadAllBytesAsync(filePath, ct);
    }

    public async Task<string> SaveFinalDocumentAsync(string signingSessionId, byte[] fileContent, CancellationToken ct)
    {
        var finalDocumentId = $"final_{signingSessionId}";
        var filePath = Path.Combine(_finalRoot, $"{finalDocumentId}.pdf");
        await File.WriteAllBytesAsync(filePath, fileContent, ct);
        return finalDocumentId;
    }
}
