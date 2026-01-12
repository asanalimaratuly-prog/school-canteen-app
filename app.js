import { initializeApp } from "https://www.gstaticstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstaticstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ===== 1) ВСТАВЬ СВОЙ firebaseConfig (НЕ МЕНЯЯ НАЗВАНИЯ ПОЛЕЙ) =====
const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "..."
};
// ================================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");

// Чтобы видеть ошибку прямо на странице
function showError(title, err) {
  console.error(title, err);
  statusEl.textContent = title;
  menuEl.innerHTML = `
    <div style="padding:12px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:10px;max-width:720px;">
      <b>${title}</b><br/>
      <div style="margin-top:8px;white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:12px;">
        ${String(err?.message || err || "")}
      </div>
      <div style="margin-top:8px;font-size:12px;">
        Открой Console (F12) → вкладка Console и пришли красную строку.
      </div>
    </div>
  `;
}

async function loadMenu() {
  console.log("LOAD MENU START");
  statusEl.textContent = "Загрузка меню...";

  // Таймаут, чтобы не висело вечно
  const timeoutMs = 8000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Таймаут Firestore (8 сек). Проверь интернет / projectId / rules.")), timeoutMs)
  );

  try {
    const q = collection(db, "menu");

    const snap = await Promise.race([getDocs(q), timeoutPromise]);

    if (snap.empty) {
      statusEl.textContent = "Меню пустое (в Firestore нет документов в коллекции menu).";
      menuEl.innerHTML = `
        <div style="padding:12px;border:1px solid #ffeeba;background:#fff3cd;border-radius:10px;max-width:720px;">
          <b>Коллекция menu пустая</b><br/>
          Добавь документ: Firestore → Data → Start collection → <code>menu</code><br/>
          Поля: <code>name</code> (строка), <code>price</code> (число)
        </div>
      `;
      return;
    }

    const items = [];
    snap.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        name: d.name ?? d.name_ru ?? "Без названия",
        price: d.price ?? 0,
      });
    });

    statusEl.textContent = "Готово ✅";
    menuEl.innerHTML = items
      .map(
        (i) => `
        <div style="padding:10px 0;border-bottom:1px solid #eee;max-width:720px;">
          <b>${i.name}</b>
          <span style="float:right">${i.price} ₸</span>
        </div>
      `
      )
      .join("");

    console.log("LOAD MENU OK:", items.length);
  } catch (e) {
    showError("Ошибка загрузки меню", e);
  }
}

loadMenu();
