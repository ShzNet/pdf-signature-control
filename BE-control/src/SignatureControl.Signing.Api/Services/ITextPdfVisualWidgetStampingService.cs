using iText.IO.Image;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using SignatureControl.Contracts;

namespace SignatureControl.Signing.Api.Services;

public sealed class ITextPdfVisualWidgetStampingService : IPdfVisualWidgetStampingService
{
    public Task<byte[]> StampVisualWidgetsAsync(byte[] rawPdfBytes, IReadOnlyList<ResolvedSignatureWidget> widgets, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        using var input = new MemoryStream(rawPdfBytes);
        using var output = new MemoryStream();
        using var reader = new PdfReader(input);
        using var writer = new PdfWriter(output);
        using var pdfDoc = new PdfDocument(reader, writer, new StampingProperties().UseAppendMode());
        using var document = new Document(pdfDoc);

        foreach (var widget in widgets)
        {
            ct.ThrowIfCancellationRequested();

            var imageData = ImageDataFactory.Create(widget.AppearancePngBytes);
            var image = new Image(imageData)
                .SetFixedPosition(widget.Page, widget.Rect.X, widget.Rect.Y, widget.Rect.Width)
                .SetHeight(widget.Rect.Height);

            document.Add(image);
        }

        document.Flush();
        pdfDoc.Close();
        return Task.FromResult(output.ToArray());
    }
}
