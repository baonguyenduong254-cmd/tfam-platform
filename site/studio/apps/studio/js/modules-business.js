import { api, esc, toast } from "./api.js";

// 09. ASSET LIBRARY (Cloudflare R2 Metadata Registry)
export async function renderAssets(ws, ctx) {
  const { assets, orphan_count } = await api("/api/assets");

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>09 · Asset Library (Cloudflare R2)</h2>
        <p>Quản lý artwork, bìa, bản đồ, metadata, quyền xuất bản và phát hiện asset mồ côi. Không bao giờ tự động xóa object trên R2.</p>
      </div>
      <button class="btn primary" id="add-asset-btn">+ Đăng ký R2 Asset</button>
    </div>

    <div class="alert info" style="margin-bottom:14px">
      Tổng số tài nguyên: <strong>${assets.length}</strong> · Asset chưa gắn tham chiếu (Orphan): <strong>${orphan_count}</strong>. Thông tin xác thực R2 chỉ nằm ở phía Backend.
    </div>

    <div class="card">
      <table class="table">
        <thead><tr><th>Tài nguyên</th><th>R2 Key</th><th>Nhóm</th><th>Hiển thị / Quyền</th><th>Tham chiếu</th></tr></thead>
        <tbody>
          ${assets.map((a) => {
            const refs = JSON.parse(a.usage_refs_json || "[]");
            return `<tr>
              <td><strong>${esc(a.title)}</strong><div class="muted" style="font-size:11px">${esc(a.mime_type)} · ${Math.round((a.size_bytes || 0) / 1024)} KB</div></td>
              <td><code>${esc(a.r2_key)}</code></td>
              <td><span class="pill neutral">${esc(a.category)}</span></td>
              <td><span class="pill ${a.visibility}">${esc(a.visibility)}</span> <span class="pill ${a.publish_permission === "approved" ? "canon" : "draft"}">${esc(a.publish_permission)}</span></td>
              <td>${refs.length ? refs.map((r) => `<code>${esc(r)}</code>`).join(", ") : `<span class="pill warning">Orphan (Giữ an toàn)</span>`}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  ws.querySelector("#add-asset-btn").onclick = async () => {
    const title = prompt("Tên tài nguyên / artwork:");
    if (!title) return;
    const r2_key = prompt("Đường dẫn R2 Key (vd: tfam/art/evelyne.webp):") || "";
    await api("/api/assets", { method: "POST", body: { title, r2_key, category: "character_art", visibility: "private" } });
    toast("Đã đăng ký metadata R2 Asset");
    ctx.navigate("assets");
  };

  ctx.setContextPanel("R2 Policy", `
    <div class="ctx-card">
      <h4>An toàn Cloudflare R2</h4>
      <div style="font-size:12px" class="muted">
        • Không đưa R2 credentials xuống trình duyệt.<br/>
        • Không tự động xóa R2 objects khi phát hiện Orphan.
      </div>
    </div>
  `);
}

// 10. PUBLISHING CENTER (Draft -> Review -> Preview -> Approval -> Published + Rollback)
export async function renderPublishing(ws, ctx) {
  const [queue, pubCatalog] = await Promise.all([api("/api/publishing/queue"), api("/api/public/catalog")]);

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>10 · Publishing Center (One-Click Author Approval)</h2>
        <p>Quy trình: Draft → Review → Preview → Author Approval → Published Snapshot. Public Site chỉ đọc các bản snapshot đã được duyệt.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card stack-sm">
        <h3>Hàng đợi xuất bản chương</h3>
        <table class="table">
          <thead><tr><th>Chương</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            ${queue.chapters.map((c) => `
              <tr>
                <td><strong>${esc(c.code)}</strong> · ${esc(c.title)}<div class="muted" style="font-size:11px">Hiển thị: ${esc(c.visibility)} · Gate: Ch. ${c.spoiler_gate_chapter || "Không"}</div></td>
                <td><span class="pill ${c.status}">${esc(c.status)}</span></td>
                <td class="row">
                  <button class="btn sm" data-trans="review" data-id="${c.id}">Review</button>
                  <button class="btn sm primary" data-pub="${c.id}" data-vis="public">Duyệt Public</button>
                  <button class="btn sm gold" data-pub="${c.id}" data-vis="paid">Duyệt Paid</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="card stack-sm">
        <h3>Public Site Live Catalog (${pubCatalog.count} mục đang hiển thị)</h3>
        <p class="muted" style="font-size:12px">Dữ liệu thực tế từ <code>GET /api/public/catalog</code> — hoàn toàn sạch private notes, draft và what-if.</p>
        ${pubCatalog.items.map((it) => `
          <div class="list-item">
            <div class="row-between"><strong>${esc(it.payload.title || it.payload.name)}</strong><span class="pill ${it.visibility}">${esc(it.visibility)} · v${it.version_number}</span></div>
            <div class="muted" style="font-size:11px">${esc(it.entity_type)} · Published ${esc(it.published_at)}</div>
          </div>`).join("")}

        <h3 style="margin-top:12px">Lịch sử Snapshots &amp; Rollback</h3>
        ${queue.snapshots.map((s) => `
          <div class="row-between" style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span>${esc(s.entity_type)}:${esc(s.entity_id)} · v${s.version_number} ${s.is_active ? "<strong style='color:#68d391'>(ACTIVE)</strong>" : ""}</span>
            ${!s.is_active ? `<button class="btn sm" data-rb="${s.id}">Rollback</button>` : ""}
          </div>`).join("")}
      </div>
    </div>
  `;

  ws.querySelectorAll("[data-trans]").forEach((btn) => {
    btn.onclick = async () => {
      await api("/api/publishing/transition", { method: "POST", body: { chapter_id: btn.dataset.id, status: btn.dataset.trans } });
      toast("Đã chuyển trạng thái chương");
      ctx.navigate("publishing");
    };
  });

  ws.querySelectorAll("[data-pub]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api("/api/publishing/approve", {
          method: "POST",
          body: { entity_type: "chapter", entity_id: btn.dataset.pub, visibility: btn.dataset.vis, release_notes: "Phê duyệt từ TFAM Studio" },
        });
        toast(`Đã xuất bản snapshot (${btn.dataset.vis}) lên Public API`);
        ctx.navigate("publishing");
      } catch (err) {
        toast(err.message);
      }
    };
  });

  ws.querySelectorAll("[data-rb]").forEach((btn) => {
    btn.onclick = async () => {
      await api(`/api/publishing/rollback/${btn.dataset.rb}`, { method: "POST" });
      toast("Đã khôi phục (rollback) phiên bản xuất bản trước");
      ctx.navigate("publishing");
    };
  });

  ctx.setContextPanel("Publishing", `
    <div class="ctx-card">
      <h4>Đầu nối Public Site</h4>
      <div style="font-size:12px" class="muted">
        Endpoint công khai:<br/>
        <code>GET /api/public/catalog</code><br/>
        <code>GET /api/public/chapters/:id</code><br/><br/>
        Tự động lọc <code>spoiler_gate_chapter</code> và kiểm tra quyền trả phí (402 Payment Required).
      </div>
    </div>
  `);
}

// 11. COMMERCE MANAGER (Sandbox Payment Abstraction)
export async function renderCommerce(ws, ctx) {
  const data = await api("/api/commerce/overview");

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>11 · Commerce Manager</h2>
        <p>Quản lý sản phẩm, gói đọc trả phí, quyền truy cập độc giả và kiểm thử Sandbox Checkout.</p>
      </div>
    </div>
    <div class="alert info" style="margin-bottom:14px">
      <strong>Chế độ thanh toán:</strong> ${esc(data.payment_provider.toUpperCase())} — ${esc(data.production_blocker)}
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Sản phẩm &amp; Gói truy cập (${data.products.length})</h3>
        <table class="table">
          <thead><tr><th>SKU / Tên</th><th>Giá</th><th>Kiểm thử</th></tr></thead>
          <tbody>
            ${data.products.map((p) => `
              <tr>
                <td><strong>${esc(p.title)}</strong><div class="muted" style="font-size:11px">${esc(p.sku)} · ${esc(p.product_type)}</div></td>
                <td>$${(p.price_cents / 100).toFixed(2)}</td>
                <td><button class="btn sm gold" data-chk="${p.id}">Sandbox Checkout</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="card stack-sm">
        <h3>Đơn hàng Sandbox (${data.orders.length}) &amp; Entitlements (${data.entitlements.length})</h3>
        ${data.orders.map((o) => `
          <div class="list-item">
            <div class="row-between"><strong>${esc(o.product_title)}</strong><span class="pill paid">${esc(o.status)}</span></div>
            <div class="muted" style="font-size:11px">${esc(o.user_email)} · $${(o.amount_cents / 100).toFixed(2)} (${esc(o.provider)})</div>
          </div>`).join("") || `<div class="muted">Chưa có đơn hàng kiểm thử nào.</div>`}
      </div>
    </div>
  `;

  ws.querySelectorAll("[data-chk]").forEach((btn) => {
    btn.onclick = async () => {
      await api("/api/commerce/sandbox-checkout", { method: "POST", body: { product_id: btn.dataset.chk } });
      toast("Đã tạo đơn hàng Sandbox & cấp quyền cho reader@tfam.studio");
      ctx.navigate("commerce");
    };
  });

  ctx.setContextPanel("Commerce", `<div class="ctx-card"><h4>An toàn thanh toán</h4><div class="muted" style="font-size:12px">Hệ thống không bao giờ giả lập giao dịch production đã thanh toán. Khi có khóa Stripe/Paddle, chỉ cần cấu hình biến môi trường.</div></div>`);
}

// 12. READER ANALYTICS
export async function renderAnalytics(ws, ctx) {
  const data = await api("/api/analytics");
  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>12 · Reader Analytics</h2>
        <p>Thống kê lượt đọc thực tế, tỷ lệ hoàn thành chương và phân bổ ngôn ngữ (Anh / Việt).</p>
      </div>
    </div>
    <div class="card">
      <h3>Hiệu suất đọc theo chương</h3>
      <table class="table">
        <thead><tr><th>Chương</th><th>Lượt đọc</th><th>Hoàn thành TB</th><th>Thời gian đọc TB</th></tr></thead>
        <tbody>
          ${data.chapters.map((c) => `
            <tr>
              <td><strong>${esc(c.code)}</strong> · ${esc(c.title)}</td>
              <td>${c.reads || 0}</td>
              <td>${c.avg_completion_pct || 0}%</td>
              <td>${Math.round((c.avg_duration_sec || 0) / 60)} phút</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
  ctx.setContextPanel("Languages", `<div class="ctx-card"><h4>Phân bổ ngôn ngữ</h4>${data.by_language.map((l) => `<div style="font-size:12px"><strong>${esc(l.language.toUpperCase())}</strong>: ${l.reads} lượt</div>`).join("")}</div>`);
}

// 13. SYSTEM & ADMINISTRATION
export async function renderAdmin(ws, ctx) {
  const data = await api("/api/admin/overview");
  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>13 · System &amp; Administration</h2>
        <p>Quản lý tài khoản RBAC (Owner / Editor / Reader), nhật ký kiểm toán và sao lưu toàn bộ cơ sở dữ liệu.</p>
      </div>
      <button class="btn primary" id="export-backup-btn">Tải bản sao lưu DB (.json)</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Tài khoản &amp; Phân quyền (${data.users.length})</h3>
        <table class="table">
          <thead><tr><th>Email</th><th>Tên hiển thị</th><th>Role</th></tr></thead>
          <tbody>
            ${data.users.map((u) => `<tr><td>${esc(u.email)}</td><td>${esc(u.display_name)}</td><td><span class="pill ${u.role === "owner" ? "canon" : "neutral"}">${esc(u.role)}</span></td></tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>Audit Log (${data.audit_logs.length} mục gần nhất)</h3>
        <div class="stack-sm" style="max-height:360px;overflow-y:auto">
          ${data.audit_logs.map((a) => `
            <div style="font-size:12px;border-bottom:1px solid var(--border);padding-bottom:6px">
              <strong>${esc(a.action)}</strong> · <code>${esc(a.entity_type)}:${esc(a.entity_id)}</code>
              <div class="muted" style="font-size:11px">${esc(a.actor_role)} · ${esc(a.created_at)}</div>
            </div>`).join("")}
        </div>
      </div>
    </div>
  `;

  ws.querySelector("#export-backup-btn").onclick = async () => {
    const dump = await api("/api/admin/backup");
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tfam-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast("Đã xuất bản sao lưu cơ sở dữ liệu");
  };

  ctx.setContextPanel("System", `<div class="ctx-card"><h4>Bảo mật RBAC</h4><div class="muted" style="font-size:12px">Chỉ tài khoản <strong>Owner</strong> mới có quyền phê duyệt xuất bản, rollback snapshot, quản lý người dùng và xuất backup DB.</div></div>`);
}
