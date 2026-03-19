import {
  DIST_ORDER,
  applyMobileVisibility,
  renderTables,
  showEmptyState,
  showLoadingState,
} from "./tables.js";
import { fetchTRM } from "./trm.js";

const TERM_GROUPS = {
  mensual: ["p1m", "mensual", "monthly"],
  anual: ["p1y", "anual", "annual"],
  trianual: ["p3y", "trianual", "triennial"],
  onetime: ["onetime", "one time", "perpetuo", "nan", ""],
};

const state = {
  products: [],
  activeDists: new Set(DIST_ORDER),
  currentResults: createEmptyResults(),
  hasSearched: false,
  activeMobileDist: DIST_ORDER[0],
  isLoadingProducts: true,
  loadError: false,
};

const elements = {
  totalCount: document.getElementById("totalCount"),
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  typeFilter: document.getElementById("typeFilter"),
  segFilter: document.getElementById("segFilter"),
  termFilter: document.getElementById("termFilter"),
  filterChips: Array.from(document.querySelectorAll(".filter-chip")),
  profitPct: document.getElementById("profitPct"),
  qtyInput: document.getElementById("qtyInput"),
  currencySelect: document.getElementById("currencySelect"),
  trmInput: document.getElementById("trmInput"),
  trmStatus: document.getElementById("trmStatus"),
  mobileTabs: Array.from(document.querySelectorAll(".dist-tab")),
  resultsArea: document.getElementById("resultsArea"),
};

initialize();

function initialize() {
  bindEvents();
  syncFilterChips();
  syncMobileTabs();
  loadProducts();

  fetchTRM({
    statusEl: elements.trmStatus,
    inputEl: elements.trmInput,
    onUpdated: () => {
      if (state.hasSearched) {
        renderCurrentResults();
      }
    },
  });
}

function bindEvents() {
  elements.searchButton.addEventListener("click", runSearch);
  elements.searchInput.addEventListener("keydown", handleSearchInputKeydown);

  [elements.typeFilter, elements.segFilter, elements.termFilter].forEach((field) => {
    field.addEventListener("change", () => {
      if (state.hasSearched) {
        runSearch();
      }
    });
  });

  elements.filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      toggleDist(chip.dataset.dist);
    });
  });

  [elements.profitPct, elements.qtyInput, elements.trmInput].forEach((field) => {
    field.addEventListener("input", () => {
      if (state.hasSearched) {
        renderCurrentResults();
      }
    });
  });

  elements.currencySelect.addEventListener("change", () => {
    if (state.hasSearched) {
      renderCurrentResults();
    }
  });

  elements.mobileTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveMobileDist(tab.dataset.dist);
    });
  });
}

async function loadProducts() {
  state.isLoadingProducts = true;
  state.loadError = false;

  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error(`Products request failed with status ${response.status}`);
    }

    const data = await response.json();
    state.products = Array.isArray(data) ? data : [];
    elements.totalCount.textContent = `${state.products.length.toLocaleString("es-CO")} productos - 3 mayoristas`;
  } catch (error) {
    state.products = [];
    state.loadError = true;
    elements.totalCount.textContent = "Error cargando datos";
  } finally {
    state.isLoadingProducts = false;
  }
}

function handleSearchInputKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    runSearch();
  }
}

function runSearch() {
  const query = elements.searchInput.value.trim().toLowerCase();

  if (!query) {
    state.hasSearched = false;
    state.currentResults = createEmptyResults();
    showEmptyState(elements.resultsArea, {
      title: "Escribe algo para buscar",
      message: "Ej: Microsoft 365 Business Basic",
    });
    return;
  }

  if (state.isLoadingProducts) {
    showLoadingState(elements.resultsArea, "Cargando catalogo...");
    return;
  }

  if (state.loadError) {
    showEmptyState(elements.resultsArea, {
      icon: "&#9888;",
      title: "No se pudieron cargar los productos",
      message: "Revisa products.json e intenta de nuevo.",
    });
    return;
  }

  const criteria = getSearchCriteria(query);
  state.hasSearched = true;
  showLoadingState(elements.resultsArea);

  window.setTimeout(() => {
    const filteredProducts = state.products.filter((product) => matchesProduct(product, criteria));
    state.currentResults = groupResultsByDistributor(filteredProducts);
    renderCurrentResults();
  }, 30);
}

function getSearchCriteria(query) {
  return {
    words: query.split(/\s+/).filter(Boolean),
    type: elements.typeFilter.value,
    segment: elements.segFilter.value.toLowerCase(),
    term: elements.termFilter.value,
  };
}

function matchesProduct(product, criteria) {
  const name = String(product.name || "").toLowerCase();
  const segment = String(product.segment || "").toLowerCase();
  const term = String(product.term || "").toLowerCase();
  const billing = String(product.billing || "").toLowerCase();

  const matchesName = criteria.words.every((word) => name.includes(word));
  if (!matchesName) {
    return false;
  }

  if (criteria.type && product.type !== criteria.type) {
    return false;
  }

  if (criteria.segment && !segment.includes(criteria.segment)) {
    return false;
  }

  if (!criteria.term) {
    return true;
  }

  const termGroup = TERM_GROUPS[criteria.term] || [criteria.term.toLowerCase()];
  return termGroup.some((termToken) => term.includes(termToken) || billing.includes(termToken));
}

function groupResultsByDistributor(products) {
  const grouped = createEmptyResults();

  products.forEach((product) => {
    if (grouped[product.distributor]) {
      grouped[product.distributor].push(product);
    }
  });

  return grouped;
}

function toggleDist(dist) {
  if (!dist) {
    return;
  }

  if (state.activeDists.has(dist)) {
    if (state.activeDists.size === 1) {
      return;
    }

    state.activeDists.delete(dist);
  } else {
    state.activeDists.add(dist);
  }

  syncFilterChips();
  syncMobileTabs();

  if (state.hasSearched) {
    renderCurrentResults();
  }
}

function setActiveMobileDist(dist) {
  if (!state.activeDists.has(dist)) {
    return;
  }

  state.activeMobileDist = dist;
  updateMobileTabState();

  if (state.hasSearched) {
    applyMobileVisibility(elements.resultsArea, state.activeMobileDist);
  }
}

function syncFilterChips() {
  elements.filterChips.forEach((chip) => {
    chip.classList.toggle("active", state.activeDists.has(chip.dataset.dist));
  });
}

function syncMobileTabs() {
  elements.mobileTabs.forEach((tab) => {
    tab.hidden = !state.activeDists.has(tab.dataset.dist);
  });

  if (!state.activeDists.has(state.activeMobileDist)) {
    state.activeMobileDist = DIST_ORDER.find((dist) => state.activeDists.has(dist)) || DIST_ORDER[0];
  }

  updateMobileTabState();
}

function updateMobileTabState() {
  elements.mobileTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.dist === state.activeMobileDist);
  });
}

function renderCurrentResults() {
  renderTables({
    resultsArea: elements.resultsArea,
    currentResults: state.currentResults,
    activeDists: state.activeDists,
    activeMobileDist: state.activeMobileDist,
    profitPct: Math.max(0, Number(elements.profitPct.value) || 0),
    qty: Math.max(1, parseInt(elements.qtyInput.value, 10) || 1),
    currency: elements.currencySelect.value,
    trm: Math.max(1, Number(elements.trmInput.value) || 4200),
  });
}

function createEmptyResults() {
  return DIST_ORDER.reduce((accumulator, dist) => {
    accumulator[dist] = [];
    return accumulator;
  }, {});
}
