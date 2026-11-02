# Nhập nguyên trạng bản 209

## Baseline
Sites version: 209
Sites source commit: aec9e0a762302e67626d2b70e9bd3d09642b6a4b
Project ID: appgprj_6abf3718495481919a2cd6954776f57e
Saved version: appgprj_6abf3718495481919a2cd6954776f57e~appgver_0db7f913e1e0819181117799c20585d7

## Tác vụ cloud đã chuẩn bị
Workflow .github/workflows/import-sites-v209.yml chỉ chạy thủ công.
Nó đọc đúng commit trên kho source Sites, nhập cây file vào site/ trên nhánh import/site-v209, rồi ghi ops/imported-v209.json.
Cây site/ sau commit phải có tree SHA giống hệt cây source v209.
Workflow không build, chạy script dự án, thay DB, ghi R2 hoặc deploy site.
Dừng nếu đã có site/, nhánh import đã tồn tại, thiếu token, commit không khớp, hoặc có file vượt giới hạn GitHub.

## Quyền tạm thời
Workflow cần GitHub Actions secret TFAM_SITES_IMPORT_TOKEN chứa token truy cập source Sites ngắn hạn.
Chỉ đặt token ngay trước khi chạy; xóa secret sau lần nhập thành công hoặc thất bại.
Token do Sites cung cấp có thể có quyền ghi; tác vụ import chỉ sử dụng lệnh đọc. Không mô tả token đó là read-only.
Không ghi token vào repo, workflow input, issue, log hoặc URL.
Việc truyền credential từ Sites sang GitHub phải được chủ dự án chấp thuận trước bước đặt secret.

## Sau khi chạy
1. Xác nhận workflow thành công và kiểm tra ops/imported-v209.json.
2. So sánh tree SHA và commit source với baseline.
3. Mở PR từ import/site-v209; không gộp phần sửa giao diện hoặc cleanup vào lần nhập này.
4. Sau khi hợp nhất, ghi trạng thái source_import=verified trong ops/status.json.
5. Tiếp tục kiểm kê media, code cũ và đường xuất bản.
6. Giữ nguyên Site live cho tới một release riêng.
