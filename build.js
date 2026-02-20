const ADMIN_PASSWORD = "warframe-admin";
const ADMIN_SESSION_KEY = "warframe-admin-session";
const BUILDS_KEY = "warframe-builds";
const MOD_IMAGE_CACHE_KEY = "warframe-mod-image-cache";
const WIKI_API = "https://wiki.warframe.com/w/api.php";

const SLOT_DEFS = [
  { key: "aura", label: "Aura", className: "slot-aura" },
  { key: "exilus", label: "Exilus", className: "slot-exilus" },
  { key: "slot1", label: "Slot 1", className: "slot-1" },
  { key: "slot2", label: "Slot 2", className: "slot-2" },
  { key: "slot3", label: "Slot 3", className: "slot-3" },
  { key: "slot4", label: "Slot 4", className: "slot-4" },
  { key: "slot5", label: "Slot 5", className: "slot-5" },
  { key: "slot6", label: "Slot 6", className: "slot-6" },
  { key: "slot7", label: "Slot 7", className: "slot-7" },
  { key: "slot8", label: "Slot 8", className: "slot-8" }
];

const DEFAULT_MOD_LIBRARY = [
  "Serration",
  "Split Chamber",
  "Vital Sense",
  "Hunter Munitions",
  "Galvanized Chamber",
  "Primed Continuity",
  "Umbral Intensify",
  "Adaptation",
  "Rolling Guard",
  "Blind Rage",
  "Transient Fortitude",
  "Power Drift"
];

const detailContainer = document.getElementById("build-detail");
const modPool = document.getElementById("mod-pool");
const adminStatus = document.getElementById("detail-admin-status");
const adminPasswordInput = document.getElementById("detail-admin-password");
const adminLoginButton = document.getElementById("detail-admin-login");
const adminLogoutButton = document.getElementById("detail-admin-logout");
const readonlyMessage = document.getElementById("detail-readonly-message");
const saveButton = document.getElementById("detail-save");
const deleteButton = document.getElementById("detail-delete");

let currentBuildId = null;
let currentMods = SLOT_DEFS.map(() => "");
let currentBuild = null;
let imageCache = loadImageCache();

function isAdmin() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function loadBuilds() {
  const stored = localStorage.getItem(BUILDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveBuilds(builds) {
  localStorage.setItem(BUILDS_KEY, JSON.stringify(builds));
}

function loadImageCache() {
  const stored = localStorage.getItem(MOD_IMAGE_CACHE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveImageCache() {
  localStorage.setItem(MOD_IMAGE_CACHE_KEY, JSON.stringify(imageCache));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hashColor(name) {
  let hash = 0;
  for (const char of name) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return {
    bg1: `hsl(${hue} 85% 45%)`,
    bg2: `hsl(${(hue + 48) % 360} 75% 30%)`
  };
}

function placeholderImageUrl(name) {
  const clean = name.trim();
  const short = clean
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const color = hashColor(clean || "MOD");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color.bg1}"/>
          <stop offset="100%" stop-color="${color.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="16" fill="url(#g)"/>
      <rect x="10" y="10" width="100" height="100" rx="12" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.32)"/>
      <text x="60" y="68" text-anchor="middle" fill="white" font-size="28" font-weight="700" font-family="Segoe UI, Arial">${short || "MOD"}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function imageForMod(modName) {
  return imageCache[modName] || placeholderImageUrl(modName);
}

async function fetchWikiModImage(modName) {
  if (imageCache[modName]) {
    return imageCache[modName];
  }

  const title = modName.replaceAll(" ", "_");
  const url = `${WIKI_API}?origin=*&action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=180&titles=${encodeURIComponent(title)}`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const pages = payload?.query?.pages || {};
  const page = Object.values(pages)[0];
  const source = page?.thumbnail?.source;

  if (!source) {
    return null;
  }

  imageCache[modName] = source;
  saveImageCache();
  return source;
}

async function hydrateModImages(modNames) {
  const uniqueMods = [...new Set(modNames.filter(Boolean))];

  for (const modName of uniqueMods) {
    if (imageCache[modName]) {
      continue;
    }

    const remote = await fetchWikiModImage(modName);
    if (!remote) {
      continue;
    }

    for (const img of document.querySelectorAll(`img[data-mod-name="${CSS.escape(modName)}"]`)) {
      img.src = remote;
    }
  }
}

function renderNotFound() {
  detailContainer.innerHTML = `
    <h2>Build introuvable</h2>
    <p>Le build demandé n'existe pas ou a été supprimé.</p>
  `;
  modPool.style.display = "none";
  saveButton.style.display = "none";
  deleteButton.style.display = "none";
  readonlyMessage.style.display = "none";
}

function buildLibrary(build) {
  return [...new Set([...(build.mods || []), ...DEFAULT_MOD_LIBRARY].filter(Boolean))];
}

function modImageTag(mod) {
  return `<img class="mod-art" data-mod-name="${escapeHtml(mod)}" src="${imageForMod(mod)}" alt="Image du mod ${escapeHtml(mod)}" />`;
}

function renderModPool(build) {
  const mods = buildLibrary(build);
  modPool.innerHTML = `
    <h3>Bibliothèque de mods (glisser-déposer)</h3>
    <p class="hint">Tu peux poser le même mod plusieurs fois sur différents slots.</p>
    <div class="mod-pool-grid">
      ${mods
        .map(
          (mod) => `
            <button type="button" class="pool-mod" draggable="true" data-mod="${escapeHtml(mod)}" title="${escapeHtml(mod)}">
              ${modImageTag(mod)}
              <span class="pool-mod-name">${escapeHtml(mod)}</span>
            </button>`
        )
        .join("")}
    </div>
  `;
}

function buildModSlots(mods) {
  return SLOT_DEFS.map((slot, index) => {
    const mod = mods[index] || "";
    const occupied = Boolean(mod);
    const modHtml = occupied
      ? `
        <div class="slot-mod-card">
          ${modImageTag(mod)}
          <p class="slot-mod">${escapeHtml(mod)}</p>
        </div>
      `
      : '<p class="slot-mod">Emplacement vide</p>';

    return `
      <article class="mod-slot ${slot.className} ${occupied ? "is-filled" : ""}" data-slot-index="${index}">
        <p class="slot-title">${slot.label}</p>
        ${modHtml}
        ${occupied ? '<button type="button" class="slot-clear" data-action="clear-slot">Retirer</button>' : ""}
      </article>
    `;
  }).join("");
}

function renderBuild(build) {
  currentBuild = build;
  currentMods = SLOT_DEFS.map((_, index) => build.mods?.[index] || "");

  const tagsHtml = (build.tags || []).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("");

  detailContainer.innerHTML = `
    <h2>${escapeHtml(build.name)}</h2>
    <div class="meta-row">
      <span class="badge">${escapeHtml(build.type)}</span>
      <span class="badge">${escapeHtml(build.content || "Non renseigné")}</span>
      <span class="badge">par ${escapeHtml(build.author || "Anonyme")}</span>
      <span class="badge">👍 ${build.likes || 0}</span>
    </div>
    <p>${escapeHtml(build.description || "")}</p>

    <h3>Tags</h3>
    <div class="tags">${tagsHtml || '<span class="tag-chip">#sans-tag</span>'}</div>

    <h3>Installation des mods (layout type Warframe)</h3>
    <div id="mods-grid" class="mods-grid">${buildModSlots(currentMods)}</div>
  `;

  renderModPool(build);
  wireDragAndDrop();
  applyAdminMode();
  hydrateModImages([...buildLibrary(build), ...currentMods]);
}

function applyAdminMode() {
  const admin = isAdmin();
  adminStatus.textContent = admin ? "Mode administrateur activé" : "Mode lecture seule (utilisateur)";
  readonlyMessage.style.display = admin ? "none" : "block";

  for (const el of document.querySelectorAll(".pool-mod, .slot-clear")) {
    el.toggleAttribute("draggable", admin && el.classList.contains("pool-mod"));
    if (el instanceof HTMLButtonElement) {
      el.disabled = !admin;
    }
  }

  saveButton.disabled = !admin;
  deleteButton.disabled = !admin;
}

function wireDragAndDrop() {
  for (const modButton of document.querySelectorAll(".pool-mod")) {
    modButton.addEventListener("dragstart", (event) => {
      if (!isAdmin()) {
        event.preventDefault();
        return;
      }
      event.dataTransfer?.setData("text/plain", modButton.dataset.mod || "");
    });
  }

  for (const slot of document.querySelectorAll(".mod-slot")) {
    slot.addEventListener("dragover", (event) => {
      if (!isAdmin()) return;
      event.preventDefault();
      slot.classList.add("is-dragover");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("is-dragover");
    });

    slot.addEventListener("drop", (event) => {
      if (!isAdmin()) {
        return;
      }

      event.preventDefault();
      slot.classList.remove("is-dragover");
      const mod = event.dataTransfer?.getData("text/plain") || "";
      const index = Number(slot.dataset.slotIndex);

      if (!mod || Number.isNaN(index)) {
        return;
      }

      currentMods[index] = mod;
      renderBuild({ ...currentBuild, mods: currentMods });
    });
  }

  for (const clearButton of document.querySelectorAll("button[data-action='clear-slot']")) {
    clearButton.addEventListener("click", () => {
      if (!isAdmin()) {
        return;
      }

      const slot = clearButton.closest(".mod-slot");
      const index = Number(slot?.dataset.slotIndex);
      if (Number.isNaN(index)) {
        return;
      }

      currentMods[index] = "";
      renderBuild({ ...currentBuild, mods: currentMods });
    });
  }
}

function getBuildFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    return null;
  }

  currentBuildId = id;
  return loadBuilds().find((item) => item.id === id) || null;
}

function refreshPageBuild() {
  const build = getBuildFromUrl();

  if (!build) {
    renderNotFound();
    return;
  }

  renderBuild(build);
}

adminLoginButton.addEventListener("click", () => {
  if (adminPasswordInput.value !== ADMIN_PASSWORD) {
    adminStatus.textContent = "Mot de passe admin invalide";
    return;
  }

  localStorage.setItem(ADMIN_SESSION_KEY, "true");
  adminPasswordInput.value = "";
  applyAdminMode();
});

adminLogoutButton.addEventListener("click", () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  applyAdminMode();
});

saveButton.addEventListener("click", () => {
  if (!isAdmin() || !currentBuildId) {
    return;
  }

  const preservedSlots = currentMods.map((mod) => mod.trim());
  const nextBuilds = loadBuilds().map((build) => {
    if (build.id !== currentBuildId) {
      return build;
    }

    return { ...build, mods: preservedSlots };
  });

  saveBuilds(nextBuilds);
  refreshPageBuild();
});

deleteButton.addEventListener("click", () => {
  if (!isAdmin() || !currentBuildId) {
    return;
  }

  const nextBuilds = loadBuilds().filter((build) => build.id !== currentBuildId);
  saveBuilds(nextBuilds);
  window.location.href = "index.html";
});

refreshPageBuild();
