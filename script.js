const state = { products: [], chosen: new Set(), category: "Todos", query: "", pending: null };

// ===== FIREBASE =====
// Cole aqui a configuração do seu projeto Firebase quando for configurar.
// O site funciona em modo local enquanto o Firebase não estiver configurado.
const firebaseConfig = {
  apiKey: "AIzaSyCzUSPmNqX1QiNZYbQ_BDJJ12XdATcQ6uM",
  authDomain: "cha-de-casa-nova-tayna-jean.firebaseapp.com",
  projectId: "cha-de-casa-nova-tayna-jean",
  storageBucket: "cha-de-casa-nova-tayna-jean.firebasestorage.app",
  messagingSenderId: "1037404104306",
  appId: "1:1037404104306:web:d107bc2c72892cd83884eb",
  measurementId: "G-0HVMMEEX8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

let firestore = null;

async function initFirebase() {
  if (FIREBASE_CONFIG.apiKey === "COLE_AQUI") return;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js");
    const { getFirestore, collection, onSnapshot, doc, runTransaction } =
      await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);
    firestore = { db, collection, onSnapshot, doc, runTransaction };

    onSnapshot(collection(db, "giftSelections"), snap => {
      state.chosen = new Set(snap.docs.map(d => d.id));
      render();
    }, err => console.error("Firebase:", err));
  } catch (err) {
    console.error("Não foi possível inicializar o Firebase:", err);
  }
}

async function loadProducts() {
  const response = await fetch("products.json");
  state.products = await response.json();
  buildCategories();
  render();
}

function buildCategories() {
  const cats = ["Todos", ...new Set(state.products.map(p => p.category))];
  document.querySelector("#categories").innerHTML = cats.map(cat =>
    `<button class="category-btn ${cat === state.category ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
  ).join("");
  document.querySelectorAll(".category-btn").forEach(btn => btn.addEventListener("click", () => {
    state.category = btn.dataset.category;
    buildCategories();
    render();
  }));
}

function filteredProducts() {
  const q = state.query.trim().toLowerCase();
  return state.products.filter(p =>
    (state.category === "Todos" || p.category === state.category) &&
    (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  );
}

function render() {
  const grid = document.querySelector("#grid");
  const list = filteredProducts();
  const available = state.products.filter(p => !state.chosen.has(p.id)).length;
  document.querySelector("#availableCount").textContent = available;
  document.querySelector("#status").textContent = `${list.length} presente${list.length === 1 ? "" : "s"} encontrado${list.length === 1 ? "" : "s"}.`;

  if (!list.length) {
    grid.innerHTML = `<div class="empty"><h3>Nenhum presente encontrado.</h3><p>Tente outro nome ou categoria.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const chosen = state.chosen.has(p.id);
    return `<article class="card ${chosen ? "chosen" : ""}">
      <div class="product-image-wrap">
        <img class="product-image" src="${productImage(p)}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.onerror=null;this.src=categoryImage(p.category)">
      </div>
      <div class="card-top">
        <span class="tag">${escapeHtml(p.category)}</span>
        ${chosen ? '<span class="chosen-badge">Já escolhido</span>' : ""}
      </div>
      <h3>${escapeHtml(p.name)}</h3>
      ${p.price ? `<div class="price">R$ ${escapeHtml(p.price)}</div>` : `<div class="price">Preço no anúncio</div>`}
      <div class="actions">
        <a class="btn btn-secondary" href="${escapeAttr(p.url)}" target="_blank" rel="noopener noreferrer">Ver produto</a>
        <button class="btn btn-primary" data-buy="${p.id}" ${chosen ? "disabled" : ""}>${chosen ? "Já escolhido" : "Já comprei"}</button>
      </div>
    </article>`;
  }).join("");

  document.querySelectorAll("[data-buy]").forEach(btn => btn.addEventListener("click", () => openConfirm(btn.dataset.buy)));
}

function openConfirm(id) {
  state.pending = id;
  document.querySelector("#confirmDialog").showModal();
}

async function confirmPurchase() {
  const id = state.pending;
  if (!id) return;
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  if (!firestore) {
    state.chosen.add(id);
    localStorage.setItem("chosenGifts", JSON.stringify([...state.chosen]));
    render();
    closeDialog();
    alert("Presente marcado como escolhido neste navegador. Para sincronizar entre todos os convidados, configure o Firebase conforme o README.");
    return;
  }

  try {
    const { db, doc, runTransaction } = firestore;
    const ref = doc(db, "giftSelections", id);
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (existing.exists()) throw new Error("ALREADY_CHOSEN");
      transaction.set(ref, { chosen: true, chosenAt: new Date().toISOString() });
    });
    closeDialog();
  } catch (err) {
    if (err.message === "ALREADY_CHOSEN") alert("Esse presente acabou de ser escolhido por outra pessoa.");
    else {
      console.error(err);
      alert("Não foi possível registrar agora. Tente novamente.");
    }
  }
}

function closeDialog() {
  document.querySelector("#confirmDialog").close();
  state.pending = null;
}

function productImage(product) {
  const query = encodeURIComponent(`${product.name} ${product.category}`);
  return `https://loremflickr.com/640/480/${query}`;
}

function categoryImage(category) {
  const queries = {
    "Cozinha": "kitchen,cookware",
    "Organização": "home,organization",
    "Limpeza": "cleaning,household",
    "Banheiro": "bathroom,home",
    "Lavanderia": "laundry,home",
    "Quarto": "bedroom,home",
    "Sala": "living-room,home",
    "Eletrodomésticos": "kitchen,appliance"
  };
  return `https://loremflickr.com/640/480/${encodeURIComponent(queries[category] || "home")}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function escapeAttr(value) { return escapeHtml(value); }

document.querySelector("#search").addEventListener("input", e => {
  state.query = e.target.value;
  render();
});
document.querySelector("#confirmBuy").addEventListener("click", confirmPurchase);
document.querySelector("#cancelConfirm").addEventListener("click", closeDialog);
document.querySelector("#closeDialog").addEventListener("click", closeDialog);

try {
  state.chosen = new Set(JSON.parse(localStorage.getItem("chosenGifts") || "[]"));
} catch {}
loadProducts().then(initFirebase);
