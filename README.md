# TFAM Platform

Kho quản lý chung của Through Frost and Myth. Source, build và phát hành làm trên cloud.

## Hiện tại
- **Site live: version210** — https://throughfrostandmyth.baonguyenduong254.chatgpt.site
- Source Sites: `7ebfd779b0445b35ff5b527c8d0b1aed6e0a8bab`; [bản ghi phát hành](ops/releases/210-source.json).
- [PR15](https://github.com/baonguyenduong254-cmd/tfam-platform/pull/15): trang chủ cinematic và chọn28 faction/5 nhóm, âm nhạc gọn, cờ/xích/khóa mới.
- Build, TypeScript, domain checks và Chromium390/768/1920 đều qua trên GitHub Actions; đã kiểm tra điều hướng/nhạc/Castilian trên site thật.
- R2 tfam-assets: 2.269 ảnh theo catalogue +7 nhạc +3 folder markers. Đã xóa đúng72 chân dung sơn dầu cũ; giữ anime Castilian và ảnh tác giả tùy chỉnh.
- Ảnh UI mới210 được đóng gói cùng site; thư viện media lớn và soundtrack tiếp tục từ R2.
- Ảnh đại sảnh mới có native1672×941; chưa đạt UHD gốc. Theo dõi trong issue14.

## Quy trình
1. Đọc [AGENTS.md](AGENTS.md), [ops/status.json](ops/status.json) và [hướng dẫn210](docs/START-HERE-210.md).
2. Kiểm tra Sites hiện tại, tạo nhánh GitHub, sửa và kiểm tra trên cloud.
3. Tạo PR; sau khi qua kiểm tra, chuyển đúng site/ subtree sang source Sites.
4. Native Sites save/deploy phát hành version; ghi lại commit, deployment ID và nghiệm thu.

Đã có đường phát hành thủ công trên cloud với token nguồn ngắn hạn được mã hóa theo từng lần chạy. Merge GitHub không tự xuất bản. Không lưu token plaintext trong repo hoặc Actions Secrets cho lần210.

## Dữ liệu
- GitHub: code, catalogue, hướng dẫn, quyết định, tests và lịch sử.
- Sites: build/hosting/runtime.
- D1 DB: nội dung live và tài khoản/tiến độ/tương tác; không ghi đè bằng seed khi deploy.
- R2: media hiện có; xem [báo cáo retirement72 ảnh](maintenance/portrait-retirement-210.json).

## Tài liệu
- [Kiến trúc](docs/ARCHITECTURE.md) · [Luồng dữ liệu](docs/DATA-FLOWS.md) · [Quy trình](docs/WORKFLOW.md)
- [Release210](docs/RELEASE-210.md) · [Sổ kết nối](ops/connections.json)
- [Nguồn nhập209](ops/imported-v209.json) là baseline lịch sử, không phải phiên bản live.
- [Thư viện AI](references/README.md) · [Theo dõi phần cần dọn](maintenance/retirement-register.json)

## Luồng vận hành AI
Các update sau bắt đầu với [hướng dẫn vận hành AI](docs/AI-OPERATING-WORKFLOW.md), AGENTS.md và issue hiện tại. Có 8 project skills cho thiết kế, React/performance, testing, nghiên cứu web, media và điều phối; xem [danh mục capability](references/skills-capabilities.json). Skill không tự cài hoặc kết nối dịch vụ. Mọi thao tác dự án vẫn trên cloud.
