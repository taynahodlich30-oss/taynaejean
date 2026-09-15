const state = { products: [], chosen: new Set(), category: "Todos", query: "", pending: null };

// Firebase é opcional. Sem configuração, a lista continua funcionando normalmente.
const FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI", authDomain: "COLE_AQUI", projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI", messagingSenderId: "COLE_AQUI", appId: "COLE_AQUI"
};
let firestore = null;

async function initFirebase() {
  if (FIREBASE_CONFIG.apiKey === "COLE_AQUI") return;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js");
    const { getFirestore, collection, onSnapshot, doc, runTransaction } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);
    firestore = { db, collection, onSnapshot, doc, runTransaction };
    onSnapshot(collection(db, "giftSelections"), snap => {
      state.chosen = new Set(snap.docs.map(d => d.id)); render();
    }, err => console.error("Firebase:", err));
  } catch (err) { console.error("Firebase não inicializado:", err); }
}

async function loadProducts() {
  try {
    const url = new URL("products.json", document.baseURI).href;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`products.json: HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error("products.json vazio");
    state.products = data;
  } catch (err) {
    console.warn("Usando lista integrada porque products.json não carregou:", err);
    state.products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  }
  buildCategories(); render();
}

function buildCategories() {
  const cats = ["Todos", ...new Set(state.products.map(p => p.category))];
  document.querySelector("#categories").innerHTML = cats.map(cat =>
    `<button class="category-btn ${cat === state.category ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
  ).join("");
  document.querySelectorAll(".category-btn").forEach(btn => btn.addEventListener("click", () => {
    state.category = btn.dataset.category; buildCategories(); render();
  }));
}
function filteredProducts() {
  const q = state.query.trim().toLowerCase();
  return state.products.filter(p => (state.category === "Todos" || p.category === state.category) && (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
}
function render() {
  const grid = document.querySelector("#grid"); if (!grid) return;
  const list = filteredProducts();
  const available = state.products.filter(p => !state.chosen.has(p.id)).length;
  document.querySelector("#availableCount").textContent = available;
  document.querySelector("#status").textContent = `${list.length} presente${list.length === 1 ? "" : "s"} encontrado${list.length === 1 ? "" : "s"}.`;
  if (!list.length) { grid.innerHTML = `<div class="empty"><h3>Nenhum presente encontrado.</h3><p>Tente outro nome ou categoria.</p></div>`; return; }
  grid.innerHTML = list.map(p => {
    const chosen = state.chosen.has(p.id);
    const image = p.image || "imagens/presente-001.jpg";
    return `<article class="card ${chosen ? "chosen" : ""}">
      <div class="product-image-wrap"><img class="product-image" src="${escapeAttr(image)}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='imagens/presente-001.jpg'"></div>
      <div class="card-top"><span class="tag">${escapeHtml(p.category)}</span>${chosen ? '<span class="chosen-badge">Já escolhido</span>' : ""}</div>
      <h3>${escapeHtml(p.name)}</h3>
      ${p.price ? `<div class="price">R$ ${escapeHtml(p.price)}</div>` : `<div class="price">Preço no anúncio</div>`}
      <div class="actions"><a class="btn btn-secondary" href="${escapeAttr(p.url)}" target="_blank" rel="noopener noreferrer">Ver produto</a><button class="btn btn-primary" data-buy="${escapeAttr(p.id)}" ${chosen ? "disabled" : ""}>${chosen ? "Já escolhido" : "Já comprei"}</button></div>
    </article>`;
  }).join("");
  document.querySelectorAll("[data-buy]").forEach(btn => btn.addEventListener("click", () => openConfirm(btn.dataset.buy)));
}
function openConfirm(id){ state.pending=id; document.querySelector("#confirmDialog").showModal(); }
async function confirmPurchase(){
  const id=state.pending; if(!id) return; const product=state.products.find(p=>p.id===id); if(!product)return;
  if(!firestore){ state.chosen.add(id); localStorage.setItem("chosenGifts",JSON.stringify([...state.chosen])); render(); closeDialog(); alert("Presente marcado como escolhido neste navegador."); return; }
  try { const {db,doc,runTransaction}=firestore; const ref=doc(db,"giftSelections",id); await runTransaction(db,async t=>{const existing=await t.get(ref);if(existing.exists())throw new Error("ALREADY_CHOSEN");t.set(ref,{chosen:true,chosenAt:new Date().toISOString()});}); closeDialog(); }
  catch(err){ if(err.message==="ALREADY_CHOSEN") alert("Esse presente acabou de ser escolhido por outra pessoa."); else alert("Não foi possível registrar agora. Tente novamente."); }
}
function closeDialog(){ document.querySelector("#confirmDialog").close(); state.pending=null; }
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function escapeAttr(value){return escapeHtml(value);}

document.querySelector("#search").addEventListener("input",e=>{state.query=e.target.value;render();});
document.querySelector("#confirmBuy").addEventListener("click",confirmPurchase);
document.querySelector("#cancelConfirm").addEventListener("click",closeDialog);
document.querySelector("#closeDialog").addEventListener("click",closeDialog);
try { state.chosen=new Set(JSON.parse(localStorage.getItem("chosenGifts")||"[]")); } catch {}
loadProducts().then(initFirebase);
