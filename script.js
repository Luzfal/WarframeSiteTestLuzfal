const ADMIN_PASSWORD = "warframe-admin";
const ADMIN_SESSION_KEY = "warframe-admin-session";

const defaultBuilds = [
  {
    id: crypto.randomUUID(),
    name: "Saryn Prime - Toxic Room",
    author: "Luzfal",
    type: "Warframe",
    content: "Steel Path",
    description:
      "Spore + Miasma orienté survie Steel Path avec adaptation et rolling guard.",
    tags: ["survie", "steelpath", "solo"],
    mods: ["Umbral Intensify", "Transient Fortitude", "Adaptation", "Rolling Guard", "Primed Continuity"],
    likes: 21,
    favorite: false,
    createdAt: Date.now() - 3600 * 1000 * 48
  },
  {
    id: crypto.randomUUID(),
    name: "Kuva Bramma - Crit Viral",
    author: "VoidHunter",
    type: "Arme",
    content: "Archonte",
    description:
      "Hunter Munitions, Vital Sense et faction mod pour burst les eximus.",
    tags: ["crit", "viral", "burst"],
    mods: ["Serration", "Split Chamber", "Vital Sense", "Hunter Munitions", "Malignant Force"],
    likes: 16,
    favorite: false,
    createdAt: Date.now() - 3600 * 1000 * 24
  },
  {
    id: crypto.randomUUID(),
    name: "Panzer Vulpaphyla - Support",
    author: "KavatMain",
    type: "Compagnon",
    content: "Farm rapide",
    description: "Viral spread permanent, sacrifiable en contenu endurance.",
    tags: ["support", "viral", "endurance"],
    mods: ["Link Health", "Pack Leader", "Medi-Pet Kit", "Viral Quills"],
    likes: 9,
    favorite: true,
    createdAt: Date.now() - 3600 * 1000 * 12
  }
];

const list = document.getElementById("build-list");
const form = document.getElementById("build-form");
const tabs = document.querySelectorAll(".tab");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const favoritesOnlyInput = document.getElementById("favorites-only");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginButton = document.getElementById("admin-login");
const adminLogoutButton = document.getElementById("admin-logout");
const adminStatus = document.getElementById("admin-status");
const readonlyMessage = document.getElementById("readonly-message");
const submitButton = document.getElementById("submit-build");
const cancelEditButton = document.getElementById("cancel-edit");

let activeCategory = "Tous";
let editingBuildId = null;

function isAdmin() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function loadBuilds() {
  const stored = localStorage.getItem("warframe-builds");
  return stored ? JSON.parse(stored) : defaultBuilds;
}

function saveBuilds(builds) {
  localStorage.setItem("warframe-builds", JSON.stringify(builds));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function sortBuilds(builds) {
  const sort = sortSelect.value;

  if (sort === "likes") {
    return builds.sort((a, b) => b.likes - a.likes);
  }

  if (sort === "name") {
    return builds.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  return builds.sort((a, b) => b.createdAt - a.createdAt);
}

function visibleBuilds() {
  const query = normalize(searchInput.value);
  const favoritesOnly = favoritesOnlyInput.checked;

  let builds = loadBuilds().filter((build) => {
    if (activeCategory !== "Tous" && build.type !== activeCategory) {
      return false;
    }

    if (favoritesOnly && !build.favorite) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      build.name,
      build.author,
      build.description,
      build.content,
      build.tags.join(" "),
      (build.mods || []).join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return sortBuilds(builds);
}

function resetFormEditingState() {
  editingBuildId = null;
  submitButton.textContent = "Publier";
  cancelEditButton.style.display = "none";
}

function applyAdminMode() {
  const admin = isAdmin();
  adminStatus.textContent = admin ? "Mode administrateur activé" : "Mode lecture seule (utilisateur)";
  readonlyMessage.style.display = admin ? "none" : "block";
  form.classList.toggle("is-disabled", !admin);

  for (const field of form.querySelectorAll("input, select, textarea, button")) {
    if (field.id === "cancel-edit") {
      field.disabled = !admin;
      continue;
    }

    field.disabled = !admin;
  }

  if (!admin) {
    resetFormEditingState();
  }

  renderBuilds();
}

function updateBuildById(buildId, updater) {
  if (!isAdmin()) {
    return;
  }

  const builds = loadBuilds().map((build) => {
    if (build.id !== buildId) {
      return build;
    }

    return updater(build);
  });

  saveBuilds(builds);
  renderBuilds();
}

function deleteBuildById(buildId) {
  if (!isAdmin()) {
    return;
  }

  const builds = loadBuilds().filter((build) => build.id !== buildId);
  saveBuilds(builds);

  if (editingBuildId === buildId) {
    form.reset();
    resetFormEditingState();
  }

  renderBuilds();
}

function fillFormForEdit(build) {
  editingBuildId = build.id;
  document.getElementById("name").value = build.name;
  document.getElementById("author").value = build.author;
  document.getElementById("type").value = build.type;
  document.getElementById("content").value = build.content;
  document.getElementById("tags").value = build.tags.join(", ");
  document.getElementById("description").value = build.description;
  submitButton.textContent = "Enregistrer les modifications";
  cancelEditButton.style.display = "inline-block";
  window.scrollTo({ top: form.offsetTop - 40, behavior: "smooth" });
}

function createBuildCard(build) {
  const card = document.createElement("article");
  card.className = "card clickable-card";
  card.dataset.href = `build.html?id=${encodeURIComponent(build.id)}`;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Ouvrir le build ${build.name}`);

  const tagsHtml = build.tags.map((tag) => `<span class="tag-chip">#${tag}</span>`).join("");

  const adminActions = isAdmin()
    ? `
      <button type="button" data-action="like" data-id="${build.id}">👍 ${build.likes}</button>
      <button type="button" data-action="favorite" data-id="${build.id}" class="${build.favorite ? "is-on" : ""}">
        ${build.favorite ? "★ Favori" : "☆ Favori"}
      </button>
      <button type="button" data-action="edit" data-id="${build.id}">Modifier</button>
      <button type="button" data-action="delete" data-id="${build.id}">Supprimer</button>
    `
    : `<span class="readonly-badge">Lecture seule</span>`;

  card.innerHTML = `
    <h3>${build.name}</h3>
    <div class="meta-row">
      <span class="badge">${build.type}</span>
      <span class="badge">${build.content}</span>
      <span class="badge">par ${build.author}</span>
      <span class="badge">👍 ${build.likes}</span>
    </div>
    <p>${build.description}</p>
    <div class="tags">${tagsHtml}</div>
    <div class="card-actions">${adminActions}</div>
  `;

  return card;
}

function renderBuilds() {
  const builds = visibleBuilds();
  list.innerHTML = "";

  if (builds.length === 0) {
    const empty = document.createElement("article");
    empty.className = "card";
    empty.innerHTML = "<p>Aucun build ne correspond à ce filtre pour le moment.</p>";
    list.append(empty);
    return;
  }

  for (const build of builds) {
    list.append(createBuildCard(build));
  }
}

function setActiveTab(category) {
  activeCategory = category;

  for (const tab of tabs) {
    const isCurrent = tab.dataset.category === category;
    tab.classList.toggle("is-active", isCurrent);
    tab.setAttribute("aria-selected", String(isCurrent));
  }

  renderBuilds();
}

for (const tab of tabs) {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.category));
}

function goToCardDetailFromTarget(target) {
  const card = target.closest(".clickable-card");

  if (!card || !card.dataset.href) {
    return;
  }

  window.location.href = card.dataset.href;
}

list.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("button[data-action]");

  if (button instanceof HTMLButtonElement) {
    const action = button.dataset.action;
    const buildId = button.dataset.id;

    if (!action || !buildId || !isAdmin()) {
      return;
    }

    if (action === "like") {
      updateBuildById(buildId, (build) => ({ ...build, likes: build.likes + 1 }));
      return;
    }

    if (action === "favorite") {
      updateBuildById(buildId, (build) => ({ ...build, favorite: !build.favorite }));
      return;
    }

    if (action === "edit") {
      const build = loadBuilds().find((item) => item.id === buildId);
      if (build) {
        fillFormForEdit(build);
      }
      return;
    }

    if (action === "delete") {
      deleteBuildById(buildId);
    }

    return;
  }

  goToCardDetailFromTarget(target);
});

list.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLElement) || !target.classList.contains("clickable-card")) {
    return;
  }

  event.preventDefault();
  goToCardDetailFromTarget(target);
});

searchInput.addEventListener("input", renderBuilds);
sortSelect.addEventListener("change", renderBuilds);
favoritesOnlyInput.addEventListener("change", renderBuilds);

adminLoginButton.addEventListener("click", () => {
  const password = adminPasswordInput.value;

  if (password !== ADMIN_PASSWORD) {
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

cancelEditButton.addEventListener("click", () => {
  form.reset();
  resetFormEditingState();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isAdmin()) {
    return;
  }

  const tags = document
    .getElementById("tags")
    .value.split(",")
    .map((tag) => normalize(tag))
    .filter(Boolean);

  const buildDraft = {
    name: document.getElementById("name").value.trim(),
    author: document.getElementById("author").value.trim(),
    type: document.getElementById("type").value,
    content: document.getElementById("content").value,
    description: document.getElementById("description").value.trim(),
    tags
  };

  const builds = loadBuilds();

  if (editingBuildId) {
    const nextBuilds = builds.map((build) => {
      if (build.id !== editingBuildId) {
        return build;
      }

      return { ...build, ...buildDraft, mods: build.mods || [] };
    });

    saveBuilds(nextBuilds);
  } else {
    const build = {
      id: crypto.randomUUID(),
      ...buildDraft,
      mods: [],
      likes: 0,
      favorite: false,
      createdAt: Date.now()
    };
    saveBuilds([build, ...builds]);
  }

  form.reset();
  resetFormEditingState();

  if (activeCategory !== "Tous" && activeCategory !== buildDraft.type) {
    setActiveTab(buildDraft.type);
    return;
  }

  renderBuilds();
});

resetFormEditingState();
applyAdminMode();
