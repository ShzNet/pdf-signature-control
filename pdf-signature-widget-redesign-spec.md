# Spec / Prompt triển khai mới: PDF Signature Widget Preview + Two-Phase Signing + Multi Widgets

## 0. Bối cảnh

Tôi đang làm hệ thống ký điện tử cho **PDF**.

Stack mong muốn:

- Frontend: **React + TypeScript**
- PDF preview: **PDF.js** hoặc `react-pdf`
- Backend: **ASP.NET Core / .NET**
- Render appearance widget chữ ký: **SkiaSharp**
- PDF signing/stamping: hiện đang dùng **iText**
- Output widget appearance: **PNG transparent**
- Yêu cầu chính: preview trên web phải giống kết quả khi đóng vào PDF cuối.

Code cũ hiện đang có `PdfSignService` theo hướng **two-phase signing**:

- `PrepareSignFileAsync(...)`
  - tạo CMS container
  - set certificate chain
  - set digest/signature algorithm
  - tạo `SignerProperties`
  - nếu có `appearancePosition` thì set `SignatureFieldAppearance` bằng `ImageDataFactory.CreatePng(signatureImage)`
  - dùng `PdfTwoPhaseSigner.PrepareDocumentForSignature(...)`
  - trả về:
    - file PDF đã prepare
    - serialized signed attributes để client/HSM ký

- `FillSignFileAsync(...)`
  - đọc prepared PDF
  - lấy signature field theo `fieldName`
  - inject chữ ký thật vào CMS container
  - gọi `PdfTwoPhaseSigner.AddSignatureToPreparedDocument(...)`
  - trả final signed PDF

Điểm cần đổi:

- Hiện flow cũ xử lý **một appearance / một position / một fieldName**.
- Flow mới cần hỗ trợ **một lần ký có nhiều visual widgets**.
- Việc ký vẫn giữ **2 bước**:
  1. Prepare signing: tạo prepared PDF + signed attributes.
  2. Fill signing: nhận chữ ký từ client/HSM rồi fill vào prepared PDF.
- Tất cả visual widgets phải được render/stamp **trước khi tạo digest ở prepare step**.
- Sau khi prepare xong, tuyệt đối không được sửa PDF nữa trước khi fill, vì sửa PDF sau prepare sẽ làm sai digest/signature.

---

## 1. Quyết định kiến trúc final

Không dùng SVG ở phase sample.

Chốt hướng:

```txt
React chỉ làm placement UI.
.NET là source of truth để render nội dung widget.
Widget appearance render ra PNG transparent bằng SkiaSharp.
Preview dùng đúng PNG đó.
Ký PDF dùng lại đúng PNG đó.
```

Luồng tổng thể:

```txt
React + PDF.js
 ├── render PDF page
 ├── overlay vùng ký để drag / resize
 ├── hỗ trợ nhiều signature widgets
 ├── khi đang kéo: scale ảnh preview cũ ở FE
 ├── mouseup / resize end / đổi nội dung: gọi BE preview
 └── hiển thị PNG do BE trả về

.NET API
 ├── SignatureTemplateService
 ├── SignatureLayoutEngine
 ├── SignatureAppearanceRenderer - SkiaSharp
 ├── AppearanceCacheService
 ├── SignatureImageStore
 ├── PdfVisualWidgetStampingService
 ├── PdfTwoPhaseSignService
 └── PdfSignWorkflowService
```

Key concept:

```txt
Preview PNG = Final PNG stamp vào PDF
```

Không được để FE tự render nội dung widget bằng HTML/CSS rồi BE render lại bằng cách khác.

---

## 2. Keypoint quan trọng: nhiều widget trong một lần ký

Có 2 khái niệm khác nhau cần tách rõ:

### 2.1 Visual Signature Widget

Là phần nhìn thấy trên PDF:

- ảnh chữ ký
- tên người ký
- chức vụ
- đơn vị
- thời gian ký
- border / layout

Một lần ký có thể có nhiều visual widgets:

```txt
Widget 1: page 1, x/y/w/h
Widget 2: page 3, x/y/w/h
Widget 3: page 5, x/y/w/h
```

### 2.2 Digital Signature Field

Là chữ ký số thật trong PDF:

- chứa CMS/PKCS#7
- có ByteRange
- có signed attributes
- được verify bằng certificate
- có thể visible hoặc invisible

Khuyến nghị cho sample:

```txt
Một signing transaction = một digital signature field
Một digital signature field có thể cover toàn bộ PDF đã bao gồm nhiều visual widgets
Nhiều visual widgets sẽ được stamp như normal PDF content trước khi prepare digest
```

Nói cách khác:

```txt
Nhiều widget nhìn thấy
Nhưng một chữ ký số thật cho một lần ký
```

Nếu nghiệp vụ yêu cầu mỗi widget là một chữ ký số độc lập, thì không xử lý song song cùng lúc. Phải ký tuần tự:

```txt
Prepare field A -> Fill field A -> output PDF A
Prepare field B trên PDF A -> Fill field B -> output PDF B
Prepare field C trên PDF B -> Fill field C -> output PDF C
```

Không prepare nhiều signature fields độc lập rồi fill sau nếu chưa kiểm soát rõ ByteRange và incremental updates.

---

## 3. Luồng ký mới

### 3.1 Preview phase

User đặt nhiều widgets trên React.

FE gửi từng widget hoặc batch widgets lên BE để render preview PNG:

```http
POST /api/signature-appearance/preview
```

Hoặc batch:

```http
POST /api/signature-appearance/preview-batch
```

BE:

1. Nhận template + content + box size.
2. Build cache key.
3. Nếu cache hit thì trả PNG cũ.
4. Nếu cache miss thì SkiaSharp render PNG transparent.
5. Trả `appearanceId`, `url`, size.

### 3.2 Prepare signing phase

Khi user bấm ký:

```http
POST /api/pdf-signing/prepare
```

Request gồm:

- `documentId`
- `fieldName`
- `certificateChains`
- `hashAlgorithm`
- `signTime`
- danh sách `widgets`
  - page
  - rect
  - appearanceId
  - templateId
  - content snapshot nếu cần regenerate

BE:

1. Load raw PDF.
2. Resolve tất cả widgets.
3. Lấy hoặc render lại PNG appearance cho từng widget.
4. Stamp tất cả visual widget PNG vào PDF bằng append mode hoặc trước prepare.
5. Tạo một digital signature field.
6. Prepare document for signature.
7. Tính document digest.
8. Build signed attributes.
9. Lưu signing session.
10. Trả về:
    - `signingSessionId`
    - `preparedDocumentId` hoặc prepared PDF bytes
    - `fieldName`
    - `signedAttributes`
    - `hashAlgorithm`
    - metadata cần cho client/HSM ký

### 3.3 Fill signing phase

Client/HSM ký `signedAttributes` xong gửi chữ ký về:

```http
POST /api/pdf-signing/fill
```

Request:

```json
{
  "signingSessionId": "sign_session_123",
  "fieldName": "sig_20260707_001",
  "signature": "base64..."
}
```

BE:

1. Load prepared PDF từ signing session.
2. Read CMS placeholder từ field.
3. Inject signature bytes vào CMS.
4. Add signature to prepared document.
5. Lưu final PDF.
6. Trả final document.

---

## 4. DTO đề xuất

### 4.1 Signature widget placement

```csharp
public sealed record SignatureWidgetPlacementDto(
    string WidgetId,
    int Page,
    PdfRectDto Rect,
    string AppearanceId,
    string TemplateId,
    SignatureContentDto ContentSnapshot
);

public sealed record PdfRectDto(
    float X,
    float Y,
    float Width,
    float Height,
    string Unit = "pt"
);
```

### 4.2 Signature content

```csharp
public sealed record SignatureContentDto(
    string SignerName,
    string? Title,
    string? Organization,
    string SignedAtText,
    string SignatureImageId
);
```

### 4.3 Preview request

```csharp
public sealed record SignatureAppearancePreviewRequest(
    string TemplateId,
    SignatureBoxDto Box,
    SignatureContentDto Content,
    SignatureRenderOptionsDto Render
);

public sealed record SignatureBoxDto(
    float Width,
    float Height,
    string Unit = "pt"
);

public sealed record SignatureRenderOptionsDto(
    string Format = "png",
    float Scale = 2f
);
```

### 4.4 Preview response

```csharp
public sealed record SignatureAppearanceResponse(
    string AppearanceId,
    string CacheKey,
    float WidthPt,
    float HeightPt,
    int WidthPx,
    int HeightPx,
    string Url
);
```

### 4.5 Prepare signing request

```csharp
public sealed record PreparePdfSigningRequest(
    string DocumentId,
    string FieldName,
    List<byte[]> CertificateChains,
    HashAlgorithmType HashAlgorithm,
    DateTimeOffset SignTime,
    IReadOnlyList<SignatureWidgetPlacementDto> Widgets
);
```

### 4.6 Prepare signing response

```csharp
public sealed record PreparePdfSigningResponse(
    string SigningSessionId,
    string PreparedDocumentId,
    string FieldName,
    byte[] SignedAttributes,
    string HashAlgorithm
);
```

### 4.7 Fill signing request

```csharp
public sealed record FillPdfSigningRequest(
    string SigningSessionId,
    string FieldName,
    byte[] Signature
);
```

### 4.8 Fill signing response

```csharp
public sealed record FillPdfSigningResponse(
    string FinalDocumentId,
    byte[]? FileBytes
);
```

---

## 5. Services cần tách

### 5.1 SignatureAppearanceRenderer

Nhiệm vụ:

- nhận `template + content + width/height`
- render PNG transparent bằng SkiaSharp
- hỗ trợ:
  - text
  - line break
  - ellipsis
  - ảnh chữ ký `contain`
  - font fixed
  - scale 2x/3x
  - transparent background

Interface:

```csharp
public interface ISignatureAppearanceRenderer
{
    Task<byte[]> RenderPngAsync(SignatureAppearancePreviewRequest request, CancellationToken ct);
}
```

### 5.2 AppearanceCacheService

Nhiệm vụ:

- build cache key
- lưu PNG theo `appearanceId`
- lấy PNG theo `appearanceId`
- tránh render lại khi input không đổi

Interface:

```csharp
public interface IAppearanceCacheService
{
    Task<SignatureAppearanceResponse?> TryGetAsync(string cacheKey, CancellationToken ct);
    Task<SignatureAppearanceResponse> SaveAsync(
        string cacheKey,
        byte[] pngBytes,
        float widthPt,
        float heightPt,
        float scale,
        CancellationToken ct);

    Task<byte[]> GetPngBytesAsync(string appearanceId, CancellationToken ct);
}
```

### 5.3 PdfVisualWidgetStampingService

Nhiệm vụ:

- nhận PDF bytes + danh sách widget placements
- stamp tất cả PNG appearance vào đúng page/rect
- output PDF bytes đã có visual widgets
- không xử lý CMS/signature ở service này

Interface:

```csharp
public interface IPdfVisualWidgetStampingService
{
    Task<byte[]> StampVisualWidgetsAsync(
        byte[] rawPdfBytes,
        IReadOnlyList<ResolvedSignatureWidget> widgets,
        CancellationToken ct);
}

public sealed record ResolvedSignatureWidget(
    string WidgetId,
    int Page,
    PdfRectDto Rect,
    byte[] AppearancePngBytes
);
```

### 5.4 PdfTwoPhaseSignService

Nhiệm vụ:

- giữ logic ký số two-phase hiện có
- không tự render appearance nữa
- nhận PDF đã được stamp visual widgets
- prepare signature field
- fill signature field

Interface:

```csharp
public interface IPdfTwoPhaseSignService
{
    Task<PrepareSignResult> PrepareSignFileAsync(
        byte[] pdfContentAlreadyStamped,
        string fieldName,
        List<byte[]> certificateChains,
        HashAlgorithmType hashAlgorithm,
        DateTimeOffset signTime,
        CancellationToken ct);

    Task<SignResult> FillSignFileAsync(
        byte[] preparedPdfContent,
        string fieldName,
        byte[] signature,
        CancellationToken ct);
}
```

### 5.5 PdfSignWorkflowService

Nhiệm vụ:

- orchestration tổng thể
- gọi appearance cache
- gọi stamping service
- gọi two-phase sign service
- lưu signing session

Interface:

```csharp
public interface IPdfSignWorkflowService
{
    Task<PreparePdfSigningResponse> PrepareAsync(
        PreparePdfSigningRequest request,
        CancellationToken ct);

    Task<FillPdfSigningResponse> FillAsync(
        FillPdfSigningRequest request,
        CancellationToken ct);
}
```

---

## 6. Refactor từ code cũ

### 6.1 Không để `PrepareSignFileAsync` nhận một `signatureImage` nữa

Code cũ có dạng:

```csharp
PrepareSignFileAsync(
    byte[] rawFileContent,
    string fieldName,
    List<byte[]> certificateChains,
    HashAlgorithmType hashAlgorithm,
    DateTimeOffset signTime,
    byte[]? signatureImage,
    SignAppearancePosition? appearancePosition
)
```

Nên tách thành 2 bước rõ hơn:

```csharp
// Step A: Stamp visual widgets
var stampedPdf = await visualWidgetStampingService.StampVisualWidgetsAsync(
    rawPdf,
    resolvedWidgets,
    ct);

// Step B: Prepare cryptographic signature
var prepareResult = await twoPhaseSignService.PrepareSignFileAsync(
    stampedPdf,
    fieldName,
    certificateChains,
    hashAlgorithm,
    signTime,
    ct);
```

### 6.2 `FillSignFileAsync` có thể giữ gần như cũ

Vì fill step chỉ cần:

- prepared PDF
- fieldName
- signature bytes

```csharp
var fillResult = await twoPhaseSignService.FillSignFileAsync(
    preparedPdf,
    fieldName,
    signature,
    ct);
```

### 6.3 Không được stamp thêm widget sau prepare

Sai:

```txt
Prepare signature
Client ký signedAttributes
Stamp thêm image/widget
Fill signature
```

Đúng:

```txt
Render all widget PNG
Stamp all widget PNG
Prepare signature
Client ký signedAttributes
Fill signature
```

---

## 7. Implementation note cho iText

### 7.1 Stamp nhiều visual widgets

Dùng iText để draw image vào page content trước prepare.

Pseudo-code:

```csharp
public async Task<byte[]> StampVisualWidgetsAsync(
    byte[] rawPdfBytes,
    IReadOnlyList<ResolvedSignatureWidget> widgets,
    CancellationToken ct)
{
    using var input = new MemoryStream(rawPdfBytes);
    using var output = new MemoryStream();

    using var reader = new PdfReader(input);
    using var writer = new PdfWriter(output);

    using var pdfDoc = new PdfDocument(reader, writer, new StampingProperties().UseAppendMode());

    foreach (var widget in widgets)
    {
        var page = pdfDoc.GetPage(widget.Page);
        var imageData = ImageDataFactory.CreatePng(widget.AppearancePngBytes);

        var image = new iText.Layout.Element.Image(imageData)
            .SetFixedPosition(
                widget.Page,
                widget.Rect.X,
                widget.Rect.Y,
                widget.Rect.Width)
            .SetHeight(widget.Rect.Height);

        using var document = new iText.Layout.Document(pdfDoc);
        document.Add(image);
    }

    return output.ToArray();
}
```

Lưu ý: sample trên có thể cần chỉnh lifecycle của `Document` để không tạo nhiều lần trong loop. Khi implement thật, tạo `Document` một lần rồi add toàn bộ images.

### 7.2 Prepare signature field invisible hoặc visible

Vì visual widgets đã được stamp như normal content, digital signature field có thể invisible:

```csharp
var signerProperty = new SignerProperties()
    .SetFieldName(fieldName);

signerProperty.SetClaimedSignDate(signTime.DateTime.ToUniversalTime());
```

Nếu nghiệp vụ bắt buộc có visible signature field, có thể đặt một field nhỏ hoặc dùng một trong các widget làm visible field. Nhưng phase sample nên ưu tiên:

```txt
Visual widgets = stamped content
Digital signature field = invisible hoặc field kỹ thuật
```

Lý do: một signature field chỉ có một appearance rectangle, trong khi nghiệp vụ của mình có nhiều widgets.

---

## 8. Renderer SkiaSharp yêu cầu

### 8.1 NuGet

```bash
dotnet add package SkiaSharp
dotnet add package SkiaSharp.NativeAssets.Linux.NoDependencies
```

Không dùng `System.Drawing.Common`.

### 8.2 Font

Ship font cùng app:

```txt
assets/fonts/NotoSans-Regular.ttf
assets/fonts/NotoSans-Bold.ttf
```

Không phụ thuộc font hệ điều hành.

### 8.3 Render rule

```txt
Input unit: pt
Bitmap size: widthPt * scale, heightPt * scale
canvas.Scale(scale)
Từ đó vẽ mọi thứ bằng pt
Output: PNG transparent
```

### 8.4 Layout default

```txt
Horizontal layout:
- ảnh bên trái
- text bên phải
- imageRatio = 0.38
- paddingRatio = 0.07
- fontScale = clamp(min(width/baseWidth, height/baseHeight), 0.9, 1.1)
```

### 8.5 Field visibility rule

```txt
Nếu height < 45pt:
  chỉ hiện ảnh + signerName

Nếu 45pt <= height < 60pt:
  hiện ảnh + signerName + signedAtText

Nếu height >= 60pt:
  hiện ảnh + signerName + title + organization + signedAtText
```

### 8.6 Text rule

```txt
signerName: 1 line, bold, ellipsis
title: 1 line, ellipsis
organization: 1 line, ellipsis
signedAtText: 1 line, ellipsis
reason/note nếu có: max 2 lines, wrap + ellipsis
```

---

## 9. Cache và performance

### 9.1 Cache key

Cache key phải bao gồm:

```txt
rendererVersion
templateId
width
height
content snapshot
signatureImageId
signatureImageHash
scale
fontVersion
```

Ví dụ:

```csharp
public static string BuildAppearanceCacheKey(
    SignatureAppearancePreviewRequest req,
    string signatureImageHash)
{
    var raw = string.Join("|",
        "signature-renderer-v1",
        req.TemplateId,
        req.Box.Width.ToString("0.###"),
        req.Box.Height.ToString("0.###"),
        req.Content.SignerName,
        req.Content.Title,
        req.Content.Organization,
        req.Content.SignedAtText,
        req.Content.SignatureImageId,
        signatureImageHash,
        req.Render.Scale.ToString("0.##"),
        "font:NotoSans:v1"
    );

    var bytes = System.Text.Encoding.UTF8.GetBytes(raw);
    var hash = System.Security.Cryptography.SHA256.HashData(bytes);

    return Convert.ToHexString(hash).ToLowerInvariant();
}
```

### 9.2 FE không spam preview API

FE rule:

```txt
onDragMove / onResizeMove:
  update local box
  scale preview image cũ bằng CSS
  không gọi API

onDragEnd / onResizeEnd:
  debounce 300-500ms
  gọi API preview

onContentChange:
  debounce 400-500ms
  gọi API preview
```

### 9.3 BE limit concurrency

```csharp
private static readonly SemaphoreSlim RenderLimiter =
    new(Environment.ProcessorCount);

public async Task<byte[]> RenderWithLimitAsync(Func<Task<byte[]>> action)
{
    await RenderLimiter.WaitAsync();

    try
    {
        return await action();
    }
    finally
    {
        RenderLimiter.Release();
    }
}
```

---

## 10. API endpoints đề xuất

### Appearance

```http
POST /api/signature-appearance/preview
POST /api/signature-appearance/preview-batch
GET  /api/signature-appearance/{appearanceId}.png
```

### Signing

```http
POST /api/pdf-signing/prepare
POST /api/pdf-signing/fill
GET  /api/pdf-signing/sessions/{signingSessionId}
```

### Validation

```http
GET /api/pdf-signing/{documentId}/sign-fields
```

---

## 11. React behavior

Component chính:

```txt
PdfSignatureEditor
 ├── PdfViewer
 ├── SignatureOverlayLayer
 ├── SignatureWidgetBox
 ├── ResizeHandles
 └── SignButton
```

State:

```ts
type SignatureWidgetState = {
  widgetId: string;
  page: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit: "pt";
  };
  templateId: string;
  content: SignatureContent;
  appearanceId?: string;
  appearanceUrl?: string;
};
```

Flow:

```txt
1. User add widget
2. FE set default size 180pt x 80pt
3. FE gọi preview
4. User drag/resize nhiều widget
5. FE chỉ gọi preview khi drag/resize end
6. User bấm Sign
7. FE gọi /prepare với danh sách widgets
8. FE/HSM ký signedAttributes
9. FE gọi /fill với signature
10. BE trả final PDF
```

---

## 12. Checklist test

### Appearance

- [ ] Widget 180pt x 80pt render đẹp.
- [ ] Widget nhỏ 120pt x 45pt không vỡ layout.
- [ ] Widget lớn 240pt x 120pt không phóng font quá đà.
- [ ] Tên dài có ellipsis.
- [ ] Chức vụ dài có ellipsis.
- [ ] Organization dài có ellipsis.
- [ ] Ảnh chữ ký ngang/dọc/vuông đều `contain`.
- [ ] PNG transparent không có nền trắng.
- [ ] Font tiếng Việt không lỗi dấu.

### Preview

- [ ] Zoom PDF 50%.
- [ ] Zoom PDF 100%.
- [ ] Zoom PDF 150%.
- [ ] Zoom PDF 200%.
- [ ] devicePixelRatio 1.
- [ ] devicePixelRatio 2.
- [ ] Resize xong preview đúng lại.
- [ ] Nhiều widgets trên nhiều page.

### Signing

- [ ] Prepare với 1 widget.
- [ ] Prepare với nhiều widgets cùng page.
- [ ] Prepare với nhiều widgets khác page.
- [ ] Fill xong PDF verify valid.
- [ ] Không sửa PDF giữa prepare và fill.
- [ ] Output PDF có đủ visual widgets.
- [ ] Signature field verify OK.
- [ ] GetSignFieldInfos đọc được chữ ký sau khi fill.

### Performance

- [ ] Drag liên tục không spam API.
- [ ] Cache hit khi input giống nhau.
- [ ] Cache miss khi width/height thay đổi.
- [ ] 50 client preview cùng lúc không quá tải.
- [ ] Renderer có concurrency limit.

---

## 13. Prompt để đưa cho Cursor / Claude Code / ChatGPT

Bạn là senior full-stack engineer. Hãy refactor/tạo mới sample triển khai hệ thống PDF signature widget preview và two-phase signing cho stack React + ASP.NET Core .NET.

Yêu cầu nghiệp vụ:

- User có thể đặt nhiều widget chữ ký trên nhiều trang PDF.
- Mỗi widget gồm:
  - ảnh chữ ký
  - tên người ký
  - chức vụ
  - đơn vị
  - thời gian ký
- User có thể drag/resize widget trên FE.
- Preview trên FE phải giống output PDF cuối.
- Ký vẫn theo 2 bước:
  1. Prepare signing: backend tạo prepared PDF và signed attributes.
  2. Fill signing: backend nhận signature bytes từ client/HSM và fill vào PDF.
- Một signing transaction có thể có nhiều visual widgets.
- Với sample, dùng một digital signature field cho một signing transaction, còn nhiều widgets là visual stamps được đóng vào PDF trước khi prepare digest.
- Không được sửa PDF sau prepare trước khi fill.

Yêu cầu kỹ thuật:

Frontend:

- React + TypeScript.
- PDF preview bằng PDF.js hoặc react-pdf.
- React chỉ làm placement UI.
- React không tự render nội dung widget làm source of truth.
- React hiển thị PNG appearance do backend trả về.
- Hỗ trợ nhiều widgets.
- Khi drag/resize đang diễn ra, không gọi API liên tục.
- Khi drag end/resize end/content change thì debounce rồi gọi preview API.
- Khi bấm Sign, gửi danh sách widgets kèm appearanceId/box/page lên backend prepare API.

Backend:

- ASP.NET Core .NET.
- Render widget appearance bằng SkiaSharp.
- Output PNG transparent.
- Không dùng System.Drawing.Common.
- Font ship cùng app: NotoSans-Regular.ttf và NotoSans-Bold.ttf.
- Layout dùng đơn vị pt.
- Renderer nhận width/height từ request.
- Text hỗ trợ ellipsis và WrapText.
- Ảnh chữ ký fit contain, preserve aspect ratio.
- Có cache appearance bằng SHA256.
- Có SemaphoreSlim limit concurrency render.
- Có service tách biệt:
  - SignatureAppearanceRenderer
  - AppearanceCacheService
  - SignatureImageStore
  - PdfVisualWidgetStampingService
  - PdfTwoPhaseSignService
  - PdfSignWorkflowService

Signing:

- Refactor từ code cũ đang có PrepareSignFileAsync và FillSignFileAsync.
- Không để PrepareSignFileAsync nhận một signatureImage/appearancePosition nữa.
- Thay vào đó:
  1. Stamp tất cả visual widget PNG vào PDF.
  2. Gọi two-phase prepare trên PDF đã stamp.
  3. Trả signedAttributes cho client/HSM ký.
  4. Fill signature vào prepared PDF.
- FillSignFileAsync có thể giữ gần logic cũ: đọc prepared PDF, lấy fieldName, inject signature vào CMS, AddSignatureToPreparedDocument.

Cần tạo:

1. Cấu trúc thư mục.
2. DTOs.
3. Controllers:
   - SignatureAppearanceController
   - PdfSigningController
4. Services và interfaces.
5. Renderer SkiaSharp sample.
6. Cache in-memory hoặc file-based sample.
7. Mock SignatureImageStore.
8. PdfVisualWidgetStampingService sample bằng iText.
9. PdfTwoPhaseSignService refactor từ code cũ.
10. PdfSignWorkflowService orchestration.
11. React component sample:
    - PdfSignatureEditor
    - SignatureOverlayLayer
    - SignatureWidgetBox
12. README hướng dẫn chạy.
13. Checklist test.

Ưu tiên làm backend renderer + signing workflow trước, sau đó làm frontend sample.

Các nguyên tắc không được vi phạm:

- Không dùng HTML/CSS làm appearance cuối.
- Không dùng SVG ở phase sample.
- Không sửa PDF sau prepare trước khi fill.
- Không render lại widget bằng engine khác giữa preview và final PDF.
- Không phụ thuộc font hệ điều hành.
- Không spam API preview khi drag/resize.
- Không coi mỗi visual widget là một digital signature field nếu nghiệp vụ chỉ là một lần ký.

---

## 14. Kết luận triển khai

Final design:

```txt
Template + Content + Final Box
        ↓
SkiaSharp Renderer
        ↓
PNG transparent appearance
        ↓
React preview dùng PNG
        ↓
User bấm ký
        ↓
BE stamp tất cả PNG widgets vào PDF
        ↓
BE prepare digital signature
        ↓
Client/HSM ký signed attributes
        ↓
BE fill signature
        ↓
Final signed PDF
```

Đây là hướng thực dụng nhất để đạt:

- preview đồng nhất với PDF cuối
- hỗ trợ nhiều widget
- giữ được two-phase signing hiện tại
- giảm rủi ro lệch layout text/image
- dễ refactor từ code cũ
- đủ nền tảng để mở rộng production
