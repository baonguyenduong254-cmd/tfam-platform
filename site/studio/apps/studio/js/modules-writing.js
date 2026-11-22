import { api, esc, toast, setSaveState } from "./api.js";

// 01. STUDIO DASHBOARD
export async function renderDashboard(ws, ctx) {
  const data = await api("/api/dashboard");
  const ch = data.chapters || {};
  const cn = data.canon || {};
  const ast = data.assets || {};

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>01 · Studio Dashboard</h2>
        <p>Tổng quan bản thảo, tiến độ các Arc, trạng thái Canon/Draft/What-if và hoạt động biên tập.</p>
      </div>
      <div class="row">
        <button class="btn primary" id="dash-open-editor">Mở Manuscript Editor</button>
        <button class="btn gold" id="dash-open-qa">Chạy Narrative QA</button>
      </div>
    </div>

    <div class="grid-4">
      <div class="stat-card">
        <div class="stat-label">Chương trong Studio</div>
        <div class="stat-value">${ch.total || 0}</div>
        <div class="stat-sub">${ch.published || 0} đã xuất bản · ${ch.awaiting_review || 0} chờ duyệt · ${ch.drafts || 0} nháp</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Hồ sơ Canon &amp; Nhân vật</div>
        <div class="stat-value">${(cn.total || 0) + (data.characters_count || 0)}</div>
        <div class="stat-sub">${data.characters_count || 0} nhân vật · ${cn.canon || 0} canon · ${cn.what_if || 0} what-if</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Cảnh báo QA &amp; Nhập liệu</div>
        <div class="stat-value">${data.qa_open_findings || 0} / ${data.import_pending || 0}</div>
        <div class="stat-sub">QA đang mở · Bản ghi Importer chờ duyệt</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">R2 Assets &amp; Doanh thu Sandbox</div>
        <div class="stat-value">${ast.total || 0} · $${((data.commerce?.total_cents || 0) / 100).toFixed(2)}</div>
        <div class="stat-sub">${ast.orphans || 0} asset chưa gắn tham chiếu</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:16px">
      <div class="card">
        <h3>Tiến độ các Volume / Arc (Through Frost and Myth)</h3>
        <table class="table">
          <thead><tr><th>Volume</th><th>Trạng thái</th><th>Hiển thị</th></tr></thead>
          <tbody>
            ${data.volumes.map((v) => `
              <tr>
                <td><strong>${esc(v.code)}</strong> · ${esc(v.title)}<div class="muted" style="font-size:12px">${esc(v.subtitle)}</div></td>
                <td><span class="pill ${v.status}">${esc(v.status)}</span></td>
                <td><span class="pill ${v.visibility}">${esc(v.visibility)}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>Nhật ký hoạt động gần nhất (Audit Trail)</h3>
        <div class="stack-sm">
          ${data.recent_activity.length ? data.recent_activity.map((a) => `
            <div class="list-item">
              <div class="row-between"><strong>${esc(a.action)}</strong><span class="pill neutral">${esc(a.entity_type)}</span></div>
              <div class="muted" style="font-size:11px">${esc(a.actor_role)} · ${esc(a.created_at)}</div>
            </div>`).join("") : `<div class="muted">Chưa có nhật ký nào.</div>`}
        </div>
      </div>
    </div>
  `;

  ws.querySelector("#dash-open-editor").onclick = () => ctx.navigate("manuscript");
  ws.querySelector("#dash-open-qa").onclick = () => ctx.navigate("qa");

  ctx.setContextPanel("Overview", `
    <div class="ctx-card">
      <h4>3 Tầng dữ liệu</h4>
      <div class="stack-sm">
        <div><span class="pill canon">Canon</span> Sự thật chính thức đã chốt</div>
        <div><span class="pill draft">Draft</span> Thay đổi chưa duyệt</div>
        <div><span class="pill what_if">What-if</span> Nhánh giả định tách biệt</div>
      </div>
    </div>
    <div class="ctx-card">
      <h4>Lối tắt nhanh</h4>
      <div class="stack-sm">
        <button class="btn sm full" id="ctx-go-import">14 · Mở TFAM Data Importer</button>
        <button class="btn sm full" id="ctx-go-pub">10 · Mở Publishing Center</button>
      </div>
    </div>
  `);
  document.getElementById("ctx-go-import").onclick = () => ctx.navigate("importer");
  document.getElementById("ctx-go-pub").onclick = () => ctx.navigate("publishing");
}

// 02. MANUSCRIPT EDITOR (Autosave, Version History, Restore, Contextual Inspector)
export async function renderManuscript(ws, ctx) {
  const [{ chapters }, { volumes }] = await Promise.all([api("/api/chapters"), api("/api/volumes")]);
  let activeId = ctx.state.selectedChapterId;
  if (!chapters.some((c) => c.id === activeId) && chapters.length) activeId = chapters[0].id;
  ctx.state.selectedChapterId = activeId;

  const active = chapters.find((c) => c.id === activeId);

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>02 · Manuscript Editor</h2>
        <p>Biên tập bản thảo dài, autosave, lịch sử phiên bản, khôi phục bản cũ và liên kết ngữ cảnh trực tiếp.</p>
      </div>
      <div class="row">
        <button class="btn primary" id="new-chapter-btn">+ Tạo chương mới</button>
        <button class="btn gold" id="run-qa-from-editor">Chạy Narrative QA</button>
      </div>
    </div>

    <div class="split-list">
      <div class="card stack-sm" style="max-height:74vh; overflow-y:auto">
        <div class="row-between"><strong>Danh sách chương (${chapters.length})</strong></div>
        ${chapters.map((c) => `
          <div class="list-item ${c.id === activeId ? "active" : ""}" data-chid="${c.id}">
            <div class="row-between">
              <strong>${esc(c.code)}</strong>
              <span class="pill ${c.status}">${esc(c.status)}</span>
            </div>
            <div style="font-size:12px">${esc(c.title)}</div>
            <div class="muted" style="font-size:11px">${c.word_count} từ · ${esc(c.visibility)} · ${esc(c.data_state)}</div>
          </div>`).join("")}
      </div>

      <div class="card stack">
        ${active ? `
          <div class="row-between">
            <input id="ed-title" type="text" value="${esc(active.title)}" style="font-size:16px;font-weight:600;max-width:65%" />
            <div class="row">
              <span class="pill ${active.status}">${esc(active.status)}</span>
              <span class="pill ${active.visibility}">${esc(active.visibility)}</span>
              <button class="btn primary sm" id="save-chapter-btn">Lưu phiên bản</button>
              <button class="btn sm" id="export-md-btn">Export .md</button>
            </div>
          </div>
          <textarea id="ed-content" class="manuscript-editor">${esc(active.content)}</textarea>
          <div class="grid-2">
            <label class="field">
              <span>Ghi chú riêng của tác giả (Private Author Notes — không bao giờ lộ ra Public Site)</span>
              <textarea id="ed-notes" rows="2">${esc(active.author_notes || "")}</textarea>
            </label>
            <div class="stack-sm">
              <label class="field">
                <span>Chế độ hiển thị</span>
                <select id="ed-visibility">
                  <option value="private" ${active.visibility === "private" ? "selected" : ""}>Private (Chỉ Studio)</option>
                  <option value="public" ${active.visibility === "public" ? "selected" : ""}>Public (Miễn phí sau khi duyệt)</option>
                  <option value="paid" ${active.visibility === "paid" ? "selected" : ""}>Paid (Cần quyền truy cập trả phí)</option>
                </select>
              </label>
              <div id="rev-list" class="muted" style="font-size:12px">Đang tải lịch sử phiên bản...</div>
            </div>
          </div>
        ` : `<div class="muted">Chưa có chương nào. Hãy tạo chương mới.</div>`}
      </div>
    </div>
  `;

  ws.querySelectorAll("[data-chid]").forEach((el) => {
    el.onclick = () => ctx.navigate("manuscript", { chapterId: el.dataset.chid });
  });

  ws.querySelector("#new-chapter-btn").onclick = async () => {
    const num = (chapters.reduce((m, c) => Math.max(m, c.chapter_number || 0), 218)) + 1;
    const res = await api("/api/chapters", {
      method: "POST",
      body: { volume_id: volumes[volumes.length - 1]?.id || "vol-6", chapter_number: num, title: `Chương ${num}: Bản Nháp Mới`, content: "" },
    });
    toast(`Đã tạo Chương ${num}`);
    ctx.navigate("manuscript", { chapterId: res.chapter.id });
  };

  if (!active) return;

  const saveChapter = async (createRev = true, summary = "Lưu thủ công") => {
    setSaveState("Đang lưu...", "warning");
    await api(`/api/chapters/${active.id}`, {
      method: "PUT",
      body: {
        title: document.getElementById("ed-title").value,
        content: document.getElementById("ed-content").value,
        author_notes: document.getElementById("ed-notes").value,
        visibility: document.getElementById("ed-visibility").value,
        create_revision: createRev,
        change_summary: summary,
      },
    });
    setSaveState("Đã lưu", "canon");
    if (createRev) {
      toast("Đã lưu bản thảo & tạo phiên bản mới");
      loadRevsAndContext();
    }
  };

  ws.querySelector("#save-chapter-btn").onclick = () => saveChapter(true, "Lưu phiên bản trong Studio");
  ws.querySelector("#run-qa-from-editor").onclick = () => ctx.navigate("qa", { chapterId: active.id });
  ws.querySelector("#export-md-btn").onclick = () => {
    const md = `# ${document.getElementById("ed-title").value}\n\n${document.getElementById("ed-content").value}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${active.code}.md`;
    a.click();
  };

  let autosaveTimer;
  document.getElementById("ed-content").oninput = () => {
    setSaveState("Chưa lưu...", "draft");
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveChapter(false, "Autosave"), 1800);
  };

  async function loadRevsAndContext() {
    const [{ revisions }, contextData] = await Promise.all([
      api(`/api/chapters/${active.id}/revisions`),
      api(`/api/chapters/${active.id}/context`),
    ]);

    const revEl = document.getElementById("rev-list");
    if (revEl) {
      revEl.innerHTML = `
        <strong>Lịch sử phiên bản (${revisions.length})</strong>
        <div class="stack-sm" style="margin-top:6px;max-height:110px;overflow-y:auto">
          ${revisions.map((r) => `
            <div class="row-between" style="font-size:12px">
              <span>v${r.version_number} · ${r.word_count} từ (${esc(r.change_summary)})</span>
              <button class="btn sm" data-restore="${r.id}">Phục hồi</button>
            </div>`).join("")}
        </div>`;
      revEl.querySelectorAll("[data-restore]").forEach((btn) => {
        btn.onclick = async () => {
          await api(`/api/chapters/${active.id}/restore/${btn.dataset.restore}`, { method: "POST" });
          toast("Đã phục hồi phiên bản bản thảo");
          ctx.navigate("manuscript", { chapterId: active.id });
        };
      });
    }

    // Contextual Right Inspector (as requested: appearing characters, scenes, continuity warnings, pending changes)
    ctx.setContextPanel(active.code, `
      <div class="ctx-card">
        <h4>Nhân vật xuất hiện (${contextData.appearing_characters.length})</h4>
        <div class="stack-sm">
          ${contextData.appearing_characters.length ? contextData.appearing_characters.map((c) => `
            <div style="font-size:12px">
              <strong>${esc(c.name)}</strong> <span class="muted">(${esc(c.faction)})</span>
              <div class="muted" style="font-size:11px">Voice: ${esc(c.voice_profile || "Chưa cập nhật")}</div>
            </div>`).join("") : `<span class="muted">Chưa phát hiện nhân vật liên kết.</span>`}
        </div>
      </div>
      <div class="ctx-card">
        <h4>Cảnh báo Continuity &amp; QA (${contextData.qa_alerts.length})</h4>
        <div class="stack-sm">
          ${contextData.qa_alerts.length ? contextData.qa_alerts.slice(0, 5).map((q) => `
            <div style="font-size:12px">
              <span class="pill ${q.severity}">${esc(q.category)}</span>
              <div style="margin-top:3px">${esc(q.explanation)}</div>
            </div>`).join("") : `<span class="muted">Chưa có cảnh báo đang mở. Bấm "Chạy Narrative QA" để kiểm tra.</span>`}
        </div>
      </div>
      <div class="ctx-card">
        <h4>Sự kiện Timeline liên kết (${contextData.linked_events.length})</h4>
        <div class="stack-sm">
          ${contextData.linked_events.length ? contextData.linked_events.map((e) => `<div style="font-size:12px"><strong>${esc(e.in_world_date)}</strong> · ${esc(e.title)}</div>`).join("") : `<span class="muted">Chưa gắn mốc timeline cho Chương ${active.chapter_number}.</span>`}
        </div>
      </div>
      <div class="ctx-card">
        <h4>Snapshots đã xuất bản (${contextData.published_snapshots.length})</h4>
        ${contextData.published_snapshots.length ? contextData.published_snapshots.map((s) => `<div style="font-size:12px">v${s.version_number} · <span class="pill ${s.visibility}">${esc(s.visibility)}</span> ${s.is_active ? "(Live)" : ""}</div>`).join("") : `<span class="muted">Chưa xuất bản lên Public Site.</span>`}
      </div>
    `);
  }

  await loadRevsAndContext();
}

// 08. NARRATIVE QA (Deterministic TFAM Rules + Before/After Diff)
export async function renderNarrativeQA(ws, ctx) {
  const { chapters } = await api("/api/chapters");
  const selectedId = ctx.state.selectedChapterId || chapters[0]?.id;

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>08 · Narrative QA (Chuyên biệt phong cách TFAM)</h2>
        <p>Kiểm tra từ cấm, phủ định khẳng định, motif báo cáo/hồ sơ, thoại ping-pong và vi phạm Character Knowledge State kèm chế độ Before/After.</p>
      </div>
      <div class="row">
        <select id="qa-chapter-select" style="width:280px">
          ${chapters.map((c) => `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${esc(c.code)} · ${esc(c.title)}</option>`).join("")}
        </select>
        <button class="btn primary" id="qa-run-btn">Chạy kiểm định QA</button>
      </div>
    </div>
    <div id="qa-output" class="stack"></div>
  `;

  async function runQA(chId) {
    ctx.state.selectedChapterId = chId;
    const res = await api(`/api/qa/run/${chId}`, { method: "POST" });
    const out = document.getElementById("qa-output");
    const findings = res.deterministic_findings || [];

    out.innerHTML = `
      <div class="alert info">
        <strong>Deterministic QA:</strong> Phát hiện <strong>${findings.length}</strong> vấn đề cần tác giả xem xét.
        <span class="muted"> · ${esc(res.ai_assisted_note)}</span>
      </div>

      <div class="card">
        <div class="row-between" style="margin-bottom:10px">
          <h3>So sánh Before / After (Bản gốc không tự động bị ghi đè)</h3>
          ${res.before_after_preview.has_auto_suggestions ? `<button class="btn gold sm" id="apply-qa-suggestion">Áp dụng bản gợi ý vào Draft</button>` : `<span class="muted">Không có thay thế từ vựng tự động.</span>`}
        </div>
        <div class="diff-grid">
          <div>
            <div class="stat-label" style="margin-bottom:4px">BEFORE (Bản thảo hiện tại)</div>
            <div class="diff-box">${res.before_after_preview.lines.map((l) => `<div class="${l.changed ? "diff-changed" : ""}">${esc(l.before)}</div>`).join("")}</div>
          </div>
          <div>
            <div class="stat-label" style="margin-bottom:4px">AFTER (Đề xuất sửa lọc từ cấm)</div>
            <div class="diff-box">${res.before_after_preview.lines.map((l) => `<div class="${l.changed ? "diff-changed" : ""}">${esc(l.after)}</div>`).join("")}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Danh sách phát hiện chi tiết (${findings.length})</h3>
        <table class="table">
          <thead><tr><th>Mức độ / Loại</th><th>Trích đoạn</th><th>Giải thích &amp; Dẫn chứng</th><th>Đề xuất</th><th>Xử lý</th></tr></thead>
          <tbody>
            ${findings.map((f) => `
              <tr>
                <td><span class="pill ${f.severity}">${esc(f.severity)}</span><div style="font-size:11px;margin-top:4px">${esc(f.category)}</div></td>
                <td style="max-width:220px;font-family:var(--font-serif)">"${esc(f.excerpt)}"</td>
                <td>${esc(f.explanation)}<div class="muted" style="font-size:11px;margin-top:3px">Dẫn chứng: ${esc(f.evidence_ref)}</div></td>
                <td style="font-size:12px">${esc(f.suggested_revision)}</td>
                <td>
                  <button class="btn sm" data-qa-act="accepted" data-fid="${f.id}">Duyệt</button>
                  <button class="btn ghost sm" data-qa-act="dismissed" data-fid="${f.id}">Bỏ qua</button>
                </td>
              </tr>`).join("") || `<tr><td colspan="5" class="muted">Không phát hiện lỗi tất định nào trong chương này.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const applyBtn = out.querySelector("#apply-qa-suggestion");
    if (applyBtn) {
      applyBtn.onclick = async () => {
        await api(`/api/chapters/${chId}`, {
          method: "PUT",
          body: { content: res.before_after_preview.suggested_text, change_summary: "Áp dụng gợi ý Narrative QA (đã duyệt bởi tác giả)" },
        });
        toast("Đã cập nhật bản thảo từ đề xuất QA (tạo phiên bản mới)");
        runQA(chId);
      };
    }

    out.querySelectorAll("[data-qa-act]").forEach((btn) => {
      btn.onclick = async () => {
        await api(`/api/qa/findings/${btn.dataset.fid}/status`, { method: "POST", body: { status: btn.dataset.qaAct } });
        toast(`Đã đánh dấu cảnh báo: ${btn.dataset.qaAct}`);
        btn.closest("tr").style.opacity = "0.45";
      };
    });

    ctx.setContextPanel("QA Summary", `
      <div class="ctx-card">
        <h4>Tiêu chí kiểm tra TFAM</h4>
        <div class="stack-sm" style="font-size:12px">
          <div>• Từ cấm &amp; thuật ngữ hiện đại</div>
          <div>• Phủ định để khẳng định</div>
          <div>• Motif giấy tờ (hồ sơ/báo cáo)</div>
          <div>• Thoại ping-pong thiếu nhịp hành động</div>
          <div>• Vi phạm Character Knowledge State</div>
        </div>
      </div>
    `);
  }

  ws.querySelector("#qa-run-btn").onclick = () => runQA(document.getElementById("qa-chapter-select").value);
  await runQA(selectedId);
}

// 14. TFAM DATA IMPORTER (DOCX, Markdown, JSON -> Staging Review Queue)
export async function renderImporter(ws, ctx) {
  const { staging } = await api("/api/importer/staging");

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>14 · TFAM Data Importer</h2>
        <p>Nhập bản thảo .docx, .md, .json (và sẵn sàng OAuth Google Docs khi cấp quyền). Mọi dữ liệu trích xuất đều vào hàng đợi kiểm duyệt, không bao giờ tự ghi đè Canon.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card stack-sm">
        <h3>Tải tệp (.docx / .md / .json) hoặc dán nội dung</h3>
        <input id="imp-file" type="file" accept=".docx,.md,.txt,.json" />
        <label class="field">
          <span>Hoặc dán trực tiếp nội dung Markdown / JSON để trích xuất chương &amp; nhân vật</span>
          <textarea id="imp-text" rows="8" placeholder="Chương 229: Bến Cảng Băng Giá&#10;&#10;Edward Spencer đứng trên mũi tàu cùng Evelyne Vesper..."></textarea>
        </label>
        <div class="row">
          <button class="btn primary" id="imp-run-btn">Phân tích &amp; Đưa vào hàng đợi duyệt</button>
          <span class="muted" style="font-size:12px">Google Docs OAuth: chưa cấu hình (an toàn)</span>
        </div>
      </div>

      <div class="card stack-sm">
        <h3>Hàng đợi kiểm duyệt (${staging.length})</h3>
        <div class="stack-sm" style="max-height:420px;overflow-y:auto">
          ${staging.map((s) => `
            <div class="list-item">
              <div class="row-between">
                <strong>${esc(s.extracted_title)}</strong>
                <span class="pill ${s.status === "pending_review" ? "draft" : s.status === "rejected" ? "error" : "canon"}">${esc(s.status)}</span>
              </div>
              <div class="muted" style="font-size:11px">${esc(s.source_filename)} · ${esc(s.source_format)} → ${esc(s.target_type)}</div>
              ${s.status === "pending_review" ? `
                <div class="row" style="margin-top:4px">
                  <button class="btn sm primary" data-dec="approved_draft" data-sid="${s.id}">Duyệt vào Draft</button>
                  <button class="btn sm gold" data-dec="approved_canon" data-sid="${s.id}">Duyệt thành Canon</button>
                  <button class="btn sm ghost" data-dec="rejected" data-sid="${s.id}">Từ chối</button>
                </div>` : ""}
            </div>`).join("") || `<div class="muted">Chưa có bản ghi nào trong hàng đợi nhập liệu.</div>`}
        </div>
      </div>
    </div>
  `;

  ws.querySelector("#imp-run-btn").onclick = async () => {
    const fileInput = document.getElementById("imp-file");
    const textVal = document.getElementById("imp-text").value.trim();
    let payload;
    if (fileInput.files && fileInput.files[0]) {
      const f = fileInput.files[0];
      const buf = await f.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const fmt = f.name.toLowerCase().endsWith(".docx") ? "docx" : f.name.toLowerCase().endsWith(".json") ? "json" : "markdown";
      payload = { filename: f.name, format: fmt, base64_content: b64 };
    } else if (textVal) {
      const fmt = textVal.startsWith("{") || textVal.startsWith("[") ? "json" : "markdown";
      payload = { filename: `pasted.${fmt === "json" ? "json" : "md"}`, format: fmt, text_content: textVal };
    } else {
      toast("Vui lòng chọn tệp hoặc dán nội dung trước.");
      return;
    }
    const res = await api("/api/importer/upload", { method: "POST", body: payload });
    toast(`Đã trích xuất ${res.staged_count} mục vào hàng đợi duyệt`);
    ctx.navigate("importer");
  };

  ws.querySelectorAll("[data-dec]").forEach((btn) => {
    btn.onclick = async () => {
      await api(`/api/importer/staging/${btn.dataset.sid}/decide`, { method: "POST", body: { decision: btn.dataset.dec } });
      toast(`Đã xử lý: ${btn.dataset.dec}`);
      ctx.navigate("importer");
    };
  });

  ctx.setContextPanel("Importer Guard", `
    <div class="ctx-card">
      <h4>Nguyên tắc bảo vệ Canon</h4>
      <div style="font-size:12px" class="muted">
        Mọi bản thảo .docx, Markdown hoặc JSON sau khi phân tích chỉ nằm trong bảng <code>import_staging</code>. Chỉ khi bạn bấm <strong>Duyệt vào Draft</strong> hoặc <strong>Duyệt thành Canon</strong>, dữ liệu mới được ghi vào hệ thống chính.
      </div>
    </div>
  `);
}
