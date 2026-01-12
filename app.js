import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3SQTDem7g8r9VHWX5Q-h4Tfq2d0rRiE",
  authDomain: "ashana-ca83.firebaseapp.com",
  projectId: "ashana-ca83",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const menuEl = document.getElementById("menu");
const cartList = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const orderMsg = document.getElementById("orderMsg");
const classInput = document.getElementById("classInput");
const studentInput = document.getElementById("studentInput");
const qrLink = document.getElementById("qrLink");

qrLink.href = window.location.href;

let cart = {};
let total = 0;

async function loadMenu() {
  const snap = await getDocs(collection(db, "menu"));
  menuEl.innerHTML = "";

  snap.forEach(doc => {
    const i = doc.data();
    menuEl.innerHTML += `
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5>${i.name_ru}</h5>
            <p>${i.price} ₸</p>
            <button class="btn btn-primary btn-sm"
              onclick="addToCart('${doc.id}','${i.name_ru}',${i.price})">
              В корзину
            </button>
          </div>
        </div>
      </div>`;
  });
}

window.addToCart = (id, name, price) => {
  if (!cart[id]) cart[id] = { name, price, qty: 0 };
  cart[id].qty++;
  renderCart();
};

function renderCart() {
  cartList.innerHTML = "";
  total = 0;

  Object.values(cart).forEach(i => {
    total += i.price * i.qty;
    cartList.innerHTML += `<div>${i.name} x ${i.qty}</div>`;
  });

  cartTotalEl.textContent = total;
  placeOrderBtn.disabled = total === 0;
}

placeOrderBtn.onclick = async () => {
  await addDoc(collection(db, "orders"), {
    className: classInput.value,
    studentName: studentInput.value,
    total,
    cart,
    createdAt: serverTimestamp()
  });

  orderMsg.textContent = "Заказ отправлен ✅";
  cart = {};
  renderCart();
};

loadMenu();
