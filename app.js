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
const countText = document.getElementById("countText");

// State
let allItems = [];
let activeCategory = "ALL";

// Helpers
function getTitle(i) {
  return i.name_ru ?? i.name_kz ?? i.name_en ?? "Без названия";
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderCategories(items) {
  const categories = Array.from(
    new Set(items.map(i => (i.category ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "ru"));

  catBtnsWrap.innerHTML = categories.map(cat => `
    <button type="button"
            class="btn btn-outline-primary btn-sm cat-btn"
            data-cat="${cat}">
      ${cat}
    </button>
  `).join("");

  // обработчик на кнопки категорий
  catBtnsWrap.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      updateCategoryButtons();
      renderMenu();
    });
  });
}

function updateCategoryButtons() {
  // All
  if (activeCategory === "ALL") {
    catAllBtn.classList.remove("btn-outline-primary");
    catAllBtn.classList.add("btn-primary");
  } else {
    catAllBtn.classList.remove("btn-primary");
    catAllBtn.classList.add("btn-outline-primary");
  }

  // Others
  catBtnsWrap.querySelectorAll(".cat-btn").forEach(btn => {
    const isActive = btn.dataset.cat === activeCategory;
    btn.classList.toggle("btn-primary", isActive);
    btn.classList.toggle("btn-outline-primary", !isActive);
  });
}

function getFilteredItems() {
  if (activeCategory === "ALL") return allItems;
  return allItems.filter(i => (i.category ?? "").trim() === activeCategory);
}

function renderMenu() {
  const items = getFilteredItems();

  countText.textContent = `Показано: ${items.length}`;

  if (items.length === 0) {
    menuEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning m-0">Нет блюд в этой категории.</div>
      </div>
    `;
    return;
  }

  menuEl.innerHTML = items.map(i => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title mb-1">${getTitle(i)}</h5>
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

    const q = query(collection(db, "menu"), where("available", "==", true));
    const snap = await getDocs(q);

    if (snap.empty) {
      allItems = [];
      setStatus("Меню пустое");
      catBtnsWrap.innerHTML = "";
      activeCategory = "ALL";
      updateCategoryButtons();
      renderMenu();
      return;
    }

    allItems = [];
    snap.forEach(doc => allItems.push({ id: doc.id, ...doc.data() }));

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

// Start
loadMenu();
