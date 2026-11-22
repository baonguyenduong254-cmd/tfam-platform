import { api, esc, toast } from "./api.js";
import { renderDashboard, renderManuscript, renderNarrativeQA, renderImporter } from "./modules-writing.js";
import { renderCharacters, renderCanon, renderTimeline, renderWorldbuilding, renderWarRoom } from "./modules-universe.js";
import { renderAssets, renderPublishing, renderCommerce, renderAnalytics, renderAdmin } from "./modules-business.js";

export const MODULES = [
  { group: "I. Writing", id: "dashboard", num: "01", label: "Dashboard", render: renderDashboard },
  { group: "I. Writing", id: "manuscript", num: "02", label: "Manuscript Editor", render: renderManuscript },
  { group: "I. Writing", id: "qa", num: "08", label: "Narrative QA", render: renderNarrativeQA },
  { group: "I. Writing", id: "importer", num: "14", label: "Data Importer", render: renderImporter },

  { group: "II. Universe", id: "characters", num: "03", label: "Character Studio", render: renderCharacters },
  { group: "II. Universe", id: "canon", num: "04", label: "Canon Database & Graph", render: renderCanon },
  { group: "II. Universe", id: "timeline", num: "05", label: "Timeline & Knowledge", render: renderTimeline },
  { group: "II. Universe", id: "world", num: "06", label: "Worldbuilding Studio", render: renderWorldbuilding },
  { group: "II. Universe", id: "warroom", num: "07", label: "War Room & What-if", render: renderWarRoom },

  { group: "III. Publishing", id: "assets", num: "09", label: "Asset Library (R2)", render: renderAssets },
  { group: "III. Publishing", id: "publishing", num: "10", label: "Publishing Center", render: renderPublishing },

  { group: "IV. Business & Admin", id: "commerce", num: "11", label: "Commerce Manager", render: renderCommerce },
  { group: "IV. Business & Admin", id: "analytics", num: "12", label: "Reader Analytics", render: renderAnalytics },
  { group: "IV. Business & Admin", id: "admin", num: "13", label: "System & Admin", render: renderAdmin },
];

export const state = {
  user: null,
  activeModule: "dashboard",
  openTabs: ["dashboard", "manuscript"],
  selectedChapterId: "ch-218",
  selectedCharacterId: "char-edward",
};

export function setContextPanel(badgeText, html) {
  document.getElementById("context-badge").textContent = badgeText;
  document.getElementById("context-body").innerHTML = html;
}

export async function navigate(moduleId, opts = {}) {
  if (opts.chapterId) state.selectedChapterId = opts.chapterId;
  if (opts.characterId) state.selectedCharacterId = opts.characterId;
  state.activeModule = moduleId;
  if (!state.openTabs.includes(moduleId)) {
    state.openTabs.push(moduleId);
    if (state.openTabs.length > 7) state.openTabs.shift();
  }
  renderSidebar();
  renderTabs();
  const ws = document.getElementById("workspace");
  ws.innerHTML = `<div class="muted">Đang tải dữ liệu...</div>`;
  const mod = MODULES.find((m) => m.id === moduleId) || MODULES[0];
  try {
    await mod.render(ws, { state, navigate, setContextPanel });
  } catch (err) {
    ws.innerHTML = `<div class="alert error">Lỗi tải module ${esc(mod.label)}: ${esc(err.message)}</div>`;
  }
}

function renderSidebar() {
  const nav = document.getElementById("sidebar-nav");
  const groups = [...new Set(MODULES.map((m) => m.group))];
  nav.innerHTML = groups
    .map((g) => {
      const items = MODULES.filter((m) => m.group === g)
        .map(
          (m) => `
          <button class="nav-item ${state.activeModule === m.id ? "active" : ""}" data-mod="${m.id}">
            <span class="nav-num">${m.num}</span>
            <span>${esc(m.label)}</span>
          </button>`
        )
        .join("");
      return `<div class="nav-group-label">${esc(g)}</div>${items}`;
    })
    .join("");
  nav.querySelectorAll(".nav-item").forEach((btn) => {
    btn.onclick = () => navigate(btn.dataset.mod);
  });
}

function renderTabs() {
  const bar = document.getElementById("tabs-bar");
  bar.innerHTML = state.openTabs
    .map((id) => {
      const m = MODULES.find((x) => x.id === id);
      if (!m) return "";
      return `<div class="tab-chip ${state.activeModule === id ? "active" : ""}" data-tab="${id}">
        <span>${m.num} · ${esc(m.label)}</span>
        ${state.openTabs.length > 1 ? `<span class="tab-close" data-close="${id}">×</span>` : ""}
      </div>`;
    })
    .join("");
  bar.querySelectorAll(".tab-chip").forEach((el) => {
    el.onclick = (e) => {
      if (e.target.dataset.close) {
        const cid = e.target.dataset.close;
        state.openTabs = state.openTabs.filter((x) => x !== cid);
        if (state.activeModule === cid) navigate(state.openTabs[0] || "dashboard");
        else renderTabs();
        return;
      }
      navigate(el.dataset.tab);
    };
  });
}

// Command-K Global Search
function setupGlobalSearch() {
  const modal = document.getElementById("cmdk-modal");
  const input = document.getElementById("cmdk-input");
  const results = document.getElementById("cmdk-results");

  const openModal = () => {
    modal.classList.remove("hidden");
    input.value = "";
    results.innerHTML = `<div class="muted" style="padding:8px">Nhập từ khóa (ví dụ: Edward, Wardenholf, Speculum, Chương 218)...</div>`;
    input.focus();
  };
  const closeModal = () => modal.classList.add("hidden");

  document.getElementById("cmdk-trigger").onclick = openModal;
  modal.querySelector(".modal-backdrop").onclick = closeModal;
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openModal();
    } else if (e.key === "Escape") {
      closeModal();
    }
  });

  let timer;
  input.oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) return;
      try {
        const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
        const items = [
          ...data.chapters.map((c) => ({ tag: "Chapter", title: `${c.code} · ${c.title}`, sub: c.status, act: () => navigate("manuscript", { chapterId: c.id }) })),
          ...data.characters.map((c) => ({ tag: "Character", title: c.name, sub: `${c.faction} · ${c.data_state}`, act: () => navigate("characters", { characterId: c.id }) })),
          ...data.canon.map((c) => ({ tag: "Canon", title: c.title, sub: `${c.category} · ${c.data_state}`, act: () => navigate("canon") })),
          ...data.timeline.map((e) => ({ tag: "Timeline", title: `${e.in_world_date} · ${e.title}`, sub: `Ch. ${e.chapter_number || "-"}`, act: () => navigate("timeline") })),
        ];
        if (!items.length) {
          results.innerHTML = `<div class="muted" style="padding:8px">Không tìm thấy kết quả cho "${esc(q)}".</div>`;
          return;
        }
        results.innerHTML = items
          .map((it, idx) => `<div class="list-item" data-idx="${idx}"><div class="row-between"><strong>${esc(it.title)}</strong><span class="pill neutral">${esc(it.tag)}</span></div><span class="muted" style="font-size:12px">${esc(it.sub)}</span></div>`)
          .join("");
        results.querySelectorAll(".list-item").forEach((el) => {
          el.onclick = () => {
            closeModal();
            items[Number(el.dataset.idx)].act();
          };
        });
      } catch (err) {
        results.innerHTML = `<div class="alert error">${esc(err.message)}</div>`;
      }
    }, 180);
  };
}

async function boot() {
  setupGlobalSearch();
  const loginForm = document.getElementById("login-form");
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("login-error");
    errEl.classList.add("hidden");
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: {
          email: document.getElementById("login-email").value,
          password: document.getElementById("login-password").value,
        },
      });
      state.user = res.user;
      enterShell();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    }
  };

  document.getElementById("logout-btn").onclick = async () => {
    await api("/api/auth/logout", { method: "POST" });
    state.user = null;
    document.getElementById("studio-shell").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
    toast("Đã đăng xuất Studio");
  };

  try {
    const me = await api("/api/auth/me");
    if (me.authenticated && ["owner", "editor"].includes(me.user.role)) {
      state.user = me.user;
      enterShell();
      return;
    }
  } catch (_) {}
  document.getElementById("auth-screen").classList.remove("hidden");
}

function enterShell() {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("studio-shell").classList.remove("hidden");
  document.getElementById("user-badge").innerHTML = `<strong>${esc(state.user.display_name)}</strong><span>Role: ${esc(state.user.role.toUpperCase())}</span>`;
  navigate(state.activeModule);
}

boot();
