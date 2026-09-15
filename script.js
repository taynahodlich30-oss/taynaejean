const state = { products: [], chosen: new Set(), category: "Todos", query: "", pending: null };

function loadProducts() {
  // Usa os produtos incorporados no próprio site. Assim o GitHub Pages
  // não precisa carregar products.json e não ocorre o problema de "0 disponíveis".
  state.products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  buildCategories();
  render();
}

function buildCategories() {
  const cats = ["Todos", ...new Set(state.products.map(p => p.category).filter(Boolean))];
  const el = document.querySelector("#categories");
  el.innerHTML = cats.map(cat =>
    `<button class="category-btn ${cat === state.category ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
  ).join("");
  el.querySelectorAll(".category-btn").forEach(btn => btn.addEventListener("click", () => {
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
    const image = `imagens/${p.id}.jpg`;
    return `<article class="card ${chosen ? "chosen" : ""}">
      <div class="product-image-wrap"><img class="product-image" src="${image}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='imagens/presente-001.jpg'"></div>
      <div class="card-top"><span class="tag">${escapeHtml(p.category)}</span>${chosen ? '<span class="chosen-badge">Já escolhido</span>' : ""}</div>
      <h3>${escapeHtml(p.name)}</h3>
      ${p.price ? `<div class="price">R$ ${escapeHtml(p.price)}</div>` : `<div class="price">Preço no anúncio</div>`}
      <div class="actions">
        <a class="btn btn-secondary" href="${escapeAttr(p.url)}" target="_blank" rel="noopener noreferrer">Ver produto</a>
        <button class="btn btn-primary" data-buy="${escapeAttr(p.id)}" ${chosen ? "disabled" : ""}>${chosen ? "Já escolhido" : "Já comprei"}</button>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll("[data-buy]").forEach(btn => btn.addEventListener("click", () => openConfirm(btn.dataset.buy)));
}

function openConfirm(id) {
  state.pending = id;
  document.querySelector("#confirmDialog").showModal();
}

function closeDialog() {
  document.querySelector("#confirmDialog").close();
  state.pending = null;
}

function confirmPurchase() {
  const id = state.pending;
  if (!id) return;
  state.chosen.add(id);
  localStorage.setItem("chosenGifts", JSON.stringify([...state.chosen]));
  render();
  closeDialog();
  alert("Presente marcado como escolhido neste navegador.");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function escapeAttr(value) { return escapeHtml(value); }

document.querySelector("#search").addEventListener("input", e => { state.query = e.target.value; render(); });
document.querySelector("#confirmBuy").addEventListener("click", confirmPurchase);
document.querySelector("#cancelConfirm").addEventListener("click", closeDialog);
document.querySelector("#closeDialog").addEventListener("click", closeDialog);

try { state.chosen = new Set(JSON.parse(localStorage.getItem("chosenGifts") || "[]")); } catch (_) {}
loadProducts();
