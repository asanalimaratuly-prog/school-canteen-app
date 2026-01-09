import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 🔥 Ваш Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD3SQTDem7g8r9VHWX5Q-h4Tfq2d0rRiE",
  authDomain: "ashana-ca83.firebaseapp.com",
  projectId: "ashana-ca83",
  storageBucket: "ashana-ca83.firebasestorage.app",
  messagingSenderId: "1004661503332",
  appId: "1:1004661503332:web:ba12c7e9d25144c3f07671"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const refreshBtn = document.getElementById("refreshBtn");

const catAllBtn = document.getElementById("catAll");
const catBtnsWrap = document.getElementById("catBtns");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");

const sortSelect = document.getElementById("sortSelect");
const countText = document.getElementById("countText");
const activeFilters = document.getElementById("activeFilters");

// State
let allItems = [];
let activeCategory = "ALL";
let searchText = "";
let sortMode = "name_asc";

// Helpers
function titleOf(i) {
  return (i.name_ru ?? i.name_kz ?? i.name_en ?? "Без названия").toString();
}

function normalize(s) {
  return s.toLowerCase().trim();
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderCategories(items) {
  const categories = Array.from(
    new Set(items.map(i => (i.category ?? "").toString().trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "ru"));

  catBtnsWrap.innerHTML = categories.map(cat => `
    <button type="button"
            class="btn btn-outline-primary btn-sm cat-btn"
            data-cat="${cat}">
      ${cat}
    </button>
  `).join("");

  catBtnsWrap.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      updateCategoryButtons();
      renderMenu();
    });
  });
}

function updateCategoryButtons() {
  catAllBtn.classList.toggle("btn-primary", activeCategory === "ALL");
  catAllBtn.classList.toggle("btn-outline-primary", activeCategory !== "ALL");

  catBtnsWrap.querySelectorAll(".cat-btn").forEach(btn => {
    const isActive = btn.dataset.cat === activeCategory;
    btn.classList.toggle("btn-primary", isActive);
    btn.classList.toggle("btn-outline-primary", !isActive);
  });
}

function filteredItems() {
  let items = [...allItems];

  // category
  if (activeCategory !== "ALL") {
    items = items.filter(i => (i.category ?? "").toString().trim() === activeCategory);
  }

  // search
  if (searchText) {
    const q = normalize(searchText);
    items = items.filter(i => normalize(titleOf(i)).includes(q));
  }

  // sort
  items.sort((a, b) => {
    const ta = titleOf(a);
    const tb = titleOf(b);
    const pa = Number(a.price ?? 0);
    const pb = Number(b.price ?? 0);

    switch (sortMode) {
      case "name_desc": return tb.localeCompare(ta, "ru");
      case "price_asc": return pa - pb;
      case "price_desc": return pb - pa;
      case "name_asc":
      default: return ta.localeCompare(tb, "ru");
    }
  });

  return items;
}

function renderMenu() {
  const items = filteredItems();

  countText.textContent = `Показано: ${items.length}`;

  const parts = [];
  if (activeCategory !== "ALL") parts.push(`Категория: ${activeCategory}`);
  if (searchText) parts.push(`Поиск: “${searchText}”`);
  activeFilters.textContent = parts.length ? parts.join(" • ") : "";

  if (items.length === 0) {
    menuEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning m-0">Ничего не найдено.</div>
      </div>
    `;
    return;
  }

  menuEl.innerHTML = items.map(i => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title mb-1">${titleOf(i)}</h5>
            <span class="badge bg-success">${i.price ?? "—"} ₸</span>
          </div>
          <div class="text-secondary small">Категория: ${i.category ?? "-"}</div>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadMenu() {
  try {
    setStatus("Загружаем меню...");
    menuEl.innerHTML = "";
    countText.textContent = "";
    activeFilters.textContent = "";

    const q = query(collection(db, "menu"), where("available", "==", true));
    const snap = await getDocs(q);

    allItems = [];
    snap.forEach(doc => allItems.push({ id: doc.id, ...doc.data() }));

    if (allItems.length === 0) {
      setStatus("Меню пустое");
      catBtnsWrap.innerHTML = "";
      activeCategory = "ALL";
      updateCategoryButtons();
      renderMenu();
      return;
    }

    setStatus("Готово ✅");

    renderCategories(allItems);
    activeCategory = "ALL";
    updateCategoryButtons();

    renderMenu();
  } catch (e) {
    console.error(e);
    setStatus("Ошибка загрузки (см. Console)");
  }
}

// Events
refreshBtn.addEventListener("click", loadMenu);

catAllBtn.addEventListener("click", () => {
  activeCategory = "ALL";
  updateCategoryButtons();
  renderMenu();
});

searchInput.addEventListener("input", () => {
  searchText = searchInput.value;
  renderMenu();
});

clearSearchBtn.addEventListener("click", () => {
  searchText = "";
  searchInput.value = "";
  renderMenu();
  searchInput.focus();
});

sortSelect.addEventListener("change", () => {
  sortMode = sortSelect.value;
  renderMenu();
});

// Start
loadMenu();
