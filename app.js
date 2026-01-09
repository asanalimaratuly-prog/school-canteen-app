import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 🔥 ВАШ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD3SQTDem7g8r9VHWX5Q-h4Tfq2d0rRiE",
  authDomain: "ashana-ca83.firebaseapp.com",
  projectId: "ashana-ca83",
  storageBucket: "ashana-ca83.firebasestorage.app",
  messagingSenderId: "1004661503332",
  appId: "1:1004661503332:web:ba12c7e9d25144c3f07671"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const refreshBtn = document.getElementById("refreshBtn");

// Загрузка меню
async function loadMenu() {
  try {
    statusEl.textContent = "Загружаем меню...";
    menuEl.innerHTML = "";

    const q = query(
      collection(db, "menu"),
      where("available", "==", true)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      statusEl.textContent = "Меню пустое";
      return;
    }

    const items = [];
    snap.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    menuEl.innerHTML = items.map(i => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title mb-1">
                ${i.name_ru ?? i.name_kz ?? i.name_en ?? "Без названия"}
              </h5>
              <span class="badge bg-success">
                ${i.price ?? "—"} ₸
              </span>
            </div>
            <div class="text-secondary small">
              Категория: ${i.category ?? "-"}
            </div>
          </div>
        </div>
      </div>
    `).join("");

    statusEl.innerHTML = `Готово <span class="text-success">✔</span>`;
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка загрузки (см. Console)";
  }
}

// Кнопка обновления
refreshBtn.addEventListener("click", loadMenu);

// Старт
loadMenu();
