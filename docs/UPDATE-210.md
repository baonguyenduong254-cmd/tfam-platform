# Update 210 — nền tảng và dọn dữ liệu

Baseline: source Sites 209 trong site/. Không đổi production trong bước chuẩn bị.

1. Nhập bốn skill theo commit khóa, giữ license; không thực thi launcher tải ngoài. Quy tắc TFAM/Victorian của chủ dự án ưu tiên hơn style mặc định của skill.
2. Chạy kiểm kê source trên GitHub Actions: file trùng, mapping R2 không thấy tham chiếu tĩnh, build metadata sinh tự động.
3. Xóa build metadata chỉ khi không có tham chiếu tên file. Asset trùng và mapping không có tham chiếu chỉ là candidate; đối chiếu D1 và bucket trước khi xóa.
4. MCP Playwright và Chrome DevTools: chuẩn bị nguồn upstream đã khóa; chưa kích hoạt trong host. Không đóng gói vào production. Dùng browser đang kết nối cho QA hiện tại.
5. Motion/R3F/Drei đã có trong v209. React Bits, Lenis, dotLottie, Mastra và memory frameworks chỉ áp dụng khi có tiêu chí sử dụng, license và kiểm tra tương thích riêng; không cài hàng loạt.
6. Nghiệm thu 210: test unlock và link trực tiếp; đọc truyện; bản đồ; desktop/mobile/fullscreen; reduced-motion; console/network; kiểm tra production không mất content/progress.

R2: bucket tfam-assets đã được nhìn thấy trong Cloudflare. Cần xuất danh sách đầy đủ, đối chiếu mapping và tham chiếu live. Không suy ra không dùng chỉ từ trang đang mở.
