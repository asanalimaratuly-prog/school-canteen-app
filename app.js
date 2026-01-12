import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore, collection, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ====== 1) ВСТАВЬ СВОЙ firebaseConfig ======
const firebaseConfig = {
  apiKey: "AIzaSyD3SQTDEmr7g8r9VHWX5Q-h4Tfq2d0rRiE",
  authDomain: "ashana-ca8a3.firebaseapp.com",
  projectId: "ashana-ca8a3",
  storageBucket: "ashana-ca8a3.firebasestorage.app",
  messagingSenderId: "1004661503332",
  appId: "1:1004661503332:web:ba12c7e9d25144c3f07671"
};
// ===========================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// ✅ AUTH
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI элементы админки
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const adminInfo = document.getElementById("adminInfo");
const adminForm = document.getElementById("adminForm");
const adminMsg = document.getElementById("adminMsg");

const newNameRu = document.getElementById("newNameRu");
const newNameKz = document.getElementById("newNameKz");
const newPrice  = document.getElementById("newPrice");
const newCategory = document.getElementById("newCategory");
const newAvailable = document.getElementById("newAvailable");
const btnAddMenu = document.getElementById("btnAddMenu");

// кнопки вход/выход
btnLogin?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    adminMsg.textContent = "Ошибка входа. Открой Console (F12).";
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    adminInfo.textContent = `Вошли: ${user.email} | UID: ${user.uid}`;
    btnLogin.style.display = "none";
    btnLogout.style.display = "inline-block";
    adminForm.style.display = "block";
  } else {
    adminInfo.textContent = "Не вошли";
    btnLogin.style.display = "inline-block";
    btnLogout.style.display = "none";
    adminForm.style.display = "none";
    adminMsg.textContent = "";
  }
});

// ✅ добавление блюда
btnAddMenu?.addEventListener("click", async () => {
  try {
    adminMsg.textContent = "Добавляю...";
    const ru = (newNameRu.value || "").trim();
    const kz = (newNameKz.value || "").trim();
    const price = Number(newPrice.value);

    if (!ru || !price) {
      adminMsg.textContent = "Заполни RU и цену.";
      return;
    }

    await addDoc(collection(db, "menu"), {
      name_ru: ru,
      name_kz: kz,
      price: price,
      category: newCategory.value,
      available: !!newAvailable.checked,
      createdAt: serverTimestamp()
    });

    adminMsg.textContent = "✅ Добавлено! Нажми «Обновить меню» (или обнови страницу).";
    newNameRu.value = "";
    newNameKz.value = "";
    newPrice.value = "";

  } catch (e) {
    console.error(e);
    adminMsg.textContent = "❌ Ошибка добавления. Открой Console (F12).";
  }
});

// UI
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const totalEl = document.getElementById("total");
const cartListEl = document.getElementById("cartList");
const cartEmptyEl = document.getElementById("cartEmpty");
const itemsCountEl = document.getElementById("itemsCount");

const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");
const refreshBtn = document.getElementById("refreshBtn");

const classInput = document.getElementById("classInput");
const nameInput = document.getElementById("nameInput");
const orderBtn = document.getElementById("orderBtn");

const todayEl = document.getElementById("today");

// QR
const qrBtn = document.getElementById("qrBtn");
const qrImg = document.getElementById("qrImg");
const siteLink = document.getElementById("siteLink");

const fmtMoney = (n) => Number(n || 0).toLocaleString("ru-RU");

// state
let menuItems = []; // [{id, name, price, category?}]
let cart = new Map(); // id -> {id,name,price,qty}

todayEl.textContent = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

// ====== MENU ======
async function loadMenu() {
  statusEl.textContent = "Загрузка меню…";
  menuEl.innerHTML = "";
  menuItems = [];

  try {
    const snap = await getDocs(collection(db, "menu"));
    snap.forEach((doc) => {
      const d = doc.data();
      // защита от пустых/кривых данных
      const name = (d.name ?? "").toString().trim();
      const price = Number(d.price ?? 0);

      if (!name) return;

      menuItems.push({
        id: doc.id,
        name,
        price,
        category: (d.category ?? "").toString().trim()
      });
    });

    itemsCountEl.textContent = String(menuItems.length);

    statusEl.textContent = menuItems.length ? "Готово ✅" : "Меню пустое (в Firestore нет документов в menu)";
    renderMenu();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка загрузки. Открой Console (F12) и посмотри ошибку.";
    menuEl.innerHTML = `<div class="alert alert-danger">Не удалось загрузить меню.</div>`;
  }
}

function getFilteredSortedMenu() {
  const q = (searchEl.value || "").toLowerCase().trim();

  let arr = menuItems.filter((x) => {
    if (!q) return true;
    return x.name.toLowerCase().includes(q) || (x.category || "").toLowerCase().includes(q);
  });

  const sort = sortEl.value;
  if (sort === "priceAsc") arr.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") arr.sort((a, b) => b.price - a.price);
  if (sort === "nameAsc") arr.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return arr;
}

function renderMenu() {
  const arr = getFilteredSortedMenu();

  if (!arr.length) {
    menuEl.innerHTML = `<div class="alert alert-warning mb-0">Ничего не найдено.</div>`;
    return;
  }

  menuEl.innerHTML = arr.map((item) => {
    const inCart = cart.get(item.id);
    const qty = inCart?.qty ?? 0;

    return `
      <div class="card p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-semibold">${escapeHtml(item.name)}</div>
            <div class="muted small">${escapeHtml(item.category || "Без категории")}</div>
          </div>
          <div class="price">${fmtMoney(item.price)} ₸</div>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary btn-sm" data-action="dec" data-id="${item.id}">−</button>
            <span class="badge text-bg-light qty-badge">${qty}</span>
            <button class="btn btn-outline-secondary btn-sm" data-action="inc" data-id="${item.id}">+</button>
          </div>
          <button class="btn btn-primary btn-sm" data-action="add" data-id="${item.id}">
            Добавить
          </button>
        </div>
      </div>
    `;
  }).join("");

  // обработчики
  menuEl.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const item = menuItems.find((x) => x.id === id);
      if (!item) return;

      if (action === "add" || action === "inc") addToCart(item, 1);
      if (action === "dec") addToCart(item, -1);
    });
  });
}

// ====== CART ======
function addToCart(item, delta) {
  const cur = cart.get(item.id) || { ...item, qty: 0 };
  cur.qty += delta;

  if (cur.qty <= 0) cart.delete(item.id);
  else cart.set(item.id, cur);

  renderCart();
  renderMenu(); // чтобы обновлялись счётчики
}

function renderCart() {
  const items = Array.from(cart.values());

  if (!items.length) {
    cartEmptyEl.style.display = "";
    cartListEl.style.display = "none";
    cartListEl.innerHTML = "";
    totalEl.textContent = "0";
    return;
  }

  cartEmptyEl.style.display = "none";
  cartListEl.style.display = "";
  cartListEl.innerHTML = items.map((x) => `
    <div class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <div class="fw-semibold">${escapeHtml(x.name)}</div>
        <div class="muted small">${fmtMoney(x.price)} ₸ × ${x.qty}</div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" data-cart="dec" data-id="${x.id}">−</button>
        <button class="btn btn-outline-secondary btn-sm" data-cart="inc" data-id="${x.id}">+</button>
      </div>
    </div>
  `).join("");

  cartListEl.querySelectorAll("button[data-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.cart;
      const item = menuItems.find((m) => m.id === id) || cart.get(id);
      if (!item) return;
      addToCart(item, action === "inc" ? 1 : -1);
    });
  });

  const total = items.reduce((sum, x) => sum + (Number(x.price) * Number(x.qty)), 0);
  totalEl.textContent = fmtMoney(total);
}

// ====== ORDER ======
async function submitOrder() {
  const items = Array.from(cart.values());
  if (!items.length) {
    alert("Корзина пуста.");
    return;
  }

  const cls = (classInput.value || "").trim();
  const name = (nameInput.value || "").trim();

  if (!cls || !name) {
    alert("Заполни класс и имя.");
    return;
  }

  const total = items.reduce((sum, x) => sum + (Number(x.price) * Number(x.qty)), 0);

  orderBtn.disabled = true;
  orderBtn.textContent = "Отправка…";

  try {
    await addDoc(collection(db, "orders"), {
      class: cls,
      name,
      items: items.map((x) => ({
        id: x.id,
        name: x.name,
        price: Number(x.price),
        qty: Number(x.qty),
        lineTotal: Number(x.price) * Number(x.qty)
      })),
      total: Number(total),
      status: "new",
      createdAt: serverTimestamp()
    });

    cart.clear();
    renderCart();
    renderMenu();
    alert("Заказ отправлен ✅");
  } catch (e) {
    console.error(e);
    alert("Ошибка отправки заказа. Открой Console (F12).");
  } finally {
    orderBtn.disabled = false;
    orderBtn.textContent = "Оформить заказ";
  }
}

// ====== QR ======
function showQR() {
  const url = window.location.href;
  siteLink.textContent = url;

  // бесплатный генератор QR (как картинка)
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + encodeURIComponent(url);
  qrImg.src = qrUrl;

  const modal = new bootstrap.Modal(document.getElementById("qrModal"));
  modal.show();
}

// ====== helpers ======
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[ch]));
}

// ====== events ======
searchEl.addEventListener("input", renderMenu);
sortEl.addEventListener("change", renderMenu);
refreshBtn.addEventListener("click", loadMenu);
orderBtn.addEventListener("click", submitOrder);
qrBtn.addEventListener("click", showQR);

// старт
loadMenu();
renderCart();
