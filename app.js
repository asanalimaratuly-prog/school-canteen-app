import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 🔐 Firebase config (ТВОЙ, уже правильный)
const firebaseConfig = {
  apiKey: "AIzaSyD3SQTDEmr7g8r9VHWX5Q-h4Tfq2d0rRiE",
  authDomain: "ashana-ca83.firebaseapp.com",
  projectId: "ashana-ca83",
  storageBucket: "ashana-ca83.appspot.com",
  messagingSenderId: "1004661503332",
  appId: "1:1004661503332:web:ba12c7e9d25144c3f07671"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");

async function loadMenu() {
  try {
    console.log("LOAD MENU START");
    const snap = await getDocs(collection(db, "menu"));

    if (snap.empty) {
      statusEl.textContent = "Меню пустое";
      return;
    }

    statusEl.textContent = "Готово ✅";
    menuEl.innerHTML = "";

    snap.forEach(doc => {
      const item = doc.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${item.name} — ${item.price} ₸`;
      menuEl.appendChild(li);
    });

  } catch (e) {
    console.error(e);
    statusEl.textContent = "Ошибка загрузки меню";
  }
}

loadMenu();
