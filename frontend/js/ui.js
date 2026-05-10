// This handles Document Object Model (DOM) rendering functions

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = 'default') {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.className = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Confirmation Dialog ───────────────────────────────────────
let activeConfirmResolve = null;

function requestConfirmation({
  kicker = 'Confirm',
  title = 'Are you sure?',
  message = 'Please confirm this action.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
} = {}) {
  const overlay = document.getElementById('confirmOverlay');
  const kickerEl = document.getElementById('confirmKicker');
  const titleEl = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  const cancelBtn = document.getElementById('confirmCancelBtn');
  const acceptBtn = document.getElementById('confirmAcceptBtn');

  if (!overlay || !cancelBtn || !acceptBtn) {
    return Promise.resolve(window.confirm(message));
  }

  if (activeConfirmResolve) activeConfirmResolve(false);

  kickerEl.textContent = kicker;
  titleEl.textContent = title;
  messageEl.textContent = message;
  cancelBtn.textContent = cancelText;
  acceptBtn.textContent = confirmText;
  acceptBtn.classList.toggle('danger', danger);

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  cancelBtn.focus();

  return new Promise(resolve => {
    activeConfirmResolve = resolve;
  });
}

function closeConfirmation(result = false) {
  const overlay = document.getElementById('confirmOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (activeConfirmResolve) {
    const resolve = activeConfirmResolve;
    activeConfirmResolve = null;
    resolve(result);
  }
}

// ── Skeletons ─────────────────────────────────────────────────
function renderSkeletons(count = 8) {
  document.getElementById('productGrid').innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-cover"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>`).join('');
}

// ── Filter Sidebar ────────────────────────────────────────────
/**
 * Build the category + genre sidebar.
 * @param {Array}  categories  - from /api/products/categories
 * @param {Object} activeFilter - { categoryId, genreId }
 * @param {Function} onCategoryClick
 * @param {Function} onGenreClick
 */
function renderSidebar(categories, activeFilter, onCategoryClick, onGenreClick) {
  const body = document.getElementById('sidebarBody');

  body.innerHTML = categories.map(cat => {
    const isCatActive = activeFilter.categoryId === cat.id;
    const isOpen = isCatActive || cat.genres.some(g => activeFilter.genreId === g.id);

    return `
      <div class="cat-group">
        <button
          class="cat-btn ${isCatActive && !activeFilter.genreId ? 'active' : ''} ${isOpen ? 'open' : ''}"
          onclick="handleCategoryClick(${cat.id}, '${cat.slug}', this)"
          data-cat-id="${cat.id}"
        >
          <span class="cat-dot" style="background:${catColor(cat.slug)}"></span>
          ${escHtml(displayCategoryName(cat.name))}
          <span class="cat-chevron">▼</span>
        </button>
        <div class="genre-list ${isOpen ? 'open' : ''}" id="genreList_${cat.id}">
          ${cat.genres.map(g => `
            <button
              class="genre-btn ${activeFilter.genreId === g.id ? 'active' : ''}"
              onclick="handleGenreClick(${cat.id}, ${g.id}, '${g.name}', this)"
              data-genre-id="${g.id}"
            >${escHtml(g.name)}</button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderViewControls(mode = 'grid') {
  ['grid', 'shelf', 'compact', 'spotlight'].forEach(name => {
    document.getElementById(`${name}ViewBtn`)?.classList.toggle('active', mode === name);
  });
}

function renderEditorialShelves({
  byRating = [],
  recent = [],
  newArrivals = [],
  trendingManga = [],
  awardWinners = [],
  darkAcademia = [],
  continueShopping = [],
} = {}) {
  const el = document.getElementById('editorialShelves');
  if (!el) return;
  const shelves = [
    { title: 'For you', label: 'Continue shopping', items: continueShopping, action: "applyCollection('continue')" },
    { title: 'Staff picks', label: 'Critic shelf', items: byRating, action: "applyCollection('rating')" },
    { title: 'New arrivals', label: 'Fresh in', items: newArrivals, action: "handleSortChange('newest');document.getElementById('sectionHeadingText').scrollIntoView({behavior:'smooth'})" },
  ].filter(shelf => shelf.items.length).slice(0, 3);

  if (!shelves.length) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = shelves.map(shelf => `
    <article class="editorial-card">
      <div class="editorial-copy">
        <span>${escHtml(shelf.label)}</span>
        <h2>${escHtml(shelf.title)}</h2>
        ${shelf.action ? `<button onclick="${shelf.action}">Open shelf</button>` : '<button onclick="openCommandPalette()">Find more</button>'}
      </div>
      <div class="editorial-stack">
        ${shelf.items.slice(0, 4).map((item, index) => `
          <button class="editorial-book" style="--i:${index}" onclick="openModal(${item.id})" aria-label="Open ${escHtml(item.title)}">
            <img src="${escHtml(cleanImageUrl(item.image_url))}" alt="${escHtml(item.title)}" onerror="this.onerror=null;this.src='images/placeholder.svg'" />
          </button>
        `).join('')}
      </div>
    </article>
  `).join('');
}

// Update the active filter pill shown above the sidebar body
function renderFilterPill(categoryName, genreName) {
  const pill = document.getElementById('activeFilterPill');
  const text = document.getElementById('pillText');
  if (categoryName) {
    text.textContent = genreName ? `${displayCategoryName(categoryName)} › ${genreName}` : displayCategoryName(categoryName);
    pill.classList.add('visible');
  } else {
    pill.classList.remove('visible');
  }
}

// ── Product Grid ──────────────────────────────────────────────
function renderProducts(products, cartIds = new Set(), wishlistIds = new Set(), append = false, viewMode = 'grid') {
  const grid    = document.getElementById('productGrid');
  const count   = document.getElementById('sectionHeadingCount');

  count.textContent = `(${products.length})`;
  grid.classList.toggle('shelf-view', viewMode === 'shelf');
  grid.classList.toggle('compact-view', viewMode === 'compact');
  grid.classList.toggle('spotlight-view', viewMode === 'spotlight');

  if (!products.length) {
    grid.innerHTML = `
      <div class="no-results empty-card">
        <span>No matches</span>
        <strong>No titles found for this filter.</strong>
        <button onclick="handleClearFilter();clearAdvancedFilters()">Reset browsing</button>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const inCart = cartIds.has(p.id);
    const wished = wishlistIds.has(p.id);
    const discounted = Number(p.id) % 9 === 0;
    const oldPrice = discounted ? Number(p.price) * 1.18 : null;
    return `
      <article class="product-card" style="animation-delay:${i * 0.035}s" aria-label="${escHtml(p.title)}">
        <button
          class="heart-btn ${wished ? 'wishlisted' : ''}"
          data-product-id="${p.id}"
          onclick="event.stopPropagation();handleWishlistToggle(${p.id})"
          aria-label="${wished ? 'Remove from wishlist' : 'Save to wishlist'}"
          title="${wished ? 'Saved' : 'Save to wishlist'}"
        >${wished ? '♥' : '♡'}</button>
        ${Number(p.stock) <= 0 ? '<span class="out-of-stock-badge">Sold out</span>' : ''}
        ${Number(p.stock) > 0 && Number(p.stock) <= 12 ? '<span class="low-stock-badge">Low stock</span>' : ''}
        ${discounted ? '<span class="discount-badge">Sale</span>' : ''}
        <div
          class="card-cover"
          style="background:${p.cover_color}"
          data-category="${escHtml(displayCategoryName(p.category_name))}"
          data-cat-slug="${p.category_slug}"
          role="button" tabindex="0"
          onclick="openModal(${p.id})"
          onkeydown="if(event.key==='Enter')openModal(${p.id})"
          title="View details"
        >
          <img
            class="card-cover-img"
            src="${escHtml(cleanImageUrl(p.image_url))}"
            alt="Cover of ${escHtml(p.title)}"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='images/placeholder.svg'"
          />  
          <div class="quick-actions">
            <button onclick="event.stopPropagation();openModal(${p.id})">Quick view</button>
            <button onclick="event.stopPropagation();handleWishlistToggle(${p.id})">${wished ? 'Saved' : 'Save'}</button>
          </div>
        </div>
        <div class="card-body">
          <div class="card-genre">${escHtml(p.genre_name)}</div>
          <h3 class="card-title">${escHtml(p.title)}</h3>
          <p class="card-author">${escHtml(p.author)}</p>
          <div class="card-meta-row">
            <span>${Number(p.stock || 0) > 12 ? 'In stock' : Number(p.stock || 0) > 0 ? `${Number(p.stock)} left` : 'Sold out'}</span>
            <span>${escHtml(displayCategoryName(p.category_name))}</span>
          </div>
          ${p.goodreads_rating ? `
            <div class="card-rating">
              ${renderStars(parseFloat(p.goodreads_rating))}
              <span class="rating-num">${parseFloat(p.goodreads_rating).toFixed(2)}</span>
              <span class="rating-source">Goodreads</span>
            </div>` : ''}
          <div class="card-footer">
            <span class="card-price">${discounted ? `<s>$${oldPrice.toFixed(2)}</s>` : ''}$${Number(p.price).toFixed(2)}</span>
            <button
              id="addBtn_${p.id}"
              class="add-btn ${inCart ? 'in-cart' : ''}"
              onclick="handleAddToCart(${p.id})"
              aria-label="${inCart ? 'In cart' : 'Add to cart'}"
              ${Number(p.stock || 0) <= 0 ? 'disabled' : ''}
            >${inCart ? '✓ In Cart' : '+ Add'}</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ── Cart ──────────────────────────────────────────────────────
function renderCart(cartData, coupon = null) {
  const { items = [], subtotal = 0, item_count = 0 } = cartData;
  const discount = coupon ? Number((Number(subtotal) * coupon.percent).toFixed(2)) : 0;
  const displayTotal = Math.max(0, Number(subtotal) - discount);

  document.getElementById('cartBadge').textContent      = item_count;
  const mobileBadge = document.getElementById('mobileCartBadge');
  if (mobileBadge) mobileBadge.textContent = item_count;
  document.getElementById('cartItemCount').textContent  = `${item_count} item${item_count !== 1 ? 's' : ''}`;
  document.getElementById('cartTotal').textContent      = `$${displayTotal.toFixed(2)}`;
  document.getElementById('checkoutBtn').disabled       = item_count === 0;
  const couponStatus = document.getElementById('couponStatus');
  if (couponStatus) couponStatus.textContent = coupon ? `${coupon.code} saved $${discount.toFixed(2)}` : 'Try INK10, LUXE15, or MANGA20';

  const emptyEl = document.getElementById('cartEmpty');
  const itemsEl = document.getElementById('cartItems');

  if (!items.length) {
    emptyEl.style.display = 'flex';
    itemsEl.style.display = 'none';
    itemsEl.innerHTML = '';
    if (couponStatus) couponStatus.textContent = '';
    return;
  }

  emptyEl.style.display = 'none';
  itemsEl.style.display = 'flex';

  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item" id="cartItem_${item.product_id}">
<div class="cart-thumb" style="background:${item.cover_color}">
  <img
    src="${escHtml(cleanImageUrl(item.image_url))}"
    alt="${escHtml(item.title)}"
    loading="lazy"
    decoding="async"
    onerror="this.onerror=null;this.src='images/placeholder.svg'"
    style="width:100%;height:100%;object-fit:cover;border-radius:4px;"
  />
</div>      <div class="cart-item-info">
        <div class="cart-item-title">${escHtml(item.title)}</div>
        <div class="cart-item-meta">${escHtml(displayCategoryName(item.category_name))} · ${escHtml(item.genre_name)}</div>
        <div class="cart-item-line">$${Number(item.line_total).toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="handleUpdateQty(${item.product_id},${item.quantity-1})"
          aria-label="Decrease" ${item.quantity<=1?'disabled':''}>−</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="handleUpdateQty(${item.product_id},${item.quantity+1})"
          aria-label="Increase" ${item.quantity>=99?'disabled':''}>+</button>
        <button class="remove-btn" onclick="handleRemoveItem(${item.product_id})" title="Remove">✕</button>
      </div>
    </div>`).join('');
}

function showCartError(message) {
  const el = document.getElementById('cartError');
  el.textContent = message;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 4000);
}

// ── Modal ─────────────────────────────────────────────────────
function openProductModal(product, inCart) {
  // Cover image
  const modalImg = document.getElementById('modalImageUrl');
  if (modalImg) {
    modalImg.src = '';               // reset first to force reload
    modalImg.alt = product.title;
    modalImg.onerror = () => { modalImg.onerror = null; modalImg.src = 'images/placeholder.svg'; };
    modalImg.src = cleanImageUrl(product.image_url);
  }

  // Cover background fallback colour
  const modalCover = document.getElementById('modalCover');
  if (modalCover) {
    modalCover.style.background = product.cover_color;
    modalCover.style.setProperty('--modal-cover-image', `url("${cleanImageUrl(product.image_url)}")`);
  }

  const badge = document.getElementById('modalCatBadge');
  badge.textContent         = displayCategoryName(product.category_name);
  badge.dataset.cat         = product.category_slug;
  badge.className           = 'modal-cat-badge';
  badge.setAttribute('data-cat', product.category_slug);

  document.getElementById('modalGenre').textContent  = product.genre_name;
  document.getElementById('modalTitle').textContent  = product.title;
  document.getElementById('modalAuthor').textContent = product.author;
  const ratingEl = document.getElementById('modalRating');

if (product.goodreads_rating) {
  ratingEl.innerHTML =
    renderStars(parseFloat(product.goodreads_rating)) +
    `<span class="rating-num">${parseFloat(product.goodreads_rating).toFixed(2)}</span>
     <span class="rating-source">Goodreads rating</span>`;
  ratingEl.style.display = 'flex';
} else {
  ratingEl.style.display = 'none';
}
  document.getElementById('modalDesc').textContent   = product.description || 'No description available.';
  document.getElementById('modalPrice').textContent  = `$${Number(product.price).toFixed(2)}`;

  document.querySelector('.modal-details')?.remove();
  const details = document.createElement('div');
  details.className = 'modal-details';
  details.innerHTML = `
    <div><span>Format</span><strong>${escHtml(displayCategoryName(product.category_name))}</strong></div>
    <div><span>Stock</span><strong>${Number(product.stock || 0) > 0 ? `${Number(product.stock)} available` : 'Sold out'}</strong></div>
    <div><span>Rating</span><strong>${product.goodreads_rating ? Number(product.goodreads_rating).toFixed(2) : 'New'}</strong></div>
    <div><span>Code</span><strong>IB-${String(product.id).padStart(4, '0')}</strong></div>
  `;
  document.getElementById('modalDesc').after(details);
  document.querySelector('.modal-preview')?.remove();
  const preview = document.createElement('div');
  preview.className = 'modal-preview';
  preview.innerHTML = `
    <div>
      <span>Author brief</span>
      <p>${escHtml(authorBio(product.author, displayCategoryName(product.category_name)))}</p>
    </div>
    <div>
      <span>Tags</span>
      <p>${productTags(product).map(tag => `<em>${escHtml(tag)}</em>`).join('')}</p>
    </div>
  `;
  details.after(preview);

  const btn = document.getElementById('modalAddBtn');
  btn.dataset.productId = product.id;
  btn.textContent       = inCart ? '✓ In Cart' : '+ Add to Cart';
  btn.className         = 'modal-add-btn' + (inCart ? ' in-cart' : '');

  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modalOverlay').setAttribute('aria-hidden', 'false');
  document.getElementById('modalClose').focus();
}

function closeProductModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalOverlay').setAttribute('aria-hidden', 'true');
}

// ── Helpers ───────────────────────────────────────────────────
function catColor(slug) {
  const map = {
    'books':          '#4a7a5c',
    'manga':          '#c0392b',
    'light-novels':   '#2471a3',
    'graphic-novels': '#6c3483',
  };
  return map[slug] || '#888';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function displayCategoryName(name) {
  return String(name || '').replace(/Manga\s*\/\s*Manhwa\s*\/\s*Manhua/gi, 'Manga');
}

// Cleans up image paths — trims spaces and removes leading slash
function cleanImageUrl(url) {
  if (!url) return 'images/placeholder.svg';
  return url.trim().replace(/^\//, '');
}

function renderAutocomplete(items = []) {
  const el = document.getElementById('autocompleteDropdown');
  if (!el) return;
  if (!items.length) {
    el.classList.remove('open');
    el.innerHTML = '';
    return;
  }
  el.innerHTML = items.map(item => `
    <button class="autocomplete-item" onclick="selectAutocomplete('${escJs(item.title)}','${escJs(item.author)}')">
      <span class="autocomplete-thumb">
        <img src="${escHtml(cleanImageUrl(item.image_url))}" alt="" onerror="this.onerror=null;this.src='images/placeholder.svg'" />
      </span>
      <span>
        <span class="autocomplete-title">${escHtml(item.title)}</span>
        <span class="autocomplete-author">${escHtml(item.author)}</span>
      </span>
    </button>
  `).join('');
  el.classList.add('open');
}

function escJs(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function authorBio(author, category) {
  const name = String(author || 'This author');
  const format = String(category || 'books').toLowerCase();
  if (name.toLowerCase() === 'various') {
    return 'A collected edition shaped by multiple creators, selected for its place on the Inkbound shelf.';
  }
  if (format.includes('manga')) {
    return `${name} brings panel rhythm, expressive pacing, and collector appeal to this manga selection.`;
  }
  if (format.includes('light')) {
    return `${name} writes with the quick momentum and world-building pull that make light novels easy to keep reading.`;
  }
  if (format.includes('graphic')) {
    return `${name} pairs visual storytelling with a strong genre hook for readers who like cinematic pages.`;
  }
  return `${name} is featured here for readers who want a refined, shelf-worthy title with staying power.`;
}

function productTags(product = {}) {
  const tags = [
    displayCategoryName(product.category_name),
    product.genre_name,
    Number(product.goodreads_rating || 0) >= 4.5 ? 'award pick' : '',
    Number(product.stock || 0) <= 12 && Number(product.stock || 0) > 0 ? 'low stock' : '',
    Number(product.price || 0) < 20 ? 'under $20' : '',
  ].filter(Boolean);
  return [...new Set(tags)].slice(0, 5);
}

function categoryTotals(orders = []) {
  const totals = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const key = item.category_name || item.category || 'Other';
      totals[key] = (totals[key] || 0) + Number(item.line_total || item.unit_price * item.quantity || 0);
    });
  });
  const values = Object.values(totals).sort((a, b) => b - a);
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  return {
    c1: Math.round(((values[0] || 0) / total) * 100),
    c2: Math.round((((values[0] || 0) + (values[1] || 0)) / total) * 100),
    c3: Math.round((((values[0] || 0) + (values[1] || 0) + (values[2] || 0)) / total) * 100),
  };
}

function monthlySales(orders = []) {
  const buckets = new Map();
  const labels = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, 0);
    labels.push({ key, label: date.toLocaleDateString(undefined, { month: 'short' }) });
  }
  orders.forEach(order => {
    const date = new Date(order.created_at || Date.now());
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + Number(order.total_amount || order.total || 0));
  });
  const max = Math.max(1, ...buckets.values());
  return labels.map(({ key, label }) => ({
    label,
    total: buckets.get(key),
    height: Math.max(8, Math.round((buckets.get(key) / max) * 100)),
  }));
}

// Converts a decimal rating (e.g. 4.54) into coloured star HTML
function renderStars(rating) {
  if (!rating) return '';
  const full  = Math.floor(rating);
  const half  = (rating - full) >= 0.25 && (rating - full) < 0.75 ? 1 : 0;
  const empty = 5 - full - half;
  let html = '<span class="stars">';
  for (let i = 0; i < full;  i++) html += '<span class="star-full">★</span>';
  if (half)                        html += '<span class="star-half">½</span>';
  for (let i = 0; i < empty; i++) html += '<span class="star-empty">☆</span>';
  html += '</span>';
  return html;
}

// ── Header auth button ────────────────────────────────────────
// Renders the login button OR the logged-in user info in the header
function renderHeader() {
  const user    = getStoredUser();
  const container = document.getElementById('authHeaderArea');
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="user-info">
        <span class="user-avatar">${escHtml(user.username[0].toUpperCase())}</span>
        <span class="user-name">${escHtml(user.username)}</span>
        ${user.role === 'admin'
          ? `<button class="admin-btn" onclick="openAdminPanel()" title="Admin Panel">Admin</button>`
          : ''}
        <button class="nav-action-btn" onclick="openWishlist()" aria-label="Open wishlist">Wishlist</button>
        <button class="nav-action-btn" onclick="openOrders()" aria-label="Open order history">Orders</button>
        <button class="nav-action-btn" onclick="openCommandPalette()" aria-label="Open command palette">Search</button>
        <button class="logout-btn" onclick="handleLogout()" aria-label="Logout">Logout</button>
      </div>`;
  } else {
    container.innerHTML = `
      <button class="auth-open-btn" onclick="openAuthModal('login')" aria-label="Login or Register">
        Login / Register
      </button>`;
  }
}

// ── Auth Modal ────────────────────────────────────────────────
// Switches the modal content between login and register forms
function renderAuthModal(view) {
  const body = document.getElementById('authModalBody');
  if (view === 'register') {
    body.innerHTML = `
      <h2 class="auth-title">Create Account</h2>
      <form id="registerForm" onsubmit="handleRegister(event)" novalidate>
        <label class="auth-label" for="regUsername">Username</label>
        <input class="auth-input" id="regUsername" type="text"     placeholder="your_name"      required autocomplete="username" />
        <label class="auth-label" for="regEmail">Email</label>
        <input class="auth-input" id="regEmail"    type="email"    placeholder="you@email.com"  required autocomplete="email" />
        <label class="auth-label" for="regPassword">Password <span class="auth-hint">(min 6 chars)</span></label>
        <input class="auth-input" id="regPassword" type="password" placeholder="••••••••"       required autocomplete="new-password" />
        <p class="auth-error" id="authError" role="alert"></p>
        <button class="auth-submit-btn" type="submit">Create Account</button>
      </form>
      <p class="auth-switch">Already have an account?
        <button class="auth-switch-btn" onclick="switchAuthView('login')">Log in</button>
      </p>`;
  } else {
    body.innerHTML = `
      <h2 class="auth-title">Welcome Back</h2>
      <form id="loginForm" onsubmit="handleLogin(event)" novalidate>
        <label class="auth-label" for="loginEmail">Email</label>
        <input class="auth-input" id="loginEmail"    type="email"    placeholder="you@email.com" required autocomplete="email" />
        <label class="auth-label" for="loginPassword">Password</label>
        <input class="auth-input" id="loginPassword" type="password" placeholder="••••••••"      required autocomplete="current-password" />
        <p class="auth-error" id="authError" role="alert"></p>
        <button class="auth-submit-btn" type="submit">Log In</button>
      </form>
      <p class="auth-switch">Don't have an account?
        <button class="auth-switch-btn" onclick="switchAuthView('register')">Sign up</button>
      </p>`;
  }
}

// ── Admin Panel ───────────────────────────────────────────────
// Renders all users, current carts, analytics, and saved orders.
function renderAdminPanel(users = [], analytics = {}, orders = [], extras = {}) {
  const panel = document.getElementById('adminPanel');
  const userList = Array.isArray(users) ? users : [];
  const orderList = Array.isArray(orders) ? orders : [];
  const totals = analytics.totals || analytics;
  const productList = Array.isArray(extras.products) ? extras.products : [];
  const allUsers = Array.isArray(extras.users) ? extras.users : userList;
  const reviewList = Array.isArray(extras.reviews) ? extras.reviews : [];
  const categories = Array.isArray(extras.categories) ? extras.categories : [];
  const lowStock = productList.filter(product => Number(product.stock || 0) <= 12).slice(0, 8);
  const byCategory = categoryTotals(orderList);
  const salesTrend = monthlySales(orderList);

  if (!userList.length && !orderList.length && !productList.length && !allUsers.length) {
    panel.innerHTML = `
      <div class="admin-header">
        <h2 class="admin-title">Admin</h2>
        <button class="admin-close-btn" onclick="closeAdminPanel()">← Back to Store</button>
      </div>
      <p class="admin-empty">No users or orders yet.</p>`;
    return;
  }

  const statCards = [
    ['Users', totals.total_users ?? userList.filter(user => user.role !== 'admin').length, 'users'],
    ['Products', totals.total_products ?? totals.total_books ?? window.INKBOUND_STATIC_CATALOG?.products?.length ?? 0, 'products'],
    ['Orders', totals.total_orders ?? orderList.length, 'orders'],
    ['Revenue', `$${Number(totals.total_revenue || 0).toFixed(2)}`, 'revenue'],
    ['Low Stock', lowStock.length, 'stock'],
  ].map(([label, value, icon]) => `
    <div class="admin-stat-card admin-stat-card-${icon}">
      <span class="admin-stat-icon admin-stat-icon-${icon}" aria-hidden="true"></span>
      <span class="admin-stat-label">${escHtml(label)}</span>
      <strong>${escHtml(value)}</strong>
    </div>`).join('');

  const orderRows = orderList.length
    ? orderList.map(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      return `
        <tr>
          <td>#${escHtml(order.id || order.order_id)}</td>
          <td>
            <strong>${escHtml(order.username || 'Unknown')}</strong>
            <span>${escHtml(order.email || '')}</span>
          </td>
          <td>${escHtml(order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent')}</td>
          <td>${escHtml(items.map(item => `${item.title} x${item.quantity}`).join(', ') || 'No line items')}</td>
          <td>
            <select class="admin-status-select" onchange="handleAdminStatusChange(${Number(order.id || order.order_id)}, this.value)">
              ${['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(status => `
                <option value="${status}" ${(order.status || 'Confirmed') === status ? 'selected' : ''}>${status}</option>
              `).join('')}
            </select>
          </td>
          <td class="admin-num">$${Number(order.total_amount || order.total || 0).toFixed(2)}</td>
        </tr>`;
    }).join('')
    : '<tr><td colspan="6" class="admin-empty-cart">No orders have been placed yet.</td></tr>';

  const rows = userList.map(user => {
    const cart = user.cart || { items: [], item_count: 0, subtotal: 0 };
    const cartHtml = cart.items.length
      ? cart.items.map(item => `
          <tr>
            <td>${escHtml(item.title)}</td>
            <td>${escHtml(item.author)}</td>
            <td>${escHtml(displayCategoryName(item.category_name))}</td>
            <td class="admin-num">x${item.quantity}</td>
            <td class="admin-num">$${parseFloat(item.line_total).toFixed(2)}</td>
          </tr>`).join('')
      : `<tr><td colspan="5" class="admin-empty-cart">Empty cart</td></tr>`;

    return `
      <div class="admin-user-card">
        <div class="admin-user-head">
          <span class="admin-user-avatar">${escHtml(user.username[0].toUpperCase())}</span>
          <div>
          <span class="admin-user-name">${escHtml(user.username)}</span>
            <span class="admin-user-email">${escHtml(user.email)}</span>
          </div>
          <span class="admin-role-badge admin-role-${user.role}">${user.role}</span>
          <span class="admin-cart-total">${cart.item_count} item${cart.item_count !== 1 ? 's' : ''} · $${Number(cart.subtotal || 0).toFixed(2)}</span>
        </div>
        <table class="admin-cart-table">
          <thead>
            <tr>
              <th>Title</th><th>Author</th><th>Category</th>
              <th class="admin-num">Qty</th><th class="admin-num">Total</th>
            </tr>
          </thead>
          <tbody>${cartHtml}</tbody>
        </table>
      </div>`;
  }).join('');
  const productRows = productList.slice(0, 20).map(product => `
    <tr>
      <td>${escHtml(product.title)}</td>
      <td>${escHtml(product.author)}</td>
      <td><input class="admin-inline-input" value="${Number(product.price).toFixed(2)}" onchange="apiUpdateAdminProduct(${product.id},{price:this.value}).then(openAdminPanel)" /></td>
      <td><input class="admin-inline-input" value="${Number(product.stock || 0)}" onchange="apiUpdateAdminProduct(${product.id},{stock:this.value}).then(openAdminPanel)" /></td>
      <td><button class="admin-mini-btn danger" onclick="handleAdminProductDelete(${product.id})">Delete</button></td>
    </tr>`).join('');
  const categoryOptions = categories.map(cat => `<option value="${cat.id}">${escHtml(displayCategoryName(cat.name))}</option>`).join('');
  const genreOptions = categories.flatMap(cat => cat.genres || []).map(genre => `<option value="${genre.id}">${escHtml(genre.name)}</option>`).join('');
  const userRows = allUsers.map(user => `
    <tr>
      <td>${escHtml(user.username)}</td>
      <td>${escHtml(user.email)}</td>
      <td>
        <select class="admin-status-select" onchange="handleAdminUserUpdate(${user.id}, 'role', this.value)">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>user</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
        </select>
      </td>
      <td><button class="admin-mini-btn" onclick="handleAdminUserUpdate(${user.id}, 'disabled', ${!user.disabled})">${user.disabled ? 'Enable' : 'Disable'}</button></td>
    </tr>`).join('');
  const reviewRows = reviewList.map(review => `
    <tr>
      <td>${escHtml(review.product?.title || `Product #${review.product_id}`)}</td>
      <td>${escHtml(review.username || 'Reader')}</td>
      <td>${renderStars(Number(review.rating))}</td>
      <td>${escHtml(review.body || '')}</td>
      <td><button class="admin-mini-btn danger" onclick="handleDeleteReview(${Number(review.id)}, ${Number(review.product_id)});openAdminPanel()">Delete</button></td>
    </tr>`).join('');

  panel.innerHTML = `
    <div class="admin-header">
      <div>
        <span class="admin-kicker">Store command</span>
        <h2 class="admin-title">Admin Control Room</h2>
      </div>
      <button class="admin-close-btn" onclick="closeAdminPanel()">← Back to Store</button>
    </div>
    <div class="admin-stat-grid">${statCards}</div>
    <section class="admin-section admin-visuals">
      <div class="admin-section-head">
        <h3>Store Analytics</h3>
        <span>Sales chart and category mix</span>
      </div>
      <div class="admin-chart-grid">
        <div class="admin-line-chart">${salesTrend.map(point => `<span style="--h:${point.height}%"><em>${escHtml(point.label)}</em></span>`).join('')}</div>
        <div class="admin-donut" style="--c1:${byCategory.c1}%;--c2:${byCategory.c2}%;--c3:${byCategory.c3}%"><strong>$${Number(totals.total_revenue || 0).toFixed(0)}</strong><span>revenue</span></div>
        <div class="low-stock-list">${lowStock.map(product => `<p><strong>${escHtml(product.title)}</strong><span>${Number(product.stock || 0)} left</span></p>`).join('') || '<p>No low-stock alerts.</p>'}</div>
      </div>
    </section>
    <section class="admin-section">
      <div class="admin-section-head">
        <h3>All Orders</h3>
        <span>${orderList.length} order${orderList.length !== 1 ? 's' : ''} across every account</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-orders-table">
          <thead>
            <tr>
              <th>Order ID</th><th>User</th><th>Date</th><th>Items</th><th>Status</th><th class="admin-num">Total</th>
            </tr>
          </thead>
          <tbody>${orderRows}</tbody>
        </table>
      </div>
    </section>
    <section class="admin-section">
      <div class="admin-section-head">
        <h3>Current Carts</h3>
        <span>${userList.length} registered user${userList.length !== 1 ? 's' : ''}</span>
      </div>
      ${rows}
    </section>`;
  panel.innerHTML += `
    <section class="admin-section">
      <div class="admin-section-head"><h3>Product Manager</h3><span>Add, edit, delete, stock</span></div>
      <form class="admin-product-form" onsubmit="handleAdminProductSave(event)">
        <input name="title" placeholder="Title" required />
        <input name="author" placeholder="Author" required />
        <input name="price" type="number" step="0.01" placeholder="Price" required />
        <input name="stock" type="number" placeholder="Stock" required />
        <select name="category_id">${categoryOptions}</select>
        <select name="genre_id">${genreOptions}</select>
        <input name="image_url" placeholder="Cover path" />
        <textarea name="description" placeholder="Description"></textarea>
        <button type="submit">Add title</button>
      </form>
      <div class="admin-table-wrap"><table class="admin-orders-table"><thead><tr><th>Title</th><th>Author</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>${productRows}</tbody></table></div>
    </section>
    <section class="admin-section">
      <div class="admin-section-head"><h3>User Manager</h3><span>Promote, demote, disable</span></div>
      <div class="admin-table-wrap"><table class="admin-orders-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Access</th></tr></thead><tbody>${userRows}</tbody></table></div>
    </section>
    <section class="admin-section">
      <div class="admin-section-head"><h3>Review Moderation</h3><span>${reviewList.length} reader notes</span></div>
      <div class="admin-table-wrap"><table class="admin-orders-table"><thead><tr><th>Title</th><th>User</th><th>Rating</th><th>Review</th><th></th></tr></thead><tbody>${reviewRows || '<tr><td colspan="5" class="admin-empty-cart">No reviews yet.</td></tr>'}</tbody></table></div>
    </section>`;
}

function renderWishlist(items, cartIds = new Set()) {
  const body = document.getElementById('wishlistBody');
  if (!items.length) {
    body.innerHTML = '<p class="empty-state">Your wishlist is waiting for a few favorites.</p>';
    return;
  }

  body.innerHTML = items.map(item => {
    const id = item.product_id || item.id;
    const inCart = cartIds.has(id);
    return `
      <div class="wishlist-item">
        <div class="wishlist-thumb" style="background:${item.cover_color}">
          <img src="${escHtml(cleanImageUrl(item.image_url))}" alt="${escHtml(item.title)}" onerror="this.onerror=null;this.src='images/placeholder.svg'" />
        </div>
        <div class="wishlist-info">
          <div class="wishlist-title">${escHtml(item.title)}</div>
          <div class="wishlist-author">${escHtml(item.author)}</div>
          <div class="wishlist-price">$${Number(item.price).toFixed(2)}</div>
        </div>
        <div class="wishlist-actions">
          <button class="wishlist-add-btn ${inCart ? 'in-cart' : ''}" onclick="${inCart ? '' : `handleAddToCart(${id})`}">${inCart ? 'In cart' : 'Add'}</button>
          <button class="wishlist-remove-btn" onclick="handleWishlistToggle(${id});openWishlist()">Remove</button>
        </div>
      </div>`;
  }).join('');
}

function renderOrderHistory(orders) {
  const body = document.getElementById('ordersBody');
  if (!orders.length) {
    body.innerHTML = '<p class="empty-state">No orders yet. Your first checkout will appear here.</p>';
    return;
  }

  body.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-head">
        <div>
          <div class="order-id">Order #${escHtml(order.id || order.order_id)}</div>
          <div class="order-date">${escHtml(order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent')}</div>
        </div>
        <div>
          <div class="order-total">$${Number(order.total || order.total_amount || 0).toFixed(2)}</div>
          <div class="order-status">${escHtml(order.status || 'Placed')}</div>
        </div>
      </div>
      <div class="order-items-list">
        ${(order.items || []).map(item => `
          <div class="order-item-row">
            <span>${escHtml(item.title)} <span class="order-item-qty">x${item.quantity}</span></span>
            <span>$${Number(item.line_total || item.unit_price * item.quantity || 0).toFixed(2)}</span>
          </div>`).join('')}
      </div>
      <div class="order-progress" aria-label="Order progress">
        ${['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map(status => `
          <span class="${orderStepClass(order.status || 'Confirmed', status)}">${status}</span>
        `).join('')}
      </div>
    </div>`).join('');
}

function orderStepClass(current, step) {
  const order = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  if (current === 'Cancelled') return 'cancelled';
  return order.indexOf(step) <= order.indexOf(current) ? 'complete' : '';
}

function renderCheckout(cartData = {}, coupon = null, totals = {}) {
  const body = document.getElementById('checkoutBody');
  if (!body) return;
  const items = cartData.items || [];
  body.innerHTML = `
    <form class="checkout-flow" onsubmit="submitCheckout(event)">
      <section class="checkout-step">
        <span>Step 1</span>
        <h3>Delivery</h3>
        <input name="fullName" required placeholder="Full name" autocomplete="name" />
        <input name="address" required placeholder="Street address" autocomplete="street-address" />
        <div class="checkout-grid-2">
          <input name="city" required placeholder="City" autocomplete="address-level2" />
          <input name="postcode" required placeholder="Postcode" autocomplete="postal-code" />
        </div>
      </section>
      <section class="checkout-step">
        <span>Step 2</span>
        <h3>Mock payment</h3>
        <label class="mock-payment">
          <input type="radio" name="paymentMethod" value="Inkbound black card" checked />
          <strong>Inkbound black card</strong>
          <small>Ending 4242 · Demo payment only</small>
        </label>
        <label class="mock-payment">
          <input type="radio" name="paymentMethod" value="Cash on delivery" />
          <strong>Cash on delivery</strong>
          <small>Marked as pending until confirmed</small>
        </label>
      </section>
      <section class="checkout-step">
        <span>Step 3</span>
        <h3>Review</h3>
        <div class="checkout-lines">
          ${items.map(item => `
            <div><span>${escHtml(item.title)} x${item.quantity}</span><strong>$${Number(item.line_total || 0).toFixed(2)}</strong></div>
          `).join('')}
        </div>
        <div class="checkout-totals">
          <div><span>Subtotal</span><strong>$${Number(totals.subtotal || 0).toFixed(2)}</strong></div>
          <div><span>${coupon ? `${escHtml(coupon.code)} discount` : 'Discount'}</span><strong>-$${Number(totals.discount || 0).toFixed(2)}</strong></div>
          <div><span>Shipping</span><strong>${Number(totals.shipping || 0) ? `$${Number(totals.shipping).toFixed(2)}` : 'Free'}</strong></div>
          <div><span>Estimated tax</span><strong>$${Number(totals.tax || 0).toFixed(2)}</strong></div>
          <div class="checkout-grand"><span>Total</span><strong>$${Number(totals.grandTotal || 0).toFixed(2)}</strong></div>
        </div>
      </section>
      <button class="checkout-place-btn" type="submit">Place order</button>
    </form>`;
}

function renderReceipt(order = {}) {
  const modal = document.getElementById('receiptModal');
  const body = document.getElementById('receiptBody');
  if (!modal || !body) return;
  body.innerHTML = `
    <div class="receipt-card">
      <span class="receipt-kicker">Order confirmed</span>
      <h2>#${escHtml(order.orderId || 'New')}</h2>
      <p>Your shelf is being prepared. Estimated dispatch: ${escHtml(order.eta ? new Date(order.eta).toLocaleDateString() : 'within 4 days')}.</p>
      <div class="receipt-lines">
        ${(order.items || []).map(item => `
          <div>
            <span>${escHtml(item.title)} x${item.quantity}</span>
            <strong>$${Number(item.line_total || 0).toFixed(2)}</strong>
          </div>
        `).join('')}
      </div>
      <div class="receipt-totals">
        <div><span>Subtotal</span><strong>$${Number(order.subtotal || 0).toFixed(2)}</strong></div>
        <div><span>Shipping</span><strong>${Number(order.shipping || 0) ? `$${Number(order.shipping).toFixed(2)}` : 'Free'}</strong></div>
        <div><span>${order.coupon ? `${escHtml(order.coupon.code)} discount` : 'Discount'}</span><strong>-$${Number(order.discount || 0).toFixed(2)}</strong></div>
        <div><span>Est. tax</span><strong>$${Number(order.tax || 0).toFixed(2)}</strong></div>
        <div class="receipt-grand"><span>Total</span><strong>$${Number(order.total || 0).toFixed(2)}</strong></div>
      </div>
      <button class="receipt-action secondary" onclick="downloadInvoice()">Download invoice</button>
      <button class="receipt-action" onclick="closeReceipt();openOrders()">View order history</button>
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function downloadInvoice() {
  const text = document.getElementById('receiptBody')?.innerText || 'Inkbound receipt';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inkbound-invoice-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderCommandResults(query, results = []) {
  const el = document.getElementById('commandResults');
  if (!el) return;
  if (!results.length) {
    el.innerHTML = '<p class="command-empty">No command or title found.</p>';
    return;
  }
  el.innerHTML = results.map((item, index) => `
    <button class="command-result" onclick="executeCommand(${index})">
      <span class="command-icon ${item.type}">
        ${item.image_url ? `<img src="${escHtml(cleanImageUrl(item.image_url))}" alt="" onerror="this.onerror=null;this.src='images/placeholder.svg'" />` : ''}
      </span>
      <span>
        <strong>${escHtml(item.label)}</strong>
        <small>${escHtml(item.detail || item.type)}</small>
      </span>
      <kbd>${index === 0 ? 'Enter' : ''}</kbd>
    </button>
  `).join('');
}

function renderModalReviews(reviews, productId) {
  const modal = document.querySelector('.modal');
  modal.querySelector('.modal-reviews')?.remove();
  const reviewItems = Array.isArray(reviews?.data) ? reviews.data : [];
  const currentUser = getStoredUser();
  const section = document.createElement('div');
  section.className = 'modal-reviews';
  section.innerHTML = `
    <h3 class="reviews-heading">Reader notes</h3>
    ${reviewItems.length ? reviewItems.map(r => `
      <div class="review-item">
        <div class="review-meta">
          <span class="review-user">${escHtml(r.username || 'Reader')}</span>
          <span class="review-date">${escHtml(r.created_at ? new Date(r.created_at).toLocaleDateString() : '')}</span>
        </div>
        <div>${renderStars(Number(r.rating))}</div>
        <p class="review-body">${escHtml(r.body || r.review || '')}</p>
        ${currentUser && (currentUser.role === 'admin' || currentUser.username === r.username)
          ? `<button class="review-delete-btn" onclick="handleDeleteReview(${Number(r.id)}, ${Number(productId)})">Delete</button>`
          : ''}
      </div>`).join('') : '<p class="no-reviews">No reviews yet.</p>'}
    <form class="review-form" onsubmit="event.preventDefault();handleSubmitReview(${productId}, Number(this.rating.value), this.body.value.trim())">
      <select name="rating" class="sort-select" aria-label="Review rating">
        <option value="5">5 stars</option>
        <option value="4">4 stars</option>
        <option value="3">3 stars</option>
        <option value="2">2 stars</option>
        <option value="1">1 star</option>
      </select>
      <textarea name="body" class="review-textarea" placeholder="Leave a short review" required></textarea>
      <button class="review-submit-btn" type="submit">Post review</button>
    </form>`;
  modal.appendChild(section);
}

function renderSimilar(items, cartIds = new Set()) {
  const modal = document.querySelector('.modal');
  modal.querySelector('.modal-similar')?.remove();
  if (!items.length) return;
  const section = document.createElement('div');
  section.className = 'modal-similar';
  section.innerHTML = `
    <h3 class="similar-heading">Similar reads</h3>
    <div class="similar-strip">
      ${items.slice(0, 4).map(item => `
        <div class="similar-card" onclick="openModal(${item.id})">
          <div class="similar-cover">
            <img src="${escHtml(cleanImageUrl(item.image_url))}" alt="${escHtml(item.title)}" onerror="this.onerror=null;this.src='images/placeholder.svg'" />
          </div>
          <div class="similar-title">${escHtml(item.title)}</div>
        </div>`).join('')}
    </div>`;
  modal.appendChild(section);
}
