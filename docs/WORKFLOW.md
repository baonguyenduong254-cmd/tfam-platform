# Workflow làm việc trên cloud

## Một nơi theo dõi chung
Mọi task có GitHub issue, tiêu chí hoàn thành và phạm vi file. Các chat mới phải đọc issue và trạng thái repo trước khi sửa.
Một task không được coi là xong chỉ vì đã viết code.

## Các trạng thái
1. Planned: đã ghi yêu cầu.
2. In progress: có nhánh và người/AI đang làm.
3. Ready for review: có PR và kết quả kiểm tra.
4. Ready for release: thay đổi đã hợp nhất, code đã kiểm tra.
5. Live: Sites đã báo deploy thành công, có số version và URL.
6. Blocked: ghi đúng việc cần chủ dự án hoặc quyền truy cập.

## Công cụ
- GitHub connector và github.dev cho sửa file trực tuyến.
- Môi trường cloud có thực thi, chẳng hạn Codespaces hoặc GitHub Actions, cho import/build/test. Chỉ khởi chạy khi có quyền và đã rõ phạm vi sử dụng.
- GitHub repository không tự chạy ứng dụng và không đồng nghĩa với một Codespace.
- Sites connector cho quản lý version và publish theo quy trình được hỗ trợ.
- Không mặc định GitHub Actions có sẵn API xuất bản Sites. Chỉ bật automation sau khi đã xác minh đường xuất bản và credential.

## Branch
main: nguồn đã hợp nhất.
task/<issue>-<topic>: tính năng hoặc fix.
maintenance/<topic>: dọn phần đã xác minh không dùng.
import/site-v209: lần nhập nguyên trạng baseline.

## Kiểm tra tối thiểu cho sửa UI/logic
- Các kiểm tra sẵn có của dự án; build phù hợp.
- Trang desktop thường, fullscreen và mobile.
- Khóa banner, link trực tiếp, archive, map và hồ sơ liên quan.
- Không mất nội dung live và không reset progress.
- Trạng thái media: URL còn chạy, quyền và revision phù hợp.
- Chỉ chạy lại kiểm tra rộng hơn khi thay đổi hoặc lỗi mới đòi hỏi.

## Release record
Mỗi release ghi GitHub commit, Sites source commit, Sites version, deployment ID, URL, content revision nếu liên quan, kết quả kiểm tra và rollback target.
Hai commit có thể khác nếu cần đồng bộ source sang kho Sites; phải ghi mapping và xác minh cùng cây source.

## Cập nhật cho chủ dự án
Nói rõ đã commit ở đâu, đã test gì, đã xuất bản chưa, đang vướng gì.
Nếu chưa live, dùng chữ chưa xuất bản.

## Hướng dẫn cho các update sau
Luồng AI hiện hành: [AI-OPERATING-WORKFLOW.md](AI-OPERATING-WORKFLOW.md). Đọc trước khi bắt đầu, chọn đúng skill theo loại việc và xác minh capability trong phiên. Chủ dự án cho phép tự chọn/bổ sung skills; quyền release vẫn theo từng task. Bản ghi chuẩn về live là ops/status.json và release record hiện hành, không phải tài liệu chuẩn bị 210 cũ.
