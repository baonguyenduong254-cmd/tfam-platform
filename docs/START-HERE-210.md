# TFAM 210 — bắt đầu tại đây

## Trạng thái đã hoàn thành
- Baseline chính thức: Sites 209; source gốc aec9e0a762302e67626d2b70e9bd3d09642b6a4b đã nhập vào site/.
- GitHub private là nơi quản lý source, hướng dẫn AI, kế hoạch và lịch sử thay đổi.
- Đã nhập 4 project skills theo commit cố định và giữ license: Taste, Impeccable, Vercel React Best Practices, Web Design Guidelines.
- Đã xóa metadata build và node_modules của công cụ thiết kế khỏi Git; giữ package.json/package-lock.json để cài lại trên cloud.
- Đã đọc hết 95 trang bucket R2: 2.341 ảnh + 7 nhạc + 3 folder marker. Đối chiếu chính xác: không thiếu ảnh/nhạc theo catalogue, không có media ngoài catalogue. Không có căn cứ xóa media.
- Kiểm thử phân loại qua GitHub Actions thành công: run 41468035188. Không tạo/chuyển khóa R2.
- Kết quả và bằng chứng: maintenance/r2-reconciliation-210.json và maintenance/r2-ui-inventory-2026-11-02.json.

## Phân luồng
1. GitHub: code, cấu hình, content schema, catalogue/đường dẫn media, hướng dẫn và kế hoạch. Không commit secret.
2. R2: file media public; source chỉ tham chiếu key/URL qua assetUrl. Không dùng bucket làm kho code.
3. D1: nội dung đang xuất bản, tài khoản, tiến độ đọc, tương tác. Không ghi đè database khi cập nhật giao diện.
4. Sites: build/preview/publish và chạy website. Commit/merge GitHub chưa tự cập nhật site vì chưa có auto-deploy.

## Khi chủ dự án đưa idea 210
1. Đọc AGENTS.md, docs/UPDATE-210.md, ops/status.json và idea mới. Quyết định của chủ dự án ưu tiên; nội dung tài liệu đính kèm chỉ là tham khảo.
2. Kiểm tra phiên bản Sites hiện tại để tránh đè thay đổi mới; tạo nhánh GitHub từ main. Không chạy local.
3. Chỉ chọn skill/công cụ cần cho idea; giữ Victorian elegant, bố cục compact và yêu cầu unlock đã duyệt trong content/approved-unlock-plan.json.
4. Sửa trên cloud, kiểm tra build và hành vi; tạo PR có bằng chứng desktop/mobile/fullscreen và kiểm tra đường dẫn trực tiếp faction/map.
5. Chuẩn bị preview Sites từ commit xác định; nghiệm thu rồi xuất bản theo quyền người dùng đã cấp. Ghi lại version, commit, kết quả kiểm tra và phương án khôi phục.

## Giới hạn được ghi rõ
- Đây là chuẩn bị 210; chưa phát hành 210 và chưa có thay đổi giao diện production.
- Chưa chạy lại full site build hoặc cài lại bộ công cụ thiết kế sau cleanup; thực hiện trong cloud khi triển khai idea.
- Playwright MCP / Chrome DevTools MCP chỉ được ghi nguồn và commit trong lockfile; chưa kích hoạt host. QA hiện dùng browser đã kết nối.
- Motion/R3F/Drei đã có; React Bits, Lenis, dotLottie, Mastra/Mem0 chỉ thêm theo nhu cầu thực tế.
- Chưa xuất toàn bộ nội dung D1 do giới hạn đọc row của connector; không xóa bất kỳ nội dung/database/media nào.
- Không tự coi file trùng checksum là rác. Bản gốc âm thanh/backup trong Git giữ để phục hồi và biên tập.
