# Phân luồng dữ liệu

## 1. Sửa giao diện hoặc tính năng
Issue → nhánh task → sửa code trên cloud → kiểm tra → PR → main → gói bản xuất bản → lưu version Sites → deploy → xác nhận URL và số version.
Không dùng việc sửa seed như cách cập nhật nội dung live.

## 2. Thêm hoặc sửa truyện
Tài liệu tác giả → bản nhập nháp có source/revision/language/chapter ID → xem lại nội dung → ghi qua API quản trị vào D1 → kiểm tra trang đọc.
Cập nhật nội dung và cập nhật code là hai luồng riêng. Nếu cần export, phải gắn revision; không dùng đồng bộ hai chiều tự động.

## 3. Thêm media
File gốc → tối ưu định dạng/kích thước → tải vào R2 bằng đường quản trị có quyền → kiểm tra URL → cập nhật manifest/record → kiểm tra trên site.
Quy ước mới đề xuất: tfam/media/{kind}/{entityId}/{revision}/{filename}.
Các loại: flags, portraits, maps, audio, video, interface.
Không đổi tên hoặc di chuyển object đang phục vụ chỉ để khớp quy ước mới. Thêm quy tắc cho file mới và di chuyển từng đợt có mapping.

## 4. File gốc và file public
File đã duyệt để hiển thị được phục vụ từ vùng public hiện có.
Bản thảo chưa phát hành, backup và tài sản cần hạn chế quyền phải ở vùng private; kiểm tra cấu hình trước khi tải.
Không đặt backup database hoặc dữ liệu tài khoản vào bucket public.

## 5. Tiến độ độc giả
Độc giả → sự kiện đọc hợp lệ → API máy chủ kiểm tra account/chapter/mốc hoàn thành → D1 reader_progress → kết quả unlock → UI.
Guest có thể giữ dữ liệu trình duyệt, nhưng phải nói rõ giới hạn đổi thiết bị.
Các unlock tương lai chỉ mở khi arc có nội dung hoàn chỉnh và người đọc đạt điều kiện. Không cho seed giả hoặc nút debug mở khóa production.

## 6. AI tham khảo repo ngoài
Yêu cầu cụ thể → chọn reference đúng mục đích → đọc docs/license và file liên quan → ghi exact revision và điều học được → áp dụng trong nhánh task → kiểm tra.
Không nhét toàn bộ repository ngoài vào thư mục source TFAM; không dùng chúng làm nguồn canon.

## 7. Asset manifest
Mỗi asset cần assetId, entityId, kind, objectKey hoặc đường dẫn tương đối, revision, MIME type, kích thước, checksum, nguồn/quyền sử dụng và trạng thái.
Schema khởi tạo nằm ở schemas/asset-record.schema.json.
Manifest mới chỉ là hợp đồng dữ liệu; chưa tự động di chuyển asset đang có.

## 8. Secrets
Credential dùng cho Sites, GitHub hay R2 chỉ đi qua secret store của hệ thống phù hợp.
Git giữ tên cấu hình và hướng dẫn; không giữ giá trị secret.
Giữ public media base URL tách biệt với credential ghi bucket.
