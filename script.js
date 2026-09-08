/* =========================================================
   Stockwell — script.js
   Catalog (live API + offline fallback), basket with
   localStorage, filtering/search/sort, contact & newsletter
   validation, notes carousel, and header/basket UI.
   ========================================================= */

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function formatCategory(cat) {
  if (!cat) return '';
  return cat.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}

// Generates a simple flat-colour placeholder tile so the catalog
// never shows a broken image, even fully offline.
function placeholderImage(title, category) {
  const palette = {
    'electronics': ['#2E4A38', '#3D6249'],
    'jewelery': ['#A9812E', '#8f6c22'],
    "men's clothing": ['#232A20', '#3a4535'],
    "women's clothing": ['#B23A2E', '#8F2D23'],
  };
  const [bg, fg] = palette[category] || ['#5B5F52', '#232A20'];
  const initial = (title || '?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <rect width="300" height="300" fill="${bg}"/>
    <circle cx="150" cy="150" r="90" fill="${fg}" opacity="0.5"/>
    <text x="150" y="172" font-family="Bitter, serif" font-weight="800" font-size="90" fill="#F1EAD6" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ---------- Offline fallback catalog ---------- */
const FALLBACK_PRODUCTS = [
  { id: 1001, title: 'Wireless Noise-Cancelling Headphones', price: 89.99, category: 'electronics', rating: { rate: 4.5, count: 230 } },
  { id: 1002, title: 'Smart Fitness Watch', price: 59.99, category: 'electronics', rating: { rate: 4.2, count: 185 } },
  { id: 1003, title: 'Portable Bluetooth Speaker', price: 34.99, category: 'electronics', rating: { rate: 4.6, count: 310 } },
  { id: 1004, title: 'Sterling Silver Hoop Earrings', price: 24.99, category: 'jewelery', rating: { rate: 4.7, count: 98 } },
  { id: 1005, title: 'Minimalist Gold-Plated Necklace', price: 19.99, category: 'jewelery', rating: { rate: 4.4, count: 140 } },
  { id: 1006, title: 'Classic Leather Strap Watch', price: 45.00, category: 'jewelery', rating: { rate: 4.3, count: 76 } },
  { id: 1007, title: 'Classic Fit Denim Jacket', price: 54.99, category: "men's clothing", rating: { rate: 4.1, count: 210 } },
  { id: 1008, title: 'Premium Cotton T-Shirt (3-Pack)', price: 29.99, category: "men's clothing", rating: { rate: 4.5, count: 402 } },
  { id: 1009, title: 'Slim Fit Chino Trousers', price: 39.99, category: "men's clothing", rating: { rate: 4.0, count: 156 } },
  { id: 1010, title: 'Floral Summer Maxi Dress', price: 42.50, category: "women's clothing", rating: { rate: 4.6, count: 289 } },
  { id: 1011, title: 'High-Waist Yoga Leggings', price: 27.99, category: "women's clothing", rating: { rate: 4.8, count: 512 } },
  { id: 1012, title: 'Oversized Knit Cardigan', price: 37.99, category: "women's clothing", rating: { rate: 4.3, count: 167 } },
];

/* ---------- State ---------- */
let allProducts = [];
let categories = ['all'];
let currentFilters = { category: 'all', search: '', sort: 'default' };

let basket = [];
try { basket = JSON.parse(localStorage.getItem('stockwell_basket')) || []; } catch { basket = []; }

/* ---------- Catalog: load, filter, render ---------- */
async function loadProducts() {
  showSkeletons(8);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch('https://fakestoreapi.com/products', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API responded with ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty catalog response');
    allProducts = data;
  } catch (err) {
    console.warn('Stockwell: live catalog unavailable, using offline stock instead.', err);
    allProducts = FALLBACK_PRODUCTS;
  }
  const uniqueCats = [...new Set(allProducts.map((p) => p.category))].sort();
  categories = ['all', ...uniqueCats];
  renderCategoryTabs();
  applyFiltersAndRender();
}

function renderCategoryTabs() {
  const container = $('#categoryTabs');
  container.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (cat === currentFilters.category ? ' active' : '');
    btn.textContent = cat === 'all' ? 'All departments' : formatCategory(cat);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      currentFilters.category = cat;
      $$('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      applyFiltersAndRender();
    });
    container.appendChild(btn);
  });
}

function applyFiltersAndRender() {
  let result = [...allProducts];
  if (currentFilters.category !== 'all') {
    result = result.filter((p) => p.category === currentFilters.category);
  }
  if (currentFilters.search.trim()) {
    const q = currentFilters.search.trim().toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(q));
  }
  switch (currentFilters.sort) {
    case 'price-asc': result.sort((a, b) => a.price - b.price); break;
    case 'price-desc': result.sort((a, b) => b.price - a.price); break;
    case 'rating-desc': result.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0)); break;
    case 'name-asc': result.sort((a, b) => a.title.localeCompare(b.title)); break;
    default: break;
  }
  renderProducts(result);
}

function showSkeletons(count = 8) {
  const grid = $('#productGrid');
  grid.innerHTML = '';
  $('#emptyState').hidden = true;
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `<div class="skeleton-media"></div><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div>`;
    grid.appendChild(card);
  }
}

function renderProducts(products) {
  const grid = $('#productGrid');
  const empty = $('#emptyState');
  grid.innerHTML = '';
  if (products.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  const fragment = document.createDocumentFragment();
  products.forEach((p) => fragment.appendChild(createProductCard(p)));
  grid.appendChild(fragment);
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  const imgSrc = product.image || placeholderImage(product.title, product.category);
  const rate = product.rating?.rate ?? 4.0;
  const count = product.rating?.count ?? 0;

  card.innerHTML = `
    <div class="product-media">
      <img src="${imgSrc}" alt="${escapeHtml(product.title)}" loading="lazy">
    </div>
    <span class="product-card__tag mono">${escapeHtml(formatCategory(product.category))}</span>
    <div class="product-card__body">
      <h3 class="product-card__title">${escapeHtml(product.title)}</h3>
      <span class="product-card__rating mono">${rate.toFixed(1)} · ${count} notes</span>
      <div class="product-card__meta">
        <span class="product-card__price">${money(product.price)}</span>
        <button class="product-card__add" type="button">Add</button>
      </div>
    </div>
  `;

  card.querySelector('img').addEventListener('error', function onErr() {
    this.src = placeholderImage(product.title, product.category);
    this.removeEventListener('error', onErr);
  });
  card.querySelector('.product-card__add').addEventListener('click', () => addToBasket(product));

  return card;
}

/* ---------- Basket ---------- */
function saveBasket() {
  localStorage.setItem('stockwell_basket', JSON.stringify(basket));
}

function addToBasket(product) {
  const imgSrc = product.image || placeholderImage(product.title, product.category);
  const existing = basket.find((i) => i.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    basket.push({ id: product.id, title: product.title, price: product.price, image: imgSrc, quantity: 1 });
  }
  saveBasket();
  renderBasket();
  updateBasketCount();
  showToast(`Added — ${truncate(product.title, 34)}`);
  openBasket();
}

function updateQty(id, delta) {
  const item = basket.find((i) => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) basket = basket.filter((i) => i.id !== id);
  saveBasket();
  renderBasket();
  updateBasketCount();
}

function removeFromBasket(id) {
  basket = basket.filter((i) => i.id !== id);
  saveBasket();
  renderBasket();
  updateBasketCount();
  showToast('Removed from basket');
}

function getBasketTotal() {
  return basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateBasketCount() {
  const count = basket.reduce((sum, i) => sum + i.quantity, 0);
  const el = $('#basketCount');
  el.textContent = count;
  el.style.display = count > 0 ? 'flex' : 'none';
}

function renderBasket() {
  const container = $('#basketItems');
  const totalEl = $('#basketTotal');
  if (basket.length === 0) {
    container.innerHTML = `<p class="basket-empty">Your basket is empty. Head to the catalog and add something worth keeping.</p>`;
    totalEl.textContent = money(0);
    return;
  }
  container.innerHTML = basket.map((item) => `
    <div class="basket-item" data-id="${item.id}">
      <img src="${item.image}" alt="${escapeHtml(item.title)}">
      <div class="basket-item__main">
        <div class="basket-item__row">
          <span class="basket-item__name">${escapeHtml(item.title)}</span>
          <span class="basket-item__leader"></span>
          <span class="basket-item__price mono">${money(item.price * item.quantity)}</span>
        </div>
        <div class="basket-item__controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="basket-item__qty">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
          <button class="basket-item__remove" data-id="${item.id}" type="button">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  totalEl.textContent = money(getBasketTotal());

  container.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      updateQty(id, btn.dataset.action === 'inc' ? 1 : -1);
    });
  });
  container.querySelectorAll('.basket-item__remove').forEach((btn) => {
    btn.addEventListener('click', () => removeFromBasket(Number(btn.dataset.id)));
  });
}

function openBasket() {
  $('#basket').classList.add('open');
  $('#scrim').classList.add('show');
  document.body.classList.add('no-scroll');
}
function closeBasket() {
  $('#basket').classList.remove('open');
  $('#scrim').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

/* ---------- Toasts ---------- */
function showToast(message, type = 'ok', duration = 3200) {
  const stack = $('#toastStack');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'err' ? ' err' : '');
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---------- Notes (testimonials) carousel ---------- */
const NOTES = [
  { quote: 'Ordered a watch strap on Tuesday, had it by Thursday. No account needed, no upsell emails after — just the thing I ordered.', name: 'R. Adeyemi' },
  { quote: "The catalog search actually works the way you'd want it to. Found a jacket by typing half the name and the right size was still in stock.", name: 'M. Okafor' },
  { quote: "Called about a wrong size and someone who'd clearly used the site themselves picked up. Swapped within the week.", name: 'L. Bianchi' },
  { quote: "I've bought from four different departments now — headphones, a necklace, two jackets — and the pricing's been honest every time.", name: 'J. Park' },
  { quote: "Basket remembered what I'd added even after I closed the tab by accident. Small thing, saved me from starting over.", name: 'S. Kaur' },
];
let noteIndex = 0;
let noteTimer = null;

function renderNotes() {
  const track = $('#notesTrackInner');
  const dots = $('#notesDots');
  track.innerHTML = NOTES.map((n) => `
    <div class="note-card">
      <blockquote>“${escapeHtml(n.quote)}”</blockquote>
      <cite>— ${escapeHtml(n.name)}</cite>
    </div>
  `).join('');
  dots.innerHTML = NOTES.map((_, i) => `<button data-i="${i}" aria-label="Note ${i + 1}"></button>`).join('');
  dots.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => goToNote(Number(btn.dataset.i))));
  updateNotePosition();
}
function updateNotePosition() {
  $('#notesTrackInner').style.transform = `translateX(-${noteIndex * 100}%)`;
  $$('#notesDots button').forEach((d, i) => d.classList.toggle('active', i === noteIndex));
}
function goToNote(i) {
  noteIndex = (i + NOTES.length) % NOTES.length;
  updateNotePosition();
}
function startNoteAutoplay() {
  noteTimer = setInterval(() => goToNote(noteIndex + 1), 6000);
}

/* ---------- Forms ---------- */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showFieldError(inputId, msg) {
  const err = $(`#${inputId}Error`);
  const input = $(`#${inputId}`);
  if (err) err.textContent = msg;
  if (input) input.classList.add('err');
}
function clearFieldErrors() {
  $$('.field__error').forEach((e) => (e.textContent = ''));
  $$('.ledger-form input, .ledger-form textarea').forEach((e) => e.classList.remove('err'));
}

function validateContactForm() {
  clearFieldErrors();
  let valid = true;
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  const subject = $('#subject').value.trim();
  const message = $('#message').value.trim();

  if (!name) { showFieldError('name', 'Enter your name'); valid = false; }
  if (!email) { showFieldError('email', 'Enter your email'); valid = false; }
  else if (!isValidEmail(email)) { showFieldError('email', 'Enter a valid email address'); valid = false; }
  if (!subject) { showFieldError('subject', 'Enter a subject'); valid = false; }
  if (!message) { showFieldError('message', 'Enter a message'); valid = false; }
  else if (message.length < 10) { showFieldError('message', 'Message should be at least 10 characters'); valid = false; }

  return valid;
}

/* ---------- Wiring ---------- */
function initHeader() {
  const searchToggle = $('#searchToggle');
  const searchPanel = $('#searchPanel');
  searchToggle.addEventListener('click', () => {
    const open = searchPanel.classList.toggle('open');
    if (open) setTimeout(() => $('#searchInput').focus(), 150);
  });

  let searchDebounce;
  $('#searchInput').addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentFilters.search = e.target.value;
      applyFiltersAndRender();
    }, 250);
  });

  $('#sortSelect').addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    applyFiltersAndRender();
  });

  const menuToggle = $('#menuToggle');
  const siteNav = $('#siteNav');
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    siteNav.classList.toggle('open');
  });
  $$('#siteNav a').forEach((a) => a.addEventListener('click', () => siteNav.classList.remove('open')));
  document.addEventListener('click', (e) => {
    if (siteNav.classList.contains('open') && !siteNav.contains(e.target) && !menuToggle.contains(e.target)) {
      siteNav.classList.remove('open');
    }
  });

  $('#basketToggle').addEventListener('click', openBasket);
  $('#basketClose').addEventListener('click', closeBasket);
  $('#scrim').addEventListener('click', closeBasket);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBasket();
      siteNav.classList.remove('open');
      searchPanel.classList.remove('open');
    }
  });

  $$('.cat-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.category = link.dataset.cat;
      renderCategoryTabs();
      applyFiltersAndRender();
      $('#catalog').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initBasket() {
  $('#checkoutBtn').addEventListener('click', () => {
    if (basket.length === 0) {
      showToast('Your basket is empty', 'err');
      return;
    }
    const total = getBasketTotal();
    basket = [];
    saveBasket();
    renderBasket();
    updateBasketCount();
    closeBasket();
    showToast(`Order placed. Total ${money(total)}. Confirmation sent.`);
  });
}

function initNotes() {
  renderNotes();
  $('#notePrev').addEventListener('click', () => goToNote(noteIndex - 1));
  $('#noteNext').addEventListener('click', () => goToNote(noteIndex + 1));
  startNoteAutoplay();
  const wrap = $('.notes__wrap');
  wrap.addEventListener('mouseenter', () => clearInterval(noteTimer));
  wrap.addEventListener('mouseleave', startNoteAutoplay);
}

function initForms() {
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateContactForm()) {
      showToast("Message sent. We'll reply within a day.");
      e.target.reset();
      clearFieldErrors();
    } else {
      showToast('Check the highlighted fields', 'err');
    }
  });

  $('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#newsletterEmail');
    if (!isValidEmail(input.value.trim())) {
      showToast('Enter a valid email address', 'err');
      return;
    }
    showToast("You're on the list.");
    input.value = '';
  });
}

/* ---------- Init ---------- */
function init() {
  $('#year').textContent = new Date().getFullYear();
  initHeader();
  initBasket();
  initNotes();
  initForms();
  updateBasketCount();
  renderBasket();
  loadProducts();
}
init();
