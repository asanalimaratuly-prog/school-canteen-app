import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ✅ ВСТАВЬ СВОЙ firebaseConfig
npm install firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UI
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const adminInfo = document.getElementById("adminInfo");
const adminForm = document.getElementById("adminForm");
const adminMsg = document.getElementById("adminMsg");

const newNameRu = document.getElementById("newNameRu");
const newNameKz = document.getElementById("newNameKz");
const newPrice = document.getElementById("newPrice");
const newCategory = document.getElementById("newCategory");
const newAvailable = document.getElementById("newAvailable");
const btnAddMenu = document.getElementById("btnAddMenu");

const refreshBtn = document.getElementById("refreshBtn");

// Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

btnLogin?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    adminMsg.textContent = "Ошибка входа (см. Console F12)";
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    adminInfo.textContent = `Вошли: ${user.email}`;
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

// Загрузка меню
async function loadMenu() {
  try {
    statusEl.textContent = "Загрузка меню...";
    menuEl.innerHTML = "";

    const snap = await getDocs(collection(db, "menu"));

    if (snap.empty) {
      statusEl.textContent = "Меню пустое";
      menuEl.innerHTML = `<div class="alert alert-warning">Нет блюд</div>`;
      return;
    }

    statusEl.textContent = "Готово ✅";
    const items = [];
    snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));

    menuEl.innerHTML = items.map((i) => `
      <div class="card p-3 mb-2">
        <div class="fw-bold">${i.name_ru ?? "Без названия"}</div>
        <div class="text-muted small">${i.category ?? ""}</div>
        <div class="mt-2"><b>${i.price ?? 0} ₸</b></div>
      </div>
    `).join("");

  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка загрузки меню (см. Console F12)";
  }
}

refreshBtn?.addEventListener("click", loadMenu);

// Добавить блюдо
btnAddMenu?.addEventListener("click", async () => {
  try {
    adminMsg.textContent = "Добавляю...";

    const ru = (newNameRu.value || "").trim();
    const kz = (newNameKz.value || "").trim();
    const price = Number(newPrice.value || 0);
    const category = newCategory.value || "Горячее";
    const available = !!newAvailable.checked;

    if (!ru || price <= 0) {
      adminMsg.textContent = "Заполни RU и цену";
      return;
    }

    await addDoc(collection(db, "menu"), {
      name_ru: ru,
      name_kz: kz,
      price,
      category,
      available,
      createdAt: serverTimestamp()
    });

    adminMsg.textContent = "✅ Добавлено! Нажми «Обновить меню».";
    newNameRu.value = "";
    newNameKz.value = "";
    newPrice.value = "";

  } catch (e) {
    console.error(e);
    adminMsg.textContent = "❌ Нет прав / ошибка (см. Console F12)";
  }
});

// Старт
loadMenu();
