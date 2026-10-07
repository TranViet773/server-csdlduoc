Bạn là Antigravity Gemini Pro AI. Nhiệm vụ: Tạo server sandbox giả lập cho hệ thống CSDL Dược Quốc Gia (theo Quyết định 806).  
Mục tiêu: Test các API nhập/xuất dữ liệu khi chưa truy cập được sandbox chính thức.

Yêu cầu chi tiết:
1. API cần có:
   - Tạo phiếu nhập (POST /phieu-nhap)
   - Liên thông phiếu nhập (POST /phieu-nhap/lien-thong)
   - Sửa phiếu nhập (PUT /phieu-nhap/{id})
   - Xóa phiếu nhập (DELETE /phieu-nhap/{id})
   - Lấy danh sách thuốc (GET /thuoc)
   - Lấy danh sách đơn vị tính (GET /unit)
   - Các API liên quan khác theo thiết kế trong file PDF 806.

2. Trường dữ liệu & ràng buộc:
   - Dùng đúng cấu trúc, tên trường, kiểu dữ liệu, ràng buộc như trong Quyết định 806/PDF.
   - Ví dụ: mã thuốc, tên thuốc, hàm lượng, đơn vị, số lượng, ngày nhập, nhà cung cấp, mã phiếu, trạng thái, v.v.

3. Dữ liệu mock:
   - Tạo dữ liệu giả lập (mock) cho thuốc, đơn vị, phiếu nhập.
   - Dữ liệu mock phải được lưu trong file riêng (ví dụ: mockData.js hoặc mockData.json).
   - File xử lý API chỉ import dữ liệu mock, không hardcode chung, để dễ dàng thay đổi.

4. Response:
   - Các API trả về response đúng format như thiết kế trong PDF 806.
   - Bao gồm mã trạng thái, thông điệp, dữ liệu chi tiết.

5. Môi trường:
   - Server chạy ở chế độ sandbox, không kết nối thật đến CSDL Dược Quốc Gia.
   - Cho phép test CRUD phiếu nhập và lấy dữ liệu thuốc/đơn vị.

Output mong muốn:
- Cấu trúc project (ví dụ: ExpressJS hoặc FastAPI).
- File mockData riêng biệt.
- File routes/API riêng biệt.
- Các response mẫu theo đúng thiết kế PDF 806.
