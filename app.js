import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 🔥 ВАШ Firebase config (оставляем как было)
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

// Cart DOM
const cartList = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const orderMsg = document.getElementById("orderMsg");
const classInput = document.getElementById("classInput");
const studentInput = document.getElementById("studentInput");

// State
let allItems = [];
let activeCategory = "ALL";
let searchText = "";
let sortMode = "name_asc";

// cart: { [id]: {id, title, price, qty} }
let cart = {};

// Helpers
function titleOf(i) {
  return (i.name_ru ?? i.name_kz ?? i.name_en ?? "Без названия").toString();
}
function normalize(s) { return s.toLowerCase().trim(); }
function setStatus(text) { statusEl.textContent = text; }
function money(n) { return Number(n ?? 0); }

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

  if (activeCategory !== "ALL") {
    items = items.filter(i => (i.category ?? "").toString().trim() === activeCategory);
  }

  if (searchText) {
    const q = normalize(searchText);
    items = items.filter(i => normalize(titleOf(i)).includes(q));
  }

  items.sort((a, b) => {
    const ta = titleOf(a);
    const tb = titleOf(b);
    const pa = money(a.price);
    const pb = money(b.price);

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

// --- Cart ---
function cartItemsArray() {
  return Object.values(cart);
}
function cartTotal() {
  return cartItemsArray().reduce((s, x) => s + money(x.price) * money(x.qty), 0);
}
function setCartEnabledState() {
  const hasItems = cartItemsArray().length > 0;
  placeOrderBtn.disabled = !hasItems;
}
function addToCart(item) {
  const id = item.id;
  const title = titleOf(item);
  const price = money(item.price);

  if (!cart[id]) cart[id] = { id, title, price, qty: 0 };
  cart[id].qty += 1;

  renderCart();
}
function decFromCart(id) {
  if (!cart[id]) return;
  cart[id].qty -= 1;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
}
function clearCart() {
  cart = {};
  renderCart();
}

function renderCart() {
  const items = cartItemsArray();

  if (items.length === 0) {
    cartList.textContent = "Корзина пуста";
    cartList.className = "small text-secondary mb-2";
  } else {
    cartList.className = "small mb-2";
    cartList.innerHTML = items.map(x => `
      <div class="d-flex align-items-center justify-content-between border-bottom py-1">
        <div class="me-2">
          <div class="fw-semibold">${x.title}</div>
          <div class="text-secondary">${x.price} ₸</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm cart-dec" data-id="${x.id}">−</button>
          <span class="fw-semibold">${x.qty}</span>
          <button class="btn btn-outline-secondary btn-sm cart-inc" data-id="${x.id}">+</button>
        </div>
      </div>
    `).join("");

    cartList.querySelectorAll(".cart-inc").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (cart[id]) { cart[id].qty += 1; renderCart(); }
      });
    });
    cartList.querySelectorAll(".cart-dec").forEach(btn => {
      btn.addEventListener("click", () => decFromCart(btn.dataset.id));
    });
  }

  cartTotalEl.textContent = cartTotal();
  setCartEnabledState();
}

// --- Menu render ---
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
    <div class="col-12 col-md-6">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title mb-1">${titleOf(i)}</h5>
            <span class="badge bg-success">${money(i.price) || "—"} ₸</span>
          </div>
          <div class="text-secondary small mb-3">Категория: ${i.category ?? "-"}</div>

          <button class="btn btn-primary btn-sm w-100 add-btn" data-id="${i.id}">
            <i class="bi bi-plus-circle"></i> Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  `).join("");

  menuEl.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const item = allItems.find(x => x.id === id);
      if (item) addToCart(item);
    });
  });
}

// --- Load menu ---
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

// --- Create order in Firestore ---
async function placeOrder() {
  try {
    orderMsg.textContent = "";
    orderMsg.className = "small mt-2";

    const items = cartItemsArray();
    if (items.length === 0) return;

    const cls = classInput.value.trim() || "—";
    const student = studentInput.value.trim() || "—";

    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Отправка...`;

    const payload = {
      status: "new",          // new | cooking | ready | done | cancelled
      paid: false,
      createdAt: serverTimestamp(),
      studentName: student,
      className: cls,
      items: items.map(x => ({
        menuId: x.id,
        title: x.title,
        price: x.price,
        qty: x.qty,
        sum: money(x.price) * money(x.qty)
      })),
      total: cartTotal()
    };

    const docRef = await addDoc(collection(db, "orders"), payload);

    orderMsg.className = "small mt-2 text-success";
    orderMsg.textContent = `Заказ отправлен ✅ Номер: ${docRef.id}`;

    clearCart();

  } catch (e) {
    console.error(e);
    orderMsg.className = "small mt-2 text-danger";
    orderMsg.textContent = "Ошибка отправки заказа (см. Console)";
  } finally {
    placeOrderBtn.innerHTML = `<i class="bi bi-check2-circle"></i> Оформить заказ`;
    setCartEnabledState();
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

clearCartBtn.addEventListener("click", clearCart);
placeOrderBtn.addEventListener("click", placeOrder);

// Start
renderCart();
loadMenu();
