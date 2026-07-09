# Full Solution - PDF Signature Control

## 1. Mục tiêu

Thiết kế lại luồng ký PDF để phù hợp với bài toán thực tế:

- Người dùng thêm nhiều vùng ký trước.
- Tất cả vùng ký dùng chung một cấu hình appearance.
- Setup appearance thực hiện trong modal theo flow step-by-step.
- Chỉ generate preview thật sau khi người dùng hoàn tất setup.
- Preview phải hiển thị đúng hơn khi zoom PDF, nhưng quyền quyết định chất lượng render thuộc về backend.

---

## 2. Luồng nghiệp vụ cuối cùng

Luồng cuối cùng được chốt là 3 bước tách biệt:

1. Thêm các vùng ký trên file PDF.
2. Xác nhận ký, mở modal để setup appearance dùng chung cho toàn bộ vùng ký.
3. Prepare file.
4. Fill sample signature / ký thử.

Lưu ý:

- UI vẫn giữ 3 bước hành động chính ở panel phải:
  - `1. Xác nhận ký`
  - `2. Prepare File`
  - `3. Fill Sample Signature`
- Việc "thêm vùng ký" là thao tác chuẩn bị ở panel trái, không gộp vào modal setup.
- `Prepare File` vẫn là bước riêng, không bị mất khỏi flow.

---

## 3. Trải nghiệm người dùng

### 3.1. Khi thêm vùng ký

Khi user add vùng ký:

- Chưa gọi preview appearance ngay.
- Hệ thống chỉ tạo widget placeholder ở trạng thái idle.
- Placeholder hiển thị text như:
  - `Vùng ký 1`
  - `Vùng ký 2`
  - `Vùng ký 3`

Mục tiêu:

- User tập trung đặt đúng vị trí vùng ký trước.
- Không tốn request preview khi appearance chưa được chốt.
- Tránh cảm giác flow bị ngược.

### 3.2. Khi setup appearance

Khi user bấm `Xác nhận ký`:

- Mở modal setup chữ ký.
- Modal đóng vai trò wizard cấu hình appearance dùng chung.
- Sau khi confirm:
  - profile appearance được áp dụng cho tất cả vùng ký
  - preview thật mới được fetch về
  - widget trên PDF mới chuyển từ placeholder sang preview thật

### 3.3. Shared appearance

Toàn bộ vùng ký dùng chung một appearance setup:

- cùng layout
- cùng font size
- cùng language
- cùng display fields
- cùng style chữ ký

Điều này đúng với nghiệp vụ: người ký thường ký một lần nhưng xuất hiện ở nhiều vị trí trong cùng tài liệu.

---

## 4. Kiến trúc giải pháp

Giải pháp chia 2 phần:

- FE quản lý flow, modal setup, field placement, trạng thái step.
- BE chịu trách nhiệm render preview appearance và quyết định chất lượng output.

### 4.1. FE chịu trách nhiệm

- quản lý danh sách vùng ký
- hiển thị placeholder khi field còn idle
- gom các field cùng kích thước để reuse preview
- gọi API preview sau khi setup xong
- điều khiển flow `setup -> prepare -> fill sample`

### 4.2. BE chịu trách nhiệm

- render ảnh preview signature
- bỏ viền ảnh preview
- xử lý font size theo `pt`
- xử lý wrap text
- căn giữa theo chiều cao cho block text
- tự quyết định render scale phù hợp

---

## 5. Thiết kế frontend

## 5.1. Flow màn hình

### Panel trái

Panel trái chỉ còn nhiệm vụ:

- thêm vùng ký
- chỉnh vị trí / kích thước vùng ký
- quản lý thao tác với field trên PDF

Panel trái không còn setup appearance chi tiết.

### Panel phải

Panel phải chỉ giữ:

- thông tin tổng quan phiên ký
- số lượng vùng ký
- 3 nút step chính

Panel phải không còn list từng vùng ký.

### Modal setup chữ ký

Modal setup là nơi cấu hình appearance chung:

- nguồn chữ ký:
  - vẽ tay
  - gõ chữ
  - tải ảnh
- nội dung hiển thị:
  - ký lúc
  - người ký
  - nhãn
  - chức vụ
  - email
  - số điện thoại
  - đơn vị
  - phòng ban
- bố cục:
  - ngang
  - dọc
- kích thước ảnh:
  - nhỏ
  - vừa
  - lớn
- cỡ chữ
- ngôn ngữ
- preview appearance

### 5.2. Placeholder idle

Khi field mới được tạo:

- FE sinh một placeholder image cục bộ.
- Placeholder có label theo thứ tự field.
- Trạng thái field được đánh dấu là chưa sẵn sàng preview thật.

Nhờ đó:

- field hiện rõ trên PDF
- user dễ phân biệt từng vùng
- chưa phụ thuộc BE render

### 5.3. Chỉ preview sau setup

FE đã đổi logic để:

- không sync preview ngay khi add field
- chỉ sync preview khi profile đã được apply
- bỏ qua các field có `previewStatus !== ready`

Kết quả:

- tránh request thừa
- đúng flow nghiệp vụ
- preview thật chỉ xuất hiện sau confirm setup

### 5.4. Reuse preview theo kích thước

Sau khi user xác nhận setup:

- FE group các field theo cặp `width x height`
- mỗi nhóm cùng kích thước chỉ gọi 1 API preview
- response preview được gán lại cho toàn bộ field cùng nhóm

Ý nghĩa:

- giảm số lượng request BE
- đồng nhất preview giữa các field cùng size
- tối ưu rõ rệt khi có 2-3 vùng ký giống nhau

---

## 6. Thiết kế backend render

### 6.1. Bỏ viền ảnh preview

Ảnh preview sinh ra từ renderer đã bỏ phần border/frame.

Lý do:

- border làm preview nhìn giống ảnh được đóng khung hơn là signature appearance
- khi đặt lên PDF dễ gây cảm giác giả lập UI thay vì nội dung ký thật

### 6.2. Font size theo `pt`

Font size hiện được hiểu theo đơn vị `pt` thay vì ratio nội suy từ chiều cao box.

Điều này giúp:

- gần hơn với cách hệ thống PDF thường biểu diễn text size
- dễ map với expectation của user/design
- tránh tình trạng cùng một cấu hình nhưng khác box height thì text scale khó đoán

### 6.3. Wrap text

BE đã bổ sung logic wrap text:

- tách dòng theo chiều rộng vùng text
- fit text hợp lệ trong box
- có ellipsis khi cần cho các nội dung khó co giãn

Điều này áp dụng cho các field metadata hiển thị trong appearance, tránh tràn dòng hoặc đè layout.

### 6.4. Căn giữa theo chiều cao

Block text trong appearance đã được căn giữa theo chiều cao vùng text.

Trước đây text bị lệch theo cảm quan vì chỉ đặt theo top flow. Hiện tại renderer tính tổng chiều cao block trước, sau đó đặt offset để text nằm cân hơn theo trục dọc.

### 6.5. Typed signature fit

Với chữ ký dạng text:

- renderer dùng chiến lược fit + ellipsis phù hợp với bounding box
- tránh chữ ký text bị tràn ngang không kiểm soát

---

## 7. Quyền quyết định chất lượng ảnh thuộc backend

Đây là quyết định quan trọng đã chốt:

- FE không tự quyết định PPI/render scale cuối cùng.
- FE chỉ yêu cầu format preview.
- BE tự resolve render scale theo chính sách hệ thống.

### 7.1. Vì sao không để FE quyết định

Nếu FE gửi scale cứng:

- khó đồng bộ giữa các client
- dễ tạo coupling giữa UI và renderer
- khó kiểm soát chất lượng/caching ở server

### 7.2. Cách xử lý hiện tại

FE:

- chỉ gửi `render.format = png`
- không ép `scale` cụ thể

BE:

- normalize render request trước khi cache/render
- tự áp dụng default scale hợp lệ
- đảm bảo cache key và output đồng nhất theo chính sách BE

### 7.3. Lợi ích

- chất lượng preview được nâng mà không cần FE can thiệp
- policy chất lượng tập trung ở 1 nơi
- thuận lợi nếu sau này muốn thay đổi default scale hoặc min scale

---

## 8. Trạng thái và điều kiện của từng bước

### Bước 1 - Xác nhận ký

Điều kiện:

- đã có ít nhất một vùng ký

Hành động:

- mở modal setup
- user cấu hình appearance
- apply profile cho tất cả field
- fetch preview thật

Kết quả:

- `isSetupApplied = true`
- các field chuyển từ placeholder sang preview thật

### Bước 2 - Prepare File

Điều kiện:

- setup appearance đã được apply

Hành động:

- gọi API prepare file

Ý nghĩa:

- giữ prepare là bước riêng đúng quy trình ký

### Bước 3 - Fill Sample Signature

Điều kiện:

- file đã prepare

Hành động:

- chạy bước ký thử / đổ sample signature vào tài liệu

---

## 9. Các file chính đã tham gia thay đổi

### Frontend

- `/Users/shizaki/Works/Shizaki/pdf-signature-control/FE-control/apps/demo-react/src/app/app.tsx`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/FE-control/apps/demo-react/src/app/components/LeftPanel.tsx`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/FE-control/apps/demo-react/src/app/components/RightPanel.tsx`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/FE-control/apps/demo-react/src/app/components/SignatureModal.tsx`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/FE-control/apps/demo-react/src/app/sample-api.ts`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/FE-control/apps/demo-react/src/styles.css`

### Backend

- `/Users/shizaki/Works/Shizaki/pdf-signature-control/BE-control/src/SignatureControl.Renderer.Grpc/Services/SignatureAppearanceRenderer.cs`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/BE-control/src/SignatureControl.Renderer.Grpc/Services/SignatureAppearanceGrpcService.cs`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/BE-control/src/SignatureControl.Renderer.Grpc/Options/RendererOptions.cs`
- `/Users/shizaki/Works/Shizaki/pdf-signature-control/BE-control/src/SignatureControl.Contracts/SignatureContracts.cs`

### Repo

- `/Users/shizaki/Works/Shizaki/pdf-signature-control/.gitignore`

---

## 10. Kiểm thử đã thực hiện

Đã verify mức cơ bản:

- FE TypeScript compile pass
- BE project build pass

Các kiểm thử nên tiếp tục bổ sung:

- nhiều vùng ký cùng size
- nhiều vùng ký khác size
- typed signature dài
- metadata dài để kiểm tra wrap
- zoom lớn trên PDF để đánh giá preview
- prepare/fill sample sau khi apply setup

---

## 11. Rủi ro và hướng mở rộng

### Rủi ro hiện tại

- Preview là raster image nên khi zoom rất lớn vẫn phụ thuộc quality policy của BE.
- Nếu cần chất lượng cao hơn nữa, cần tinh chỉnh render scale hoặc chiến lược output từ backend.
- Shared appearance hiện phù hợp với đa số case một người ký nhiều vùng, nhưng nếu tương lai cần mỗi vùng một layout riêng thì phải mở rộng model.

### Hướng mở rộng

- thêm preset appearance
- cache preview theo profile hash + size
- hỗ trợ vector preview nếu pipeline PDF cho phép
- đồng bộ config appearance giữa session và template

---

## 12. Kết luận

Giải pháp hiện tại đã chốt được các điểm quan trọng:

- flow đúng nghiệp vụ: thêm vùng ký trước, setup sau
- chỉ dùng một appearance chung cho nhiều vùng ký
- setup dạng modal theo step
- giữ đủ 3 bước: setup, prepare, fill sample
- chỉ generate preview thật sau khi setup
- preview được reuse cho các vùng cùng kích thước
- font size theo `pt`
- có wrap text và căn giữa chiều cao
- chất lượng render do backend quyết định, không do FE ép

Đây là nền tảng phù hợp để tiếp tục hoàn thiện trải nghiệm ký nhiều vùng trên PDF mà không làm flow bị rối hoặc coupling sai giữa FE và BE.
