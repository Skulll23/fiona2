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
          ${escHtml(cat.name)}
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

// Update the active filter pill shown above the sidebar body
function renderFilterPill(categoryName, genreName) {
  const pill = document.getElementById('activeFilterPill');
  const text = document.getElementById('pillText');
  if (categoryName) {
    text.textContent = genreName ? `${categoryName} › ${genreName}` : categoryName;
    pill.classList.add('visible');
  } else {
    pill.classList.remove('visible');
  }
}

// ── Product Grid ──────────────────────────────────────────────
function renderProducts(products, cartIds = new Set(), wishlistIds = new Set()) {
  const grid    = document.getElementById('productGrid');
  const count   = document.getElementById('sectionHeadingCount');

  count.textContent = `(${products.length})`;

  if (!products.length) {
    grid.innerHTML = '<p class="no-results">No titles found for this filter.</p>';
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const inCart = cartIds.has(p.id);
    const wished = wishlistIds.has(p.id);
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
        <div
          class="card-cover"
          style="background:${p.cover_color}"
          data-category="${escHtml(p.category_name)}"
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
        </div>
        <div class="card-body">
          <div class="card-genre">${escHtml(p.genre_name)}</div>
          <h3 class="card-title">${escHtml(p.title)}</h3>
          <p class="card-author">${escHtml(p.author)}</p>
          ${p.goodreads_rating ? `
            <div class="card-rating">
              ${renderStars(parseFloat(p.goodreads_rating))}
              <span class="rating-num">${parseFloat(p.goodreads_rating).toFixed(2)}</span>
              <span class="rating-source">Goodreads</span>
            </div>` : ''}
          <div class="card-footer">
            <span class="card-price">$${Number(p.price).toFixed(2)}</span>
            <button
              id="addBtn_${p.id}"
              class="add-btn ${inCart ? 'in-cart' : ''}"
              onclick="handleAddToCart(${p.id})"
              aria-label="${inCart ? 'In cart' : 'Add to cart'}"
            >${inCart ? '✓ In Cart' : '+ Add'}</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ── Cart ──────────────────────────────────────────────────────
function renderCart(cartData) {
  const { items = [], subtotal = 0, item_count = 0 } = cartData;

  document.getElementById('cartBadge').textContent      = item_count;
  document.getElementById('cartItemCount').textContent  = `${item_count} item${item_count !== 1 ? 's' : ''}`;
  document.getElementById('cartTotal').textContent      = `$${Number(subtotal).toFixed(2)}`;
  document.getElementById('checkoutBtn').disabled       = item_count === 0;

  const emptyEl = document.getElementById('cartEmpty');
  const itemsEl = document.getElementById('cartItems');

  if (!items.length) {
    emptyEl.style.display = 'flex';
    itemsEl.style.display = 'none';
    itemsEl.innerHTML = '';
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
        <div class="cart-item-meta">${escHtml(item.category_name)} · ${escHtml(item.genre_name)}</div>
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
  if (modalCover) modalCover.style.background = product.cover_color;

  const badge = document.getElementById('modalCatBadge');
  badge.textContent         = product.category_name;
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

// Cleans up image paths — trims spaces and removes leading slash
function cleanImageUrl(url) {
  if (!url) return 'images/placeholder.svg';
  return url.trim().replace(/^\//, '');
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
function renderAdminPanel(users = [], analytics = {}, orders = []) {
  const panel = document.getElementById('adminPanel');
  const userList = Array.isArray(users) ? users : [];
  const orderList = Array.isArray(orders) ? orders : [];
  const totals = analytics.totals || analytics;

  if (!userList.length && !orderList.length) {
    panel.innerHTML = `
      <div class="admin-header">
        <h2 class="admin-title">Admin</h2>
        <button class="admin-close-btn" onclick="closeAdminPanel()">← Back to Store</button>
      </div>
      <p class="admin-empty">No users or orders yet.</p>`;
    return;
  }

  const statCards = [
    ['Users', totals.total_users ?? userList.filter(user => user.role !== 'admin').length],
    ['Products', totals.total_products ?? totals.total_books ?? window.INKBOUND_STATIC_CATALOG?.products?.length ?? 0],
    ['Orders', totals.total_orders ?? orderList.length],
    ['Revenue', `$${Number(totals.total_revenue || 0).toFixed(2)}`],
  ].map(([label, value]) => `
    <div class="admin-stat-card">
      <span>${escHtml(label)}</span>
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
          <td>${escHtml(order.status || 'Placed')}</td>
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
            <td>${escHtml(item.category_name)}</td>
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

  panel.innerHTML = `
    <div class="admin-header">
      <div>
        <span class="admin-kicker">Store command</span>
        <h2 class="admin-title">Admin Control Room</h2>
      </div>
      <button class="admin-close-btn" onclick="closeAdminPanel()">← Back to Store</button>
    </div>
    <div class="admin-stat-grid">${statCards}</div>
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
    </div>`).join('');
}

function renderModalReviews(reviews, productId) {
  const modal = document.querySelector('.modal');
  modal.querySelector('.modal-reviews')?.remove();
  const reviewItems = Array.isArray(reviews?.data) ? reviews.data : [];
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
