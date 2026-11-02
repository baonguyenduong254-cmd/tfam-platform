# TFAM Platform

Kho quản lý chung cho Through Frost and Myth. Làm việc trên cloud; không phụ thuộc máy nhà hay máy công ty.

## Trạng thái hiện tại
- Repository riêng tư, đã kết nối với GitHub connector.
- Site production: https://throughfrostandmyth.baonguyenduong254.chatgpt.site
- Baseline đã xác minh: Sites version 209, source commit `aec9e0a762302e67626d2b70e9bd3d09642b6a4b`.
- Mã nguồn bản 209 đã được nhập nguyên trạng vào [site/](site/) và hợp nhất qua [PR #6](https://github.com/baonguyenduong254-cmd/tfam-platform/pull/6). [Bằng chứng nhập](ops/imported-v209.json) ghi tree SHA đã xác minh.
- Chưa có tự động xuất bản GitHub → Sites. Commit vào repo không có nghĩa là site đã được cập nhật.
- R2 hiện có tiếp tục phục vụ media: đã xác minh 2.341 mapping ảnh trong code và một file mẫu tải được. Chưa di chuyển, đổi URL hoặc xóa object.

## Bắt đầu công việc
1. Đọc [AGENTS.md](AGENTS.md), [trạng thái hệ thống](ops/status.json) và [quy trình](docs/WORKFLOW.md).
2. Kiểm tra Sites version mới nhất trước khi sửa; không mặc định bản 209 luôn là bản mới nhất.
3. Dùng issue và nhánh riêng. Bản nháp chưa xuất bản phải ghi rõ.
4. Hoàn tất bằng link commit/PR, kết quả kiểm tra và trạng thái triển khai.

## Công việc đang theo dõi
- [#2 — Kiểm kê R2 và asset manifest](https://github.com/baonguyenduong254-cmd/tfam-platform/issues/2)
- [#3 — Theo dõi và xóa phần source không còn dùng](https://github.com/baonguyenduong254-cmd/tfam-platform/issues/3)
- [#4 — Đường phát hành GitHub → Sites](https://github.com/baonguyenduong254-cmd/tfam-platform/issues/4)
- [#5 — Các thiếu sót của v209](https://github.com/baonguyenduong254-cmd/tfam-platform/issues/5)

## Tài liệu
- [Kiến trúc và nguồn dữ liệu chuẩn](docs/ARCHITECTURE.md)
- [Luồng dữ liệu](docs/DATA-FLOWS.md)
- [Quy trình phát triển trên cloud](docs/WORKFLOW.md)
- [Nhập bản 209](docs/SOURCE-IMPORT.md)
- [Sổ kết nối](ops/connections.json)
- [Thư viện tham khảo cho AI](references/README.md)
- [Quy tắc nội dung và unlock đã chốt trong chat](content/approved-unlock-plan.json)
- [Theo dõi phần cần dọn](maintenance/retirement-register.json)
