# BE-control

Sample backend tách thành 2 service để thử flow render widget chữ ký kiểu mới:

- `SignatureControl.Renderer.Grpc`: render PNG transparent bằng `SkiaSharp`, cache theo SHA256, expose gRPC.
- `SignatureControl.Signing.Api`: REST API cho preview, prepare, fill và session; gọi renderer qua gRPC và đóng dấu PDF bằng `iText 9`.

## Chạy local

```bash
cd BE-control
dotnet restore SignatureControlBackend.sln
dotnet run --project src/SignatureControl.Renderer.Grpc
dotnet run --project src/SignatureControl.Signing.Api
```

`Signing.Api` đang trỏ `RendererGrpc:Address = http://localhost:5288` trong `appsettings.json`.

## Trạng thái sample

- Preview/cache/render đã bám sát spec mới.
- `SignatureImageStore` vẫn là mock để sinh ảnh ký mẫu.
- `PdfVisualWidgetStampingService` đã dùng `iText 9` để đặt ảnh appearance vào đúng widget rectangle trên PDF.
- `PdfTwoPhaseSignService` đã dùng `iText 9` đúng flow two-phase: prepare PDF, tạo `signedAttributes`, rồi fill lại bằng chữ ký client/HSM.
- `fill.signature` giờ được dùng làm raw signature bytes để inject vào CMS container; nếu để trống thì sample sẽ fallback tự ký bằng cert giả để tiện test local.
- Chứng thư ký hiện là cert giả PEM đặt trong `assets/certs` để test end-to-end, chưa tích hợp CA/HSM thật.
- Gói `itext.bouncy-castle-adapter` là bắt buộc khi chạy `iText 9` cho luồng ký CMS/PKCS#7.
- Font và PDF sample đang được đặt ở `BE-control/assets/...`; config mặc định trong từng project đã trỏ ngược về thư mục đó.
- Font đọc từ `assets/fonts/Arial.ttf` và `assets/fonts/Arial Bold.ttf`; có thể thay bằng NotoSans đúng spec khi sẵn font.
