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
    mods: [
      "Umbral Intensify",
      "Transient Fortitude",
      "Adaptation",
      "Rolling Guard",
      "Primed Continuity"
    ],
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
    mods: [
      "Serration",
      "Split Chamber",
      "Vital Sense",
      "Hunter Munitions",
      "Malignant Force"
    ],
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

let activeCategory = "Tous";

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

  builds = sortBuilds(builds);
  return builds;
}

function updateBuildById(buildId, updater) {
  const builds = loadBuilds().map((build) => {
    if (build.id !== buildId) {
      return build;
    }

    return updater(build);
  });

  saveBuilds(builds);
  renderBuilds();
}

function createBuildCard(build) {
  const card = document.createElement("article");
  card.className = "card";

  const tagsHtml = build.tags.map((tag) => `<span class="tag-chip">#${tag}</span>`).join("");

  card.innerHTML = `
    <h3>${build.name}</h3>
    <div class="meta-row">
      <span class="badge">${build.type}</span>
      <span class="badge">${build.content}</span>
      <span class="badge">par ${build.author}</span>
    </div>
    <p>${build.description}</p>
    <div class="tags">${tagsHtml}</div>
    <div class="card-actions">
      <button data-action="like" data-id="${build.id}">👍 ${build.likes}</button>
      <button data-action="favorite" data-id="${build.id}" class="${build.favorite ? "is-on" : ""}">
        ${build.favorite ? "★ Favori" : "☆ Favori"}
      </button>
      <a class="details-link" href="build.html?id=${encodeURIComponent(build.id)}">Voir les mods</a>
    </div>
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

list.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const action = target.dataset.action;
  const buildId = target.dataset.id;

  if (!action || !buildId) {
    return;
  }

  if (action === "like") {
    updateBuildById(buildId, (build) => ({ ...build, likes: build.likes + 1 }));
    return;
  }

  if (action === "favorite") {
    updateBuildById(buildId, (build) => ({ ...build, favorite: !build.favorite }));
  }
});

searchInput.addEventListener("input", renderBuilds);
sortSelect.addEventListener("change", renderBuilds);
favoritesOnlyInput.addEventListener("change", renderBuilds);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const tags = document
    .getElementById("tags")
    .value.split(",")
    .map((tag) => normalize(tag))
    .filter(Boolean);

  const mods = document
    .getElementById("mods")
    .value.split("\n")
    .map((mod) => mod.trim())
    .filter(Boolean);

  const build = {
    id: crypto.randomUUID(),
    name: document.getElementById("name").value.trim(),
    author: document.getElementById("author").value.trim(),
    type: document.getElementById("type").value,
    content: document.getElementById("content").value,
    description: document.getElementById("description").value.trim(),
    tags,
    mods,
    likes: 0,
    favorite: false,
    createdAt: Date.now()
  };

  const builds = [build, ...loadBuilds()];
  saveBuilds(builds);
  form.reset();

  if (activeCategory !== "Tous" && activeCategory !== build.type) {
    setActiveTab(build.type);
    return;
  }

  renderBuilds();
});

renderBuilds();
