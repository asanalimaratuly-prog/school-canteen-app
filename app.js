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
  try {
    statusEl.textContent = "Загрузка меню...";
    menuEl.innerHTML = "";

    // Берём ВСЕ блюда без фильтра where()
    const snap = await getDocs(collection(db, "menu"));

    const items = [];
    snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));

    // ✅ выбранная дата (как на кнопке/бейдже)
    // Если в коде у тебя уже есть переменная выбранной даты — оставь её.
    // Иначе берём текст из элемента даты (если он есть).
    const selectedDay =
      (document.getElementById("dayBadge")?.textContent || "").trim() || "";

    // ✅ Показываем:
    // - те, у кого day совпадает с выбранной датой
    // - ИЛИ те, у кого day вообще не задан (старые документы)
    let filtered = items.filter((i) => {
      if (i.available === false) return false;
      if (!selectedDay) return true;
      if (!i.day) return true;             // старые документы без day показываем
      return i.day === selectedDay;         // новые с day — по совпадению
    });

    // Поиск
    const q = (searchEl?.value || "").toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((i) =>
        String(i.name_ru || i.name_kz || "").toLowerCase().includes(q)
      );
    }

    // Сортировка
    const sort = sortEl?.value || "default";
    if (sort === "price_asc") filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price_desc") filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "name") filtered.sort((a, b) => String(a.name_ru || "").localeCompare(String(b.name_ru || ""), "ru"));

    if (!filtered.length) {
      statusEl.textContent = "Меню пустое (в Firestore нет документов в menu)";
      menuEl.innerHTML = `<div class="alert alert-warning mb-0">Ничего не найдено.</div>`;
      return;
    }

    statusEl.textContent = "Готово ✅";

    // Рендер карточек
    menuEl.innerHTML = filtered.map((i) => `
      <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
        <div>
          <div class="fw-bold">${i.name_ru ?? "Без названия"}</div>
          <div class="text-muted small">${i.category ?? ""} ${i.name_kz ? "• " + i.name_kz : ""}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="fw-bold">${i.price ?? 0} ₸</div>
          <button class="btn btn-sm btn-success" data-add="${i.id}">+</button>
        </div>
      </div>
    `).join("");

    // навешиваем кнопки +
    menuEl.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => addToCart(btn.dataset.add));
    });

  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка загрузки. Открой Console (F12) и посмотри ошибку.";
  }
}

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
