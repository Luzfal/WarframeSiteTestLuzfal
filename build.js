const ADMIN_PASSWORD = "warframe-admin";
const ADMIN_SESSION_KEY = "warframe-admin-session";
const BUILDS_KEY = "warframe-builds";

const detailContainer = document.getElementById("build-detail");
const adminStatus = document.getElementById("detail-admin-status");
const adminPasswordInput = document.getElementById("detail-admin-password");
const adminLoginButton = document.getElementById("detail-admin-login");
const adminLogoutButton = document.getElementById("detail-admin-logout");
const readonlyMessage = document.getElementById("detail-readonly-message");
const buildForm = document.getElementById("detail-build-form");
const modsInput = document.getElementById("detail-mods");
const deleteButton = document.getElementById("detail-delete");

let currentBuildId = null;

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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderNotFound() {
  detailContainer.innerHTML = `
    <h2>Build introuvable</h2>
    <p>Le build demandé n'existe pas ou a été supprimé.</p>
  `;

  buildForm.style.display = "none";
  readonlyMessage.style.display = "none";
}

function buildModSlots(mods) {
  const slotNames = ["Aura", "Exilus", "Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5", "Slot 6", "Slot 7", "Slot 8"];

  return slotNames
    .map((slotName, index) => {
      const mod = mods[index];
      const occupied = Boolean(mod);
      return `
        <article class="mod-slot ${occupied ? "is-filled" : ""}">
          <p class="slot-title">${slotName}</p>
          <p class="slot-mod">${occupied ? escapeHtml(mod) : "Emplacement vide"}</p>
        </article>
      `;
    })
    .join("");
}

function renderBuild(build) {
  const tagsHtml = (build.tags || []).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("");
  const mods = build.mods || [];
  const modSlotsHtml = buildModSlots(mods);

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

    <h3>Installation des mods (slots)</h3>
    <div class="mods-grid">${modSlotsHtml}</div>
  `;

  modsInput.value = mods.join("\n");
}

function applyAdminMode() {
  const admin = isAdmin();
  adminStatus.textContent = admin ? "Mode administrateur activé" : "Mode lecture seule (utilisateur)";
  readonlyMessage.style.display = admin ? "none" : "block";

  for (const field of buildForm.querySelectorAll("textarea, button")) {
    field.disabled = !admin;
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
  applyAdminMode();
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

buildForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isAdmin() || !currentBuildId) {
    return;
  }

  const mods = modsInput.value
    .split("\n")
    .map((mod) => mod.trim())
    .filter(Boolean);

  const nextBuilds = loadBuilds().map((build) => {
    if (build.id !== currentBuildId) {
      return build;
    }

    return { ...build, mods };
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
