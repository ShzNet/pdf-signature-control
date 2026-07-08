# Run React Sample

Guide này dùng cho sample mới ở `FE-control/apps/demo-react` và 2 backend ở `BE-control`.

## 1. Chuẩn bị

Yêu cầu local:

- .NET SDK 10
- Node.js 20+
- `npm`

## 2. Chạy backend

Mở terminal 1:

```bash
cd BE-control
dotnet restore SignatureControlBackend.sln
dotnet run --project src/SignatureControl.Renderer.Grpc
```

Renderer gRPC mặc định chạy ở:

```txt
http://localhost:5288
```

Mở terminal 2:

```bash
cd BE-control
dotnet run --project src/SignatureControl.Signing.Api
```

Signing API mặc định chạy ở:

```txt
http://localhost:5188
```

## 3. Chạy frontend React sample

Mở terminal 3:

```bash
cd FE-control
npm install
npm run start:react
```

Sample React mặc định chạy ở:

```txt
http://localhost:4200
```

`demo-react` đã được cấu hình Vite proxy:

```txt
/api/* -> http://localhost:5188
```

Nên khi chạy local không cần bật CORS ở backend sample.

## 4. Flow test trên UI

### 4.1 Mở PDF sample

FE sample sẽ load:

```txt
/multipage.pdf
```

Backend sample sẽ ký trên document:

```txt
documentId = multipage
```

## 4.2 Tạo widget

1. Bấm `Configure Widget Content`
2. Chỉnh các tham số setup chữ ký:
   - `ImageType`
   - `LayoutDirection`
   - `ImageSize`
   - `TextSize`
   - `CertificateNameFontSize`
   - `LanguageCode`
   - các cờ `Show*`
   - nếu vẽ tay: `penColor`, `penWidth`
   - nếu chữ gõ: `typed.name`
   - nếu ảnh: upload image + nền `transparent/white`
   - `VisualGoal`
3. Chỉnh:
   - `Page`
   - `X / Y`
   - `Width / Height`
4. Bấm `Add Widget`

Kết quả:

- FE gọi `POST /api/signature-appearance/preview`
- backend render PNG preview
- widget được add vào PDF viewer dưới dạng ảnh
- preview hiện đã phụ thuộc vào toàn bộ bộ tham số setup ở trên
- riêng `TextSize` và `CertificateNameFontSize` hiện được hiểu là mức tỷ lệ theo chiều cao khung, không phải cỡ chữ cố định

## 4.3 Kéo thả / resize

Sau khi add widget:

- kéo để đổi vị trí
- resize để đổi kích thước

Sample React hiện xử lý như sau:

- drag chỉ đổi `x/y`, không gọi render lại preview
- resize sẽ debounce rồi gọi lại preview backend theo `width/height` mới

Mục tiêu là FE luôn hiển thị PNG do backend render, không render HTML/CSS riêng.

## 4.4 Prepare signing

Bấm:

```txt
1. Prepare Signing
```

FE sẽ gọi:

```txt
POST /api/pdf-signing/prepare
```

Request gồm:

- `documentId = multipage`
- danh sách widget placements hiện có trên viewer
- `hashAlgorithm = Sha256`
- `signTime = now`

Kết quả:

- backend stamp tất cả visual widgets vào PDF
- tạo digital signature field
- prepare document để ký
- trả về:
  - `signingSessionId`
  - `preparedDocumentId`
  - `fieldName`
  - `signedAttributes`

## 4.5 Fill sample signature

Bấm:

```txt
2. Fill Sample Signature
```

Trong sample hiện tại, FE gửi:

```json
{
  "signature": ""
}
```

Backend sẽ fallback tự ký bằng cert giả PEM trong:

```txt
BE-control/assets/certs
```

Kết quả:

- backend fill signature vào prepared PDF
- FE nhận `fileBytes`
- FE tạo blob URL và hiện link:

```txt
Open Final Signed PDF
```

## 5. Kỳ vọng kết quả

Nếu flow chạy đúng:

- widget preview trên FE là ảnh PNG từ backend
- drag/drop/resize hoạt động trực tiếp trên sample React
- `Prepare Signing` trả session id
- `Fill Sample Signature` mở được PDF kết quả
- PDF final có signature dictionary kiểu:
  - `/Filter /Adobe.PPKLite`
  - `/SubFilter /adbe.pkcs7.detached`

## 6. Lưu ý sample

- `ImageType = 0` và `ImageType = 2` đều đi qua renderer backend.
- `ImageType = 0` giờ dùng canvas vẽ tay thật ở FE, lưu ra PNG data URL rồi gửi xuống backend renderer.
- `ImageType = 2` hỗ trợ upload ảnh từ FE dưới dạng data URL; backend sample sẽ decode và render lại.
- `ImageType = 1` sẽ render tên typed ngay ở backend theo `typed.name`.
- FE chưa ký thật bằng WebCrypto/HSM; bước `fill` hiện đang để backend tự ký bằng cert giả cho dễ test.
- Khi cần signer thật, thay `signature: ""` bằng raw signature bytes base64 từ client/HSM.
