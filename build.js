const detailContainer = document.getElementById("build-detail");

function loadBuilds() {
  const stored = localStorage.getItem("warframe-builds");
  return stored ? JSON.parse(stored) : [];
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
}

function renderBuild(build) {
  const tagsHtml = (build.tags || []).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("");
  const modsHtml = (build.mods || []).map((mod) => `<li>${escapeHtml(mod)}</li>`).join("");

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
    <div class="tags">${tagsHtml || "<span class=\"tag-chip\">#sans-tag</span>"}</div>

    <h3>Mods à installer</h3>
    <ul class="mods-list">
      ${modsHtml || "<li>Aucun mod renseigné.</li>"}
    </ul>
  `;
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    renderNotFound();
    return;
  }

  const build = loadBuilds().find((item) => item.id === id);

  if (!build) {
    renderNotFound();
    return;
  }

  renderBuild(build);
}

init();
