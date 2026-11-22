import { api, esc, toast } from "./api.js";

// 03. CHARACTER STUDIO
export async function renderCharacters(ws, ctx) {
  const { characters, relationships } = await api("/api/characters");
  let activeId = ctx.state.selectedCharacterId;
  if (!characters.some((c) => c.id === activeId) && characters.length) activeId = characters[0].id;
  ctx.state.selectedCharacterId = activeId;
  const active = characters.find((c) => c.id === activeId);

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>03 · Character Studio</h2>
        <p>Hồ sơ nhân vật, Character Voice, Vestigium, quan hệ, ghi chú riêng tác giả và trường hiển thị Public Site.</p>
      </div>
      <button class="btn primary" id="add-char-btn">+ Thêm nhân vật</button>
    </div>

    <div class="split-list">
      <div class="card stack-sm" style="max-height:74vh;overflow-y:auto">
        ${characters.map((c) => `
          <div class="list-item ${c.id === activeId ? "active" : ""}" data-cid="${c.id}">
            <div class="row-between"><strong>${esc(c.name)}</strong><span class="pill ${c.data_state}">${esc(c.data_state)}</span></div>
            <div class="muted" style="font-size:12px">${esc(c.epithet || c.rank_title)} · ${esc(c.faction)}</div>
          </div>`).join("")}
      </div>

      ${active ? `
        <div class="card stack">
          <div class="row-between">
            <div>
              <h3 style="margin:0">${esc(active.name)} <span class="muted">(${esc(active.epithet)})</span></h3>
              <div class="muted" style="font-size:12px">${esc(active.faction)} · ${esc(active.rank_title)} · Xuất hiện đầu: Ch. ${active.first_appearance_chapter || "-"}</div>
            </div>
            <div class="row">
              <span class="pill ${active.visibility}">${esc(active.visibility)}</span>
              <button class="btn primary sm" id="save-char-btn">Lưu hồ sơ</button>
            </div>
          </div>
          <div class="grid-2">
            <label class="field"><span>Tiểu sử (Biography)</span><textarea id="ch-bio" rows="3">${esc(active.biography)}</textarea></label>
            <label class="field"><span>Character Voice &amp; Quy ước thoại</span><textarea id="ch-voice" rows="3">${esc(active.voice_profile)}\n${esc(active.speech_conventions)}</textarea></label>
            <label class="field"><span>Năng lực &amp; Vestigium</span><textarea id="ch-abil" rows="3">${esc(active.abilities)}\nVestigium: ${esc(active.vestigium_signature)}</textarea></label>
            <label class="field"><span>Hành trình tâm lý (Arc Progression)</span><textarea id="ch-arc" rows="3">${esc(active.arc_progression)}</textarea></label>
            <label class="field"><span>Ghi chú riêng của tác giả (Private — không bao giờ công bố)</span><textarea id="ch-priv" rows="2">${esc(active.private_notes)}</textarea></label>
            <label class="field"><span>Tóm tắt công khai (Public Site Profile)</span><textarea id="ch-pub" rows="2">${esc(active.public_summary)}</textarea></label>
          </div>
          <div>
            <strong>Mạng lưới quan hệ</strong>
            <div class="stack-sm" style="margin-top:6px">
              ${relationships.filter((r) => r.source_character_id === active.id || r.target_character_id === active.id).map((r) => {
                const otherId = r.source_character_id === active.id ? r.target_character_id : r.source_character_id;
                const other = characters.find((x) => x.id === otherId);
                return `<div class="list-item"><div class="row-between"><strong>${esc(other?.name || otherId)}</strong><span class="pill neutral">${esc(r.relation_type)}</span></div><span class="muted" style="font-size:12px">${esc(r.description)} (từ Ch. ${r.as_of_chapter})</span></div>`;
              }).join("") || `<div class="muted">Chưa có quan hệ nào được gắn.</div>`}
            </div>
          </div>
        </div>
      ` : ""}
    </div>
  `;

  ws.querySelectorAll("[data-cid]").forEach((el) => {
    el.onclick = () => ctx.navigate("characters", { characterId: el.dataset.cid });
  });

  ws.querySelector("#add-char-btn").onclick = async () => {
    const name = prompt("Tên nhân vật mới:");
    if (!name) return;
    const res = await api("/api/characters", { method: "POST", body: { name, faction: "Castilian Empire", data_state: "draft" } });
    toast(`Đã tạo hồ sơ ${name}`);
    ctx.navigate("characters", { characterId: res.character.id });
  };

  if (active) {
    ws.querySelector("#save-char-btn").onclick = async () => {
      await api(`/api/characters/${active.id}`, {
        method: "PUT",
        body: {
          biography: document.getElementById("ch-bio").value,
          voice_profile: document.getElementById("ch-voice").value,
          abilities: document.getElementById("ch-abil").value,
          arc_progression: document.getElementById("ch-arc").value,
          private_notes: document.getElementById("ch-priv").value,
          public_summary: document.getElementById("ch-pub").value,
        },
      });
      toast(`Đã lưu hồ sơ ${active.name}`);
    };

    ctx.setContextPanel("Character", `
      <div class="ctx-card">
        <h4>Kiểm tra Knowledge State</h4>
        <p class="muted" style="font-size:12px">Xem chính xác <strong>${esc(active.name)}</strong> được phép biết gì và chưa thể biết gì tại bất kỳ chương nào.</p>
        <button class="btn gold sm full" id="ctx-check-kn">Mở ma trận Knowledge State</button>
      </div>
    `);
    document.getElementById("ctx-check-kn").onclick = () => ctx.navigate("timeline", { characterId: active.id });
  }
}

// 04. CANON DATABASE + INTERACTIVE CANON GRAPH
export async function renderCanon(ws, ctx) {
  const [{ entries }, graph] = await Promise.all([api("/api/canon"), api("/api/canon/graph")]);

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>04 · Canon Database &amp; Canon Graph</h2>
        <p>Hệ tri thức quan hệ tách bạch 3 tầng (Canon · Draft · What-if) và bản đồ liên kết đối tượng TFAM.</p>
      </div>
      <button class="btn primary" id="add-canon-btn">+ Thêm mục Canon/Draft</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Bản ghi Canon / Draft / What-if (${entries.length})</h3>
        <table class="table">
          <thead><tr><th>Mục</th><th>Loại</th><th>Tầng</th><th>Hiển thị</th></tr></thead>
          <tbody>
            ${entries.map((e) => `
              <tr>
                <td><strong>${esc(e.title)}</strong><div class="muted" style="font-size:12px">${esc(e.summary)}</div></td>
                <td><span class="pill neutral">${esc(e.category)}</span></td>
                <td><span class="pill ${e.data_state}">${esc(e.data_state)}</span></td>
                <td><span class="pill ${e.visibility}">${esc(e.visibility)}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="card stack-sm">
        <h3>Canon Graph (${graph.nodes.length} nodes · ${graph.edges.length} liên kết)</h3>
        <p class="muted" style="font-size:12px">Mọi đối tượng (Nhân vật, Chương, Vestigium, Sự kiện) được liên kết trực tiếp thay vì wiki rời rạc.</p>
        <div class="stack-sm" style="max-height:360px;overflow-y:auto">
          ${graph.edges.map((ed) => {
            const src = graph.nodes.find((n) => n.id === ed.source_id);
            const tgt = graph.nodes.find((n) => n.id === ed.target_id);
            return `<div class="list-item">
              <div class="row-between">
                <span><strong>${esc(src?.label || ed.source_id)}</strong> → <em>${esc(ed.relation_label)}</em> → <strong>${esc(tgt?.label || ed.target_id)}</strong></span>
                <span class="pill ${ed.data_state}">${esc(ed.data_state)}</span>
              </div>
              <span class="muted" style="font-size:11px">${esc(ed.notes)}</span>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  ws.querySelector("#add-canon-btn").onclick = async () => {
    const title = prompt("Tên mục Canon/Lore mới:");
    if (!title) return;
    const summary = prompt("Tóm tắt ngắn:") || "";
    const stateChoice = prompt("Tầng dữ liệu (canon / draft / what_if):", "draft") || "draft";
    await api("/api/canon", { method: "POST", body: { title, summary, category: "vestigium", data_state: stateChoice } });
    toast("Đã thêm bản ghi vào Canon Database");
    ctx.navigate("canon");
  };

  ctx.setContextPanel("Canon Rules", `
    <div class="ctx-card">
      <h4>Bảo toàn tính nguyên vẹn Canon</h4>
      <div style="font-size:12px" class="muted">
        Bản ghi ở trạng thái <strong>What-if</strong> không bao giờ được ghi đè âm thầm lên bản ghi <strong>Canon</strong>. Backend sẽ trả về lỗi <code>409 Conflict</code> nếu có yêu cầu ghi đè trực tiếp.
      </div>
    </div>
  `);
}

// 05. TIMELINE & CONTINUITY + CHARACTER KNOWLEDGE STATE ENGINE
export async function renderTimeline(ws, ctx) {
  const [{ events }, { characters }] = await Promise.all([api("/api/timeline"), api("/api/characters")]);
  const selectedChar = ctx.state.selectedCharacterId || characters[0]?.id;

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>05 · Timeline, Continuity &amp; Character Knowledge State</h2>
        <p>Chọn nhân vật và số chương bất kỳ để kiểm tra chính xác những gì nhân vật đã biết và những gì CHƯA THỂ BIẾT.</p>
      </div>
      <button class="btn primary" id="add-event-btn">+ Thêm sự kiện Timeline</button>
    </div>

    <div class="card stack-sm" style="margin-bottom:14px">
      <div class="row-between">
        <h3>A. Character Knowledge State Inspector</h3>
        <div class="row">
          <select id="kn-char" style="width:220px">
            ${characters.map((c) => `<option value="${c.id}" ${c.id === selectedChar ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
          </select>
          <input id="kn-ch" type="number" value="218" style="width:110px" title="Tại Chương số" />
          <button class="btn gold" id="kn-check-btn">Kiểm tra tại Chương</button>
        </div>
      </div>
      <div id="kn-result" class="grid-2"></div>
    </div>

    <div class="card">
      <h3>Trục thời gian chính sử TFAM (${events.length} mốc)</h3>
      <table class="table">
        <thead><tr><th>Thời gian</th><th>Sự kiện</th><th>Địa điểm</th><th>Chương</th><th>Tầng</th></tr></thead>
        <tbody>
          ${events.map((e) => `
            <tr>
              <td><strong>${esc(e.in_world_date)}</strong><div class="muted" style="font-size:11px">${esc(e.event_code)}</div></td>
              <td><strong>${esc(e.title)}</strong><div class="muted" style="font-size:12px">${esc(e.summary)}</div></td>
              <td>${esc(e.location)}</td>
              <td>Ch. ${e.chapter_number || "-"}</td>
              <td><span class="pill ${e.data_state}">${esc(e.data_state)}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  async function loadKnowledge() {
    const cid = document.getElementById("kn-char").value;
    const ch = document.getElementById("kn-ch").value || "218";
    const res = await api(`/api/knowledge-state?character_id=${encodeURIComponent(cid)}&chapter=${encodeURIComponent(ch)}`);
    document.getElementById("kn-result").innerHTML = `
      <div class="ctx-card">
        <h4>ĐÃ BIẾT tại Chương ${res.at_chapter} (${res.known.length})</h4>
        <div class="stack-sm">
          ${res.known.map((k) => `<div style="font-size:12px"><span class="pill known">Ch. ${k.learned_chapter}</span> ${esc(k.fact_statement)}</div>`).join("") || `<span class="muted">Chưa có tri thức nào được ghi nhận trước Chương ${res.at_chapter}.</span>`}
        </div>
      </div>
      <div class="ctx-card">
        <h4>CHƯA THỂ BIẾT / CẤM NHẮC TỚI (${res.cannot_know_yet.length})</h4>
        <div class="stack-sm">
          ${res.cannot_know_yet.map((k) => `<div style="font-size:12px"><span class="pill cannot_know_yet">Hé lộ Ch. ${k.learned_chapter || "TBD"}</span> ${esc(k.fact_statement)}<div class="muted" style="font-size:11px">${esc(k.notes)}</div></div>`).join("") || `<span class="muted">Không có giới hạn bí mật nào chưa mở.</span>`}
        </div>
      </div>
    `;
  }

  ws.querySelector("#kn-check-btn").onclick = loadKnowledge;
  ws.querySelector("#add-event-btn").onclick = async () => {
    const title = prompt("Tên sự kiện mới:");
    if (!title) return;
    const in_world_date = prompt("Thời điểm trong truyện (vd: 11/1717):", "11/1717") || "1717";
    const chapter_number = Number(prompt("Số chương nguồn:", "219") || 219);
    await api("/api/timeline", { method: "POST", body: { title, in_world_date, sort_year: 1717.9, chapter_number, data_state: "draft" } });
    toast("Đã thêm sự kiện vào Timeline");
    ctx.navigate("timeline");
  };

  await loadKnowledge();
  ctx.setContextPanel("Continuity", `
    <div class="ctx-card">
      <h4>Cảnh báo liên thông QA</h4>
      <div style="font-size:12px" class="muted">
        Ví dụ chuẩn: Tại <strong>Chương 218</strong>, Edward Spencer chỉ biết tin đồn tuyến tiếp tế Wardenholf, chưa biết <em>Lò Hiệu Chỉnh Wardenholf</em> (Ch. 225). Khi chạy QA trên Ch. 218, hệ thống tự bắt lỗi này.
      </div>
    </div>
  `);
}

// 06. WORLDBUILDING STUDIO
export async function renderWorldbuilding(ws, ctx) {
  const { entities } = await api("/api/world");
  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>06 · Worldbuilding Studio</h2>
        <p>Địa lý, chính trị, phe phái, gia tộc, lịch sử và hệ thống quyền lực thế giới TFAM.</p>
      </div>
      <button class="btn primary" id="add-world-btn">+ Thêm thực thể thế giới</button>
    </div>
    <div class="grid-2">
      ${entities.map((e) => `
        <div class="card stack-sm">
          <div class="row-between">
            <strong>${esc(e.name)}</strong>
            <div class="row"><span class="pill neutral">${esc(e.entity_type)}</span><span class="pill ${e.data_state}">${esc(e.data_state)}</span></div>
          </div>
          <div class="muted" style="font-size:12px">Khu vực: ${esc(e.region)}</div>
          <p style="margin:0;font-size:13px">${esc(e.description)}</p>
        </div>`).join("")}
    </div>
  `;
  ws.querySelector("#add-world-btn").onclick = async () => {
    const name = prompt("Tên phe phái / vùng đất / gia tộc:");
    if (!name) return;
    const region = prompt("Khu vực:") || "";
    const description = prompt("Mô tả:") || "";
    await api("/api/world", { method: "POST", body: { name, region, description, entity_type: "faction", data_state: "draft" } });
    toast("Đã thêm thực thể Worldbuilding");
    ctx.navigate("world");
  };
  ctx.setContextPanel("Worldbuilding", `<div class="ctx-card"><h4>Tổng số thực thể</h4><div class="stat-value">${entities.length}</div></div>`);
}

// 07. WAR ROOM & WHAT-IF SANDBOX
export async function renderWarRoom(ws, ctx) {
  const [{ campaigns }, { scenarios }] = await Promise.all([api("/api/war-room/campaigns"), api("/api/what-if")]);

  ws.innerHTML = `
    <div class="page-header">
      <div>
        <h2>07 · War Room &amp; What-if Sandbox</h2>
        <p>Quản lý chiến dịch, lực lượng, hậu cần quân sự và mô phỏng nhánh giả định What-if hoàn toàn cách ly khỏi Canon.</p>
      </div>
      <button class="btn primary" id="add-whatif-btn">+ Tạo nhánh What-if mới</button>
    </div>

    <div class="grid-2">
      <div class="card stack-sm">
        <h3>Chiến dịch &amp; Mặt trận (${campaigns.length})</h3>
        ${campaigns.map((c) => `
          <div class="list-item">
            <div class="row-between"><strong>${esc(c.name)}</strong><span class="pill ${c.data_state}">${esc(c.data_state)}</span></div>
            <div class="muted" style="font-size:12px">Mặt trận: ${esc(c.theater)} · ${esc(c.period)}</div>
            <div style="font-size:12px"><strong>Mục tiêu:</strong> ${esc(c.objectives)}</div>
            <div class="muted" style="font-size:12px"><strong>Hậu cần:</strong> ${esc(c.logistics_notes)}</div>
          </div>`).join("")}
      </div>

      <div class="card stack-sm">
        <h3>D. What-if Sandbox (Cách ly khỏi Canon)</h3>
        ${scenarios.map((s) => `
          <div class="list-item">
            <div class="row-between"><strong>${esc(s.title)}</strong><span class="pill what_if">Phân nhánh Ch. ${s.divergence_chapter}</span></div>
            <div style="font-size:12px">${esc(s.premise)}</div>
            <div class="muted" style="font-size:11px">Ghi chú phân tích: ${esc(s.notes)}</div>
          </div>`).join("")}
      </div>
    </div>
  `;

  ws.querySelector("#add-whatif-btn").onclick = async () => {
    const title = prompt("Tên kịch bản What-if:");
    if (!title) return;
    const premise = prompt("Giả thiết phân nhánh:") || "";
    const divergence_chapter = Number(prompt("Phân nhánh từ Chương số:", "218") || 218);
    const res = await api("/api/what-if", { method: "POST", body: { title, premise, divergence_chapter } });
    toast(`Đã tạo nhánh What-if (phát hiện ${res.downstream_canon_events.length} sự kiện canon cần đối chiếu)`);
    ctx.navigate("warroom");
  };

  ctx.setContextPanel("What-if Isolation", `
    <div class="ctx-card">
      <h4>Cách ly an toàn</h4>
      <div style="font-size:12px" class="muted">
        Mọi thay đổi trong What-if Sandbox được lưu ở bảng <code>what_if_scenarios</code> và trạng thái <code>what_if</code>; hệ thống cấm xuất bản trực tiếp nhánh What-if lên Public Site.
      </div>
    </div>
  `);
}
