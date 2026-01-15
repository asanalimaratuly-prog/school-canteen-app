// Firebase (modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, doc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ✅ ТВОЙ firebaseConfig */
const firebaseConfig = {
  apiKey: "AIzaSyD3SQTDEmr7g8r9VHWX5Q-h4Tfq2d0rRiE",
  authDomain: "ashana-ca8a3.firebaseapp.com",
  projectId: "ashana-ca8a3",
  storageBucket: "ashana-ca8a3.firebasestorage.app",
  messagingSenderId: "1004661503332",
  appId: "1:1004661503332:web:ba12c7e9d25144c3f07671"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI refs
const statusEl = document.getElementById("status");
const authLine = document.getElementById("authLine");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const adminPanel = document.getElementById("adminPanel");
const adminMsg = document.getElementById("adminMsg");
const addDishBtn = document.getElementById("addDishBtn");
const seedBtn = document.getElementById("seedBtn");

const nameRu = document.getElementById("nameRu");
const nameKz = document.getElementById("nameKz");
const priceEl = document.getElementById("price");
const categoryEl = document.getElementById("category");
const availableEl = document.getElementById("available");

const menuEl = document.getElementById("menu");
const menuEmptyEl = document.getElementById("menuEmpty");
const itemsCountEl = document.getElementById("itemsCount");

const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");
const refreshBtn = document.getElementById("refreshBtn");

const cartEmptyEl = document.getElementById("cartEmpty");
const cartListEl = document.getElementById("cartList");
const totalEl = document.getElementById("total");
const classNameEl = document.getElementById("className");
const studentNameEl = document.getElementById("studentName");
const orderBtn = document.getElementById("orderBtn");
const orderMsg = document.getElementById("orderMsg");

const todayEl = document.getElementById("today");

// QR
const qrBtn = document.getElementById("qrBtn");
const qrImg = document.getElementById("qrImg");
const qrLink = document.getElementById("qrLink");
const qrModal = new bootstrap.Modal(document.getElementById("qrModal"));

// State
let MENU = [];
let VIEW = [];
let CART = new Map();
let isAdmin = false;

// Helpers
const fmtMoney = (n) => `${Math.round(Number(n) || 0)}`;
const safe = (s) => String(s ?? "").trim();
const todayStr = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

todayEl.textContent = todayStr();

// ---------- AUTH ----------
async function checkAdmin(uid) {
  const ref = doc(db, "admins", uid);
  const snap = await getDoc(ref);
  return snap.exists();
}

loginBtn.addEventListener("click", async () => {
  try {
    statusEl.textContent = "Вход через Google…";
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка входа. Открой Console (F12).";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    isAdmin = false;
    authLine.textContent = "Не вошли";
    loginBtn.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
    adminPanel.classList.add("d-none");
    return;
  }

  authLine.innerHTML = `Вошли: <b>${user.email}</b> | UID: <span class="mono">${user.uid}</span>`;
  loginBtn.classList.add("d-none");
  logoutBtn.classList.remove("d-none");

  try {
    isAdmin = await checkAdmin(user.uid);
    adminPanel.classList.toggle("d-none", !isAdmin);
    adminMsg.textContent = isAdmin
      ? "Вы админ: можете добавлять блюда."
      : "Вы вошли, но не админ (панель скрыта).";
  } catch (e) {
    console.error(e);
    adminPanel.classList.add("d-none");
    adminMsg.textContent = "Не удалось проверить права админа.";
  }
});

// ---------- FIRESTORE LOAD MENU ----------
async function loadMenu() {
  statusEl.textContent = "Загрузка меню…";
  try {
    const snap = await getDocs(collection(db, "menu"));
    MENU = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => x && x.available !== false);

    statusEl.textContent = "Готово ✅";
    applyFilters();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка загрузки меню. Открой Console (F12).";
  }
}

function applyFilters() {
  const q = safe(searchEl.value).toLowerCase();
  let arr = [...MENU];

  if (q) {
    arr = arr.filter(x => {
      const ru = safe(x.name_ru).toLowerCase();
      const kz = safe(x.name_kz).toLowerCase();
      const cat = safe(x.category).toLowerCase();
      return ru.includes(q) || kz.includes(q) || cat.includes(q);
    });
  }

  const s = sortEl.value;
  if (s === "priceAsc") arr.sort((a,b) => (a.price||0) - (b.price||0));
  if (s === "priceDesc") arr.sort((a,b) => (b.price||0) - (a.price||0));
  if (s === "nameAsc") arr.sort((a,b) => safe(a.name_ru).localeCompare(safe(b.name_ru), "ru"));

  VIEW = arr;
  renderMenu();
}

searchEl.addEventListener("input", applyFilters);
sortEl.addEventListener("change", applyFilters);
refreshBtn.addEventListener("click", loadMenu);

// ---------- RENDER MENU ----------
function renderMenu() {
  menuEl.innerHTML = "";
  itemsCountEl.textContent = String(VIEW.length);
  menuEmptyEl.classList.toggle("d-none", VIEW.length !== 0);

  for (const item of VIEW) {
    const title = safe(item.name_ru) || "Без названия";
    const cat = safe(item.category) || "—";
    const price = fmtMoney(item.price);

    const card = document.createElement("div");
    card.className = "card menu-card card-soft p-3";
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div class="fw-bold">${title}</div>
          <div class="muted small">${cat}</div>
        </div>
        <div class="fw-bold">${price} ₸</div>
      </div>

      <div class="d-flex align-items-center justify-content-between mt-3">
        <button class="btn btn-outline-secondary btn-sm" data-minus>−</button>
        <div class="mono" data-qty>0</div>
        <button class="btn btn-primary btn-sm" data-plus>+</button>
      </div>
    `;

    const qtyEl = card.querySelector("[data-qty]");
    const plusBtn = card.querySelector("[data-plus]");
    const minusBtn = card.querySelector("[data-minus]");

    const updateQty = () => {
      const c = CART.get(item.id);
      qtyEl.textContent = String(c?.qty || 0);
    };

    plusBtn.addEventListener("click", () => {
      const curr = CART.get(item.id) || { item, qty: 0 };
      curr.qty += 1;
      CART.set(item.id, curr);
      updateQty();
      renderCart();
    });

    minusBtn.addEventListener("click", () => {
      const curr = CART.get(item.id);
      if (!curr) return;
      curr.qty -= 1;
      if (curr.qty <= 0) CART.delete(item.id);
      else CART.set(item.id, curr);
      updateQty();
      renderCart();
    });

    updateQty();
    menuEl.appendChild(card);
  }
}

// ---------- CART ----------
function renderCart() {
  const items = [...CART.values()];
  cartListEl.innerHTML = "";
  cartEmptyEl.classList.toggle("d-none", items.length !== 0);

  let total = 0;
  for (const { item, qty } of items) {
    const line = (Number(item.price) || 0) * qty;
    total += line;

    const row = document.createElement("div");
    row.className = "d-flex justify-content-between align-items-center border rounded-3 p-2 bg-white";
    row.innerHTML = `
      <div>
        <div class="fw-bold">${safe(item.name_ru)}</div>
        <div class="muted small">${qty} × ${fmtMoney(item.price)} ₸</div>
      </div>
      <div class="fw-bold">${fmtMoney(line)} ₸</div>
    `;
    cartListEl.appendChild(row);
  }

  totalEl.textContent = fmtMoney(total);
}

// ---------- ORDER ----------
orderBtn.addEventListener("click", async () => {
  orderMsg.textContent = "";
  orderMsg.className = "small mt-2";

  const cls = safe(classNameEl.value);
  const nm = safe(studentNameEl.value);
  const items = [...CART.values()];

  if (items.length === 0) {
    orderMsg.className = "small mt-2 text-danger";
    orderMsg.textContent = "Корзина пуста.";
    return;
  }
  if (!cls || !nm) {
    orderMsg.className = "small mt-2 text-danger";
    orderMsg.textContent = "Введите класс и имя.";
    return;
  }

  const payload = {
    className: cls,
    studentName: nm,
    items: items.map(x => ({
      id: x.item.id,
      name_ru: safe(x.item.name_ru),
      price: Number(x.item.price) || 0,
      qty: x.qty
    })),
    total: Number(totalEl.textContent) || 0,
    createdAt: serverTimestamp(),
    status: "new"
  };

  try {
    orderBtn.disabled = true;
    await addDoc(collection(db, "orders"), payload);

    CART.clear();
    renderCart();

    orderMsg.className = "small mt-2 text-success";
    orderMsg.textContent = "Заказ отправлен ✅";
  } catch (e) {
    console.error(e);
    orderMsg.className = "small mt-2 text-danger";
    orderMsg.textContent = "Ошибка отправки. Открой Console (F12).";
  } finally {
    orderBtn.disabled = false;
  }
});

// ---------- ADMIN ADD MENU ITEM ----------
addDishBtn.addEventListener("click", async () => {
  adminMsg.textContent = "";
  if (!isAdmin) {
    adminMsg.textContent = "Нет прав админа.";
    return;
  }

  const ru = safe(nameRu.value);
  const kz = safe(nameKz.value);
  const price = Number(priceEl.value);
  const cat = safe(categoryEl.value);
  const available = !!availableEl.checked;

  if (!ru || !kz || !cat || !Number.isFinite(price) || price <= 0) {
    adminMsg.textContent = "Заполни RU, KZ, цену и категорию.";
    return;
  }

  try {
    addDishBtn.disabled = true;
    await addDoc(collection(db, "menu"), {
      name_ru: ru,
      name_kz: kz,
      category: cat,
      price,
      available,
      createdAt: serverTimestamp()
    });

    adminMsg.textContent = "Добавлено ✅ Нажми «Обновить меню» или обнови страницу.";
    nameRu.value = "";
    nameKz.value = "";
    priceEl.value = "";
    availableEl.checked = true;

  } catch (e) {
    console.error(e);
    adminMsg.textContent = "Ошибка добавления. Открой Console (F12).";
  } finally {
    addDishBtn.disabled = false;
  }
});

// ---------- ADMIN SEED MENU ----------
seedBtn.addEventListener("click", async () => {
  adminMsg.textContent = "";
  if (!isAdmin) return;

  const samples = [
    { name_ru:"Плов",  name_kz:"Палау", category:"Горячее", price:600, available:true },
    { name_ru:"Компот",name_kz:"Компот", category:"Напитки", price:150, available:true },
    { name_ru:"Самса", name_kz:"Самса",  category:"Выпечка", price:350, available:true }
  ];

  try {
    seedBtn.disabled = true;
    for (const s of samples) {
      await addDoc(collection(db, "menu"), { ...s, createdAt: serverTimestamp() });
    }
    adminMsg.textContent = "Тест-меню добавлено ✅ Нажми «Обновить меню».";
  } catch (e) {
    console.error(e);
    adminMsg.textContent = "Ошибка seed. Открой Console (F12).";
  } finally {
    seedBtn.disabled = false;
  }
});

// ---------- QR ----------
qrBtn.addEventListener("click", () => {
  const url = window.location.href;
  qrLink.textContent = url;
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`;
  qrModal.show();
});

// Start
loadMenu();
renderCart();
