//This will manage application state, user interactions, and coordinate between the API and UI rendering.

const state = {
  products:   [],
  categories: [],
  cart:       { items: [], subtotal: 0, item_count: 0 },
  filter:     { categoryId: null, genreId: null, categoryName: '', genreName: '' },
  search:     '',
  sort:       'title',
  loading:    false,
  wishlistIds: new Set(),
  pagination: { page: 1, totalPages: 1, total: 0 },
  user:       getStoredUser(),
  authView:   'login',
  adminView:  false,
};

// ── Theme ────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('inkbound_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = saved === 'light' ? '🌙' : '☀';
}

function handleThemeToggle() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('inkbound_theme', next);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = next === 'light' ? '🌙' : '☀';
  };

  if (document.startViewTransition) {
    document.startViewTransition(applyTheme);
    return;
  }

  document.documentElement.classList.add('theme-transitioning');
  applyTheme();
  window.setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 520);
}

// ── Debounce ─────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

const debouncedSearch = debounce((value) => {
  state.search = value.trim();
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
  if (value.trim().length > 1) loadAutocomplete(value.trim());
  else closeAutocomplete();
}, 280);

function clearSearch() {
  state.search = '';
  state.pagination.page = 1;
  document.getElementById('searchInput').value = '';
  closeAutocomplete();
  renderSkeletons(8);
  loadProducts();
}

function cartProductIds() { return new Set(state.cart.items.map(i => i.product_id)); }

// ── Startup ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  renderSkeletons(8);
  renderHeader();
  await Promise.all([loadCategories(), loadCart()]);
  await loadProducts();
  if (state.user) loadWishlistIds();
  bindStaticEvents();
});

// ── Data loaders ─────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await fetchCategories();
    state.categories = res.data;
    renderSidebar(state.categories, state.filter, handleCategoryClick, handleGenreClick);
  } catch (err) { console.error('loadCategories:', err); }
}

async function loadProducts(append = false) {
  try {
    const { categoryId, genreId } = state.filter;
    const res = await fetchProducts(categoryId, genreId, state.search || null, {
      sort:  state.sort,
      page:  state.pagination.page,
      limit: 24,
    });
    if (append) {
      state.products = [...state.products, ...res.data];
    } else {
      state.products = res.data;
    }
    state.pagination = { ...state.pagination, ...res.pagination };
    renderProducts(state.products, cartProductIds(), state.wishlistIds, append);
    updateSectionHeading();
    updateProductCount();
    // Show/hide load more
    const lmc = document.getElementById('loadMoreContainer');
    if (lmc) lmc.style.display = state.pagination.page < state.pagination.totalPages ? 'block' : 'none';
  } catch (err) {
    console.error('loadProducts:', err);
    document.getElementById('productGrid').innerHTML =
      '<p class="no-results">⚠️ Could not load products. Is the server running?</p>';
  }
}

async function loadCart() {
  try {
    const res  = await fetchCart();
    state.cart = res.data;
    renderCart(state.cart);
  } catch (err) {
    console.error('loadCart:', err);
    showCartError('Could not load cart. Please refresh.');
  }
}

async function loadWishlistIds() {
  try {
    if (!state.user) return;
    const res = await fetchWishlistIds();
    state.wishlistIds = new Set(res.data);
    // Re-render heart states without reloading all products
    document.querySelectorAll('.heart-btn').forEach(btn => {
      const id = Number(btn.dataset.productId);
      btn.classList.toggle('wishlisted', state.wishlistIds.has(id));
      btn.textContent = state.wishlistIds.has(id) ? '♥' : '♡';
    });
  } catch (err) { console.error('loadWishlistIds:', err); }
}

// ── Section heading ──────────────────────────────────────────
function updateSectionHeading() {
  const el = document.getElementById('sectionHeadingText');
  const { categoryName, genreName } = state.filter;
  if (genreName)      el.textContent = genreName;
  else if (categoryName) el.textContent = categoryName;
  else                el.textContent = 'All Titles';
}

function updateProductCount() {
  const count = document.getElementById('sectionHeadingCount');
  if (count) count.textContent = `(${state.pagination.total || state.products.length})`;
}

// ── Sort ─────────────────────────────────────────────────────
function handleSortChange(value) {
  state.sort = value;
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
}

// ── Load more ────────────────────────────────────────────────
async function handleLoadMore() {
  const btn = document.getElementById('loadMoreBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
  state.pagination.page++;
  await loadProducts(true);
  if (btn) { btn.disabled = false; btn.textContent = 'Load More'; }
}

// ── Filter: Category ─────────────────────────────────────────
function handleCategoryClick(categoryId, categorySlug, btn) {
  if (state.loading) return;
  const cat = state.categories.find(c => c.id === categoryId);
  if (state.filter.categoryId === categoryId && !state.filter.genreId) {
    state.filter = { categoryId: null, genreId: null, categoryName: '', genreName: '' };
  } else {
    state.filter = { categoryId, genreId: null, categoryName: cat?.name || '', genreName: '' };
  }
  const genreList = document.getElementById(`genreList_${categoryId}`);
  const isOpen    = genreList.classList.contains('open');
  document.querySelectorAll('.genre-list').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.cat-btn').forEach(el => el.classList.remove('open', 'active'));
  if (!isOpen || state.filter.categoryId) { genreList.classList.add('open'); btn.classList.add('open'); }
  if (state.filter.categoryId) btn.classList.add('active');
  renderFilterPill(state.filter.categoryName, state.filter.genreName);
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
}

// ── Filter: Genre ────────────────────────────────────────────
function handleGenreClick(categoryId, genreId, genreName, btn) {
  if (state.loading) return;
  const cat = state.categories.find(c => c.id === categoryId);
  if (state.filter.genreId === genreId) {
    state.filter = { categoryId, genreId: null, categoryName: cat?.name || '', genreName: '' };
  } else {
    state.filter = { categoryId, genreId, categoryName: cat?.name || '', genreName };
  }
  renderSidebar(state.categories, state.filter, handleCategoryClick, handleGenreClick);
  renderFilterPill(state.filter.categoryName, state.filter.genreName);
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
}

// ── Clear filter ─────────────────────────────────────────────
function handleClearFilter() {
  state.filter = { categoryId: null, genreId: null, categoryName: '', genreName: '' };
  renderSidebar(state.categories, state.filter, handleCategoryClick, handleGenreClick);
  renderFilterPill('', '');
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
}

// ── Add to cart ──────────────────────────────────────────────
async function handleAddToCart(productId) {
  if (state.loading) return;
  state.loading = true;
  const btn = document.getElementById(`addBtn_${productId}`);
  if (btn) { btn.classList.add('loading'); btn.textContent = '…'; }
  try {
    const res  = await addToCart(productId);
    state.cart = res.data;
    renderCart(state.cart);
    const ids = cartProductIds();
    state.products.forEach(p => {
      const b = document.getElementById(`addBtn_${p.id}`);
      if (!b) return;
      if (ids.has(p.id)) { b.textContent = '✓ In Cart'; b.classList.add('in-cart'); b.classList.remove('loading'); }
      else               { b.textContent = '+ Add';    b.classList.remove('in-cart', 'loading'); }
    });
    const added = res.data.items.find(i => i.product_id === productId);
    showToast(`"${added?.title || 'Item'}" added to cart`);
    const modalBtn = document.getElementById('modalAddBtn');
    if (modalBtn && Number(modalBtn.dataset.productId) === productId) {
      modalBtn.textContent = '✓ In Cart'; modalBtn.classList.add('in-cart');
    }
  } catch (err) {
    console.error('addToCart:', err);
    showToast(err.message || 'Could not add item', 'error');
    if (btn) { btn.textContent = '+ Add'; btn.classList.remove('loading'); }
  } finally { state.loading = false; }
}

// ── Update qty ───────────────────────────────────────────────
async function handleUpdateQty(productId, newQty) {
  if (state.loading) return;
  if (newQty < 1) { handleRemoveItem(productId); return; }
  state.loading = true;
  try {
    const res  = await updateCartItem(productId, newQty);
    state.cart = res.data;
    renderCart(state.cart);
  } catch (err) {
    console.error('updateQty:', err);
    showToast(err.message || 'Could not update quantity', 'error');
  } finally { state.loading = false; }
}

// ── Remove item ──────────────────────────────────────────────
async function handleRemoveItem(productId) {
  if (state.loading) return;
  state.loading = true;
  const itemEl = document.getElementById(`cartItem_${productId}`);
  if (itemEl) itemEl.classList.add('removing');
  try {
    const res  = await removeCartItem(productId);
    state.cart = res.data;
    await new Promise(r => setTimeout(r, 200));
    renderCart(state.cart);
    const btn = document.getElementById(`addBtn_${productId}`);
    if (btn) { btn.textContent = '+ Add'; btn.classList.remove('in-cart'); }
    showToast('Item removed');
  } catch (err) {
    console.error('removeItem:', err);
    showToast(err.message || 'Could not remove item', 'error');
    if (itemEl) itemEl.classList.remove('removing');
  } finally { state.loading = false; }
}

// ── Clear cart ───────────────────────────────────────────────
async function handleClearCart() {
  if (state.loading || !state.cart.item_count) return;
  const ok = await requestConfirmation({
    kicker: 'Cart',
    title: 'Clear your cart?',
    message: `This will remove ${state.cart.item_count} item${state.cart.item_count !== 1 ? 's' : ''} from your cart.`,
    confirmText: 'Clear cart',
    danger: true,
  });
  if (!ok) return;

  state.loading = true;
  try {
    const res  = await clearCart();
    state.cart = res.data;
    renderCart(state.cart);
    document.querySelectorAll('.add-btn').forEach(b => { b.textContent = '+ Add'; b.classList.remove('in-cart', 'loading'); });
    showToast('Cart cleared');
  } catch (err) {
    console.error('clearCart:', err);
    showToast(err.message || 'Could not clear cart', 'error');
  } finally { state.loading = false; }
}

// ── Checkout (real order) ────────────────────────────────────
async function handleCheckout() {
  if (!state.cart.item_count || !state.user) {
    if (!state.user) { openAuthModal('login'); showToast('Please log in to checkout', 'error'); }
    return;
  }
  const ok = await requestConfirmation({
    kicker: 'Checkout',
    title: 'Place this order?',
    message: `${state.cart.item_count} item${state.cart.item_count !== 1 ? 's' : ''} will be ordered for $${Number(state.cart.subtotal || 0).toFixed(2)}.`,
    confirmText: 'Place order',
  });
  if (!ok) return;

  try {
    const res  = await placeOrder();
    state.cart = { items: [], subtotal: 0, item_count: 0 };
    renderCart(state.cart);
    document.querySelectorAll('.add-btn').forEach(b => { b.textContent = '+ Add'; b.classList.remove('in-cart'); });
    showToast(`Order #${res.data.orderId} placed! Total $${res.data.total.toFixed(2)} 🎉`);
  } catch (err) {
    showToast(err.message || 'Checkout failed', 'error');
  }
}

// ── Wishlist ─────────────────────────────────────────────────
async function handleWishlistToggle(productId) {
  if (!state.user) { openAuthModal('login'); showToast('Log in to save books', 'error'); return; }
  const isWishlisted = state.wishlistIds.has(productId);
  try {
    if (isWishlisted) {
      await removeFromWishlist(productId);
      state.wishlistIds.delete(productId);
      showToast('Removed from wishlist');
    } else {
      await addToWishlist(productId);
      state.wishlistIds.add(productId);
      showToast('Saved to wishlist ♥');
    }
    // Update heart button
    const btn = document.querySelector(`.heart-btn[data-product-id="${productId}"]`);
    if (btn) {
      btn.classList.toggle('wishlisted', !isWishlisted);
      btn.textContent = !isWishlisted ? '♥' : '♡';
    }
  } catch (err) { showToast(err.message || 'Error', 'error'); }
}

async function openWishlist() {
  if (!state.user) { openAuthModal('login'); return; }
  document.getElementById('wishlistModal').classList.add('open');
  document.getElementById('wishlistModal').setAttribute('aria-hidden', 'false');
  const body = document.getElementById('wishlistBody');
  body.innerHTML = '<p style="color:var(--text-3);font-size:13px">Loading…</p>';
  try {
    const res  = await fetchWishlist();
    const ids  = cartProductIds();
    renderWishlist(res.data, ids);
  } catch (err) { body.innerHTML = `<p style="color:var(--error)">Error loading wishlist</p>`; }
}

function closeWishlist() {
  document.getElementById('wishlistModal').classList.remove('open');
  document.getElementById('wishlistModal').setAttribute('aria-hidden', 'true');
}

// ── Orders modal ─────────────────────────────────────────────
async function openOrders() {
  if (!state.user) { openAuthModal('login'); return; }
  document.getElementById('ordersModal').classList.add('open');
  document.getElementById('ordersModal').setAttribute('aria-hidden', 'false');
  const body = document.getElementById('ordersBody');
  body.innerHTML = '<p style="color:var(--text-3);font-size:13px">Loading…</p>';
  try {
    const res = await fetchOrders();
    renderOrderHistory(res.data);
  } catch (err) { body.innerHTML = `<p style="color:var(--error)">Error loading orders</p>`; }
}

function closeOrders() {
  document.getElementById('ordersModal').classList.remove('open');
  document.getElementById('ordersModal').setAttribute('aria-hidden', 'true');
}

// ── Product modal ────────────────────────────────────────────
async function openModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  openProductModal(product, cartProductIds().has(productId));
  // Load reviews + similar in parallel
  try {
    const [revRes, simRes] = await Promise.all([fetchReviews(productId), fetchSimilar(productId)]);
    renderModalReviews(revRes, productId);
    renderSimilar(simRes.data, cartProductIds());
  } catch (err) { console.error('modal extras:', err); }
}

// ── Reviews in modal ─────────────────────────────────────────
async function handleSubmitReview(productId, rating, body) {
  if (!state.user) { openAuthModal('login'); return; }
  try {
    await submitReview(productId, { rating, body });
    showToast('Review submitted!');
    const revRes = await fetchReviews(productId);
    renderModalReviews(revRes, productId);
  } catch (err) { showToast(err.message || 'Could not submit review', 'error'); }
}

async function handleDeleteReview(reviewId, productId) {
  const ok = await requestConfirmation({
    kicker: 'Review',
    title: 'Delete this review?',
    message: 'This removes the review from the product page.',
    confirmText: 'Delete review',
    danger: true,
  });
  if (!ok) return;

  try {
    await deleteReview(reviewId);
    showToast('Review deleted');
    const revRes = await fetchReviews(productId);
    renderModalReviews(revRes, productId);
  } catch (err) { showToast(err.message || 'Error', 'error'); }
}

// ── Autocomplete ─────────────────────────────────────────────
const debouncedAutocomplete = debounce(async (q) => {
  if (!q || q.length < 2) { closeAutocomplete(); return; }
  try {
    const res = await fetchAutocomplete(q);
    renderAutocomplete(res.data);
  } catch { closeAutocomplete(); }
}, 200);

function loadAutocomplete(q) { debouncedAutocomplete(q); }

function closeAutocomplete() {
  const el = document.getElementById('autocompleteDropdown');
  if (el) { el.classList.remove('open'); el.innerHTML = ''; }
}

function selectAutocomplete(title, author) {
  document.getElementById('searchInput').value = title;
  state.search = title;
  state.pagination.page = 1;
  closeAutocomplete();
  renderSkeletons(8);
  loadProducts();
}

// ── Mobile cart ──────────────────────────────────────────────
function toggleMobileCart() {
  const panel   = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartDrawerOverlay');
  const isOpen  = panel.classList.contains('mobile-open');
  panel.classList.toggle('mobile-open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
}

// ── Auth handlers ────────────────────────────────────────────
function openAuthModal(view = 'login') {
  state.authView = view;
  renderAuthModal(view);
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authModal').setAttribute('aria-hidden', 'false');
  setTimeout(() => { const f = document.querySelector('#authModal input'); if (f) f.focus(); }, 80);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
  document.getElementById('authModal').setAttribute('aria-hidden', 'true');
  const errEl = document.getElementById('authError');
  if (errEl) errEl.textContent = '';
}

function switchAuthView(view) {
  state.authView = view;
  renderAuthModal(view);
  const errEl = document.getElementById('authError');
  if (errEl) errEl.textContent = '';
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl    = document.getElementById('authError');
  const btn      = e.target.querySelector('button[type="submit"]');
  if (errEl) errEl.textContent = '';
  if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }
  try {
    const res = await apiRegister({ username, email, password });
    setToken(res.data.token); setStoredUser(res.data.user); state.user = res.data.user;
    closeAuthModal(); renderHeader();
    await loadCart();
    await loadWishlistIds();
    showToast(`Welcome, ${res.data.user.username}! 🎉`);
  } catch (err) {
    if (errEl) errEl.textContent = err.message || 'Registration failed.';
    if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('authError');
  const btn      = e.target.querySelector('button[type="submit"]');
  if (errEl) errEl.textContent = '';
  if (!email || !password) { if (errEl) errEl.textContent = 'Please enter your email and password.'; return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; }
  try {
    const res = await apiLogin({ email, password });
    setToken(res.data.token); setStoredUser(res.data.user); state.user = res.data.user;
    closeAuthModal(); renderHeader();
    await loadCart();
    await loadWishlistIds();
    // Re-render products to show heart states
    renderProducts(state.products, cartProductIds(), state.wishlistIds);
    updateProductCount();
    showToast(`Welcome back, ${res.data.user.username}!`);
  } catch (err) {
    if (errEl) errEl.textContent = err.message || 'Login failed. Please check your credentials.';
    if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
  }
}

function handleLogout() {
  requestConfirmation({
    kicker: 'Account',
    title: 'Log out?',
    message: 'You will return to guest browsing on this device.',
    confirmText: 'Log out',
  }).then(ok => {
    if (!ok) return;
  removeToken(); removeStoredUser();
  state.user = null; state.adminView = false; state.wishlistIds = new Set();
  localStorage.removeItem('inkbound_session');
  state.cart = { items: [], subtotal: 0, item_count: 0 };
  renderCart(state.cart);
  renderHeader();
  // Re-render to remove heart states
  renderProducts(state.products, new Set(), new Set());
  updateProductCount();
  document.getElementById('adminPanel').style.display = 'none';
  document.querySelector('.page-body').style.display  = '';
  showToast('Logged out');
  });
}

// ── Admin panel ──────────────────────────────────────────────
async function openAdminPanel() {
  state.adminView = true;
  document.querySelector('.page-body').style.display = 'none';
  const panel = document.getElementById('adminPanel');
  panel.style.display = 'block';
  panel.innerHTML = '<p class="admin-loading">Loading…</p>';
  try {
    const [cartsRes, analyticsRes, ordersRes] = await Promise.all([
      apiGetAllUserCarts(),
      apiGetAnalytics(),
      apiGetAllOrders(),
    ]);
    renderAdminPanel(cartsRes.data, analyticsRes.data, ordersRes.data);
  } catch (err) {
    panel.innerHTML = `<p class="admin-error">⚠️ ${err.message}</p>`;
  }
}

function closeAdminPanel() {
  state.adminView = false;
  document.getElementById('adminPanel').style.display = 'none';
  document.querySelector('.page-body').style.display  = '';
}

// ── Static event bindings ────────────────────────────────────
function bindStaticEvents() {
  document.getElementById('modalClose').addEventListener('click', closeProductModal);
  document.getElementById('modalAddBtn').addEventListener('click', e => {
    const id = Number(e.currentTarget.dataset.productId);
    if (id && !cartProductIds().has(id)) { handleAddToCart(id); closeProductModal(); }
  });
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProductModal();
  });
  document.getElementById('cartDrawerOverlay').addEventListener('click', toggleMobileCart);
  document.getElementById('confirmCancelBtn')?.addEventListener('click', () => closeConfirmation(false));
  document.getElementById('confirmAcceptBtn')?.addEventListener('click', () => closeConfirmation(true));
  document.getElementById('confirmOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeConfirmation(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeConfirmation(false);
      closeProductModal();
      closeWishlist();
      closeOrders();
      closeAutocomplete();
      if (document.getElementById('cartPanel').classList.contains('mobile-open')) toggleMobileCart();
    }
  });
  // Close autocomplete on outside click
  document.addEventListener('click', e => {
    if (!document.getElementById('searchBar')?.contains(e.target)) closeAutocomplete();
  });
}
