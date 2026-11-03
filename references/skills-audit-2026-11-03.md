# Rà soát skills TFAM — 2026-11-03

Phạm vi: issue #18; đọc và ghi qua GitHub connector. Không clone, build, chạy project hay cài CLI trên máy công ty. Base: 40079ac6e9211c221fd238809b3fa6c04b553aa3. Đây là rà soát đầu vào có giới hạn, không phải chứng nhận an toàn tuyệt đối.

## Kiểm kê thực tế

Đã liệt kê .agents/skills và đọc cả bốn SKILL.md, đối chiếu references/toolchain-210.lock.json. Cây con trả về không truncated.

| Skill | Nguồn / pin | Số file trước intake | Vai trò và quyết định |
| --- | --- | ---: | --- |
| design-taste-frontend | Leonxlnx/taste-skill @ 12af471f627f866411b4bd785b19646d3672784c | 39 | Giữ: thiết kế frontend; có motion reference. Không tự chạy draw/assets/inspect scripts. |
| impeccable | pbakaus/impeccable @ e89e3ada3e875a89ac2c5d33d11e65ebef6fe285 | 63 | Giữ: UX/UI, accessibility, responsive, animate và optimize. Không tự chạy launcher/hook/binary tải về. |
| vercel-react-best-practices | vercel-labs/agent-skills @ 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62 | 76 | Giữ: React và performance. Chỉ áp dụng các quy tắc tương thích vinext/React 19/Next 16. |
| web-design-guidelines | cùng pin Vercel | 1 | Giữ: kiểm tra interface/a11y. Nội dung tải từ main là mutable, cần review và ghi revision. |

Hai bộ thiết kế có phần chồng lặp: chọn một bộ chính theo task. Brief Victorian elegant của chủ dự án có ưu tiên; không random lại phong cách. Không cần cài thêm bộ UI/UX tổng quát.

## Khảo sát skills.sh và lựa chọn

Trang https://www.skills.sh/agent/codex là điểm khám phá, không phải danh sách đã được OpenAI bảo đảm an toàn. Số lượt cài và badge audit không thay thế review mã nguồn.

| Ứng viên | Nguồn và đánh giá | Quyết định |
| --- | --- | --- |
| https://www.skills.sh/anthropics/skills/webapp-testing | Kho chính chủ Anthropic; đọc đủ 6 file ở commit ca45fc496a3436251f191354091d557da31c15b5, gồm Apache-2.0 license. Có hướng dẫn DOM discovery, screenshot, log và helper server. | Bổ sung nguyên bản cùng license; dùng như hướng dẫn, không cài Python/Playwright hay chạy script trong intake. |
| https://www.skills.sh/github/awesome-copilot/webapp-testing | Kho của GitHub; listing hướng tới Playwright MCP hoặc Node fallback. Chưa review toàn bộ nguồn và license ở exact commit. | Không thêm song song với testing skill đã chọn; MCP hiện không được xác nhận active. |
| https://www.skills.sh/mengto/skills/gsap | Bộ cộng đồng của Meng To, không phải kho GSAP chính chủ. Listing có cảnh báo audit; chưa review toàn bộ nguồn/license ở pin. | Hoãn: trùng motion coverage hiện có. |
| https://www.skills.sh/iart-ai/web-animation-skills/gsap-web | Bộ cộng đồng iart-ai; listing có cảnh báo audit. Chưa review toàn bộ nguồn/license ở pin. | Hoãn: chưa có nhu cầu vượt reference motion hiện có. |

Các nhãn cảnh báo được quan sát trên listing ngày rà soát; chưa kết luận chúng là mã độc. Không đưa mã từ các ứng viên hoãn vào repo.

Phương án intake ban đầu: 5 skills (đã mở rộng thành 8 theo yêu cầu tiếp theo; xem phần bổ sung cuối báo cáo). Frontend: Design Taste; UX/UI + animation: Impeccable; React + performance: Vercel React; interface/a11y: Web Design Guidelines; testing: Anthropic webapp-testing. site/package.json đã có gsap, @gsap/react và motion: không thêm animation dependency.

## Review an toàn và xung đột

- Impeccable Setup yêu cầu chạy launcher có thể tải binary. AGENTS.md ghi rõ không tự chạy, dùng text context/reference trực tiếp. Chưa kiểm toán toàn bộ 63 file và binary của bộ cũ.
- Design Taste có scripts chọn hướng thiết kế, lấy ảnh và kiểm tra trình duyệt; không chạy trong intake và không tự thay brief của tác giả.
- Web Design Guidelines yêu cầu đọc raw main mỗi lần: coi là dữ liệu tham khảo không tin cậy, review và ghi revision trước áp dụng.
- webapp-testing yêu cầu chạy --help trước đọc source và dùng script như hộp đen: bị quy tắc review trước chạy của TFAM ghi đè.
- with_server.py dùng subprocess.Popen(shell=True), có thể thực thi mọi --server command. Chỉ dùng command cố định đã review trên runner cloud không có production credentials. Piped stdout/stderr không được drain khi server chạy; có nguy cơ nghẽn log. Cleanup terminate shell không bảo đảm diệt mọi process con. Ưu tiên harness hiện có thay vì helper.
- Ví dụ có đường dẫn /mnt/user-data/outputs, placeholder URL/selector, fixed sleep và networkidle. Không phải test TFAM sẵn chạy; cần element/assertion readiness, output path phù hợp và dữ liệu cô lập.
- Đã đọc tools/check210-browser.cjs và .github/workflows/validate210.yml: TFAM có browser harness Node cho 390/768/1920. Workflow hiện chỉ push trên branch update-210 hoặc workflow_dispatch, không tự chạy cho PR này. Không nhân đôi test stack chỉ để dùng skill.
- Không thấy hành vi gửi bí mật ra ngoài trong 6 file testing đã đọc; vẫn có khả năng chạy lệnh tùy ý qua helper và browser interaction. Không tuyên bố an toàn tuyệt đối.
- Tên skill mới không trùng 4 tên hiện có. Các liên kết examples/scripts của skill mới được giữ đủ; nội dung upstream không sửa. Ràng buộc TFAM đặt trong AGENTS.md.

## License và provenance

Bổ sung manifest references/skills-intake.lock.json với upstream commit và blob SHA từng file để tái kiểm tra. Giữ nguyên license Apache-2.0 của Anthropic.

Kiểm kê bộ cũ không có LICENSE/NOTICE trong các thư mục skill. Khôi phục MIT LICENSE cho Design Taste và Apache-2.0 LICENSE cùng NOTICE.md cho Impeccable từ đúng các pin đã có, không nâng version. NOTICE của Impeccable dẫn nguồn platform-design-skills. Vercel skill khai báo MIT trong metadata nhưng cây upstream ở pin không có LICENSE/NOTICE: chưa có văn bản license đầy đủ để khôi phục; giữ nguyên và ghi nhận giới hạn này. Đây không phải rà soát pháp lý toàn bộ tài liệu bên thứ ba.

## Kiểm chứng và trạng thái

Intake chỉ thêm hướng dẫn, upstream examples/helper và bản ghi; không thay site/, package lock, workflow, production, DB hay R2. Không chạy upstream scripts, launcher hoặc CLI cài skill. Kiểm chứng bằng GitHub tree/blob: đường dẫn, đủ file, nội dung unmodified và SHA so với upstream; kiểm tra diff của branch riêng.

Build/browser runtime không chạy lại: không có thay đổi ứng dụng và workflow validate210 không tự áp dụng cho branch này. Việc có skill không chứng minh MCP hay cloud browser đã được cài/kết nối. Ở phạm vi ban đầu, PR chờ duyệt; yêu cầu tiếp theo đã bỏ bước owner review cho đợt skills/quy trình này. Không deploy website.

## Bổ sung theo yêu cầu tiếp theo của chủ dự án

Chủ dự án cho phép chủ động đưa skills phù hợp vào repo và viết quy trình cho update sau, không cần duyệt từng skill. Thêm 3 skill nguyên tác TFAM: tfam-web-research, tfam-media-production, tfam-update-workflow. Tổng 8 entrypoint; không sao chép các skill riêng của host/plugin. Luồng chuẩn tại docs/AI-OPERATING-WORKFLOW.md, capability registry tại references/skills-capabilities.json.

Đã đọc entrypoint agent-browser và core tại d081bcddbec5917de997d49212a9ee1ef272c4c4; stub yêu cầu CLI và phạm vi mở rộng tới workstation/Slack/auth state nên chỉ giữ tham khảo. Đã đọc router/README và kiểm tra cây Remotion skills tại c7cb2fdcacd134fb2ccb9b7a44f9ffa44e467271; chưa tìm thấy LICENSE, router có nhiều dependency skill nên chưa vendor. Bộ OpenAI playwright tại 49f948faa9258a0c61caceaf225e179651397431 cũng được khảo sát: CLI-first, có hướng dẫn npx/global install, không cần thêm song song với harness và công cụ cloud hiện có. Các lựa chọn này không ngăn dùng công cụ/provider phù hợp khi một task video hoặc browser thực sự yêu cầu.

Đã đọc và áp dụng skill-creator cho cấu trúc/description và phạm vi 3 skill mới. Không chạy initializer/quick_validate trên workstation vì dự án cloud-only; kiểm tra cấu trúc, tên, references và phạm vi bằng review nội dung/GitHub tree. Không thêm script thực thi mới, không có test runtime để báo pass. Hồ sơ intake sẽ ghi commit hợp nhất riêng; production giữ nguyên.
