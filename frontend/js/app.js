//This will manage application state, user interactions, and coordinate between the API and UI rendering.

const state = {
  products:   [],
  categories: [],
  cart:       { items: [], subtotal: 0, item_count: 0 },
  filter:     { categoryId: null, genreId: null, categoryName: '', genreName: '' },
  refine:     { minPrice: '', maxPrice: '', minRating: 0, availability: 'all' },
  coupon:     null,
  search:     '',
  sort:       'title',
  viewMode:   localStorage.getItem('inkbound_view_mode') || 'grid',
  loading:    false,
  wishlistIds: new Set(),
  pagination: { page: 1, totalPages: 1, total: 0 },
  user:       getStoredUser(),
  authView:   'login',
  adminView:  false,
};

function getAppSnapshot() {
  const catalogProducts = window.INKBOUND_STATIC_CATALOG?.products || [];
  const products = state.products.length ? state.products : catalogProducts.slice(0, 24);
  return {
    products,
    categories: state.categories,
    cart: state.cart,
    user: state.user,
    filter: state.filter,
    refine: state.refine,
    search: state.search,
    sort: state.sort,
    viewMode: state.viewMode,
    wishlistCount: state.wishlistIds.size,
    totalProducts: state.pagination.total || catalogProducts.length || state.products.length,
  };
}

function emitAppSnapshot(reason = 'state') {
  window.InkboundApp = {
    getSnapshot: getAppSnapshot,
    openBook: openModal,
    openWishlist,
    openOrders,
    openAdminPanel,
    openCheckout,
    applyCollection,
    setViewMode,
    handleSortChange,
  };
  window.dispatchEvent(new CustomEvent('inkbound:state', {
    detail: { reason, snapshot: getAppSnapshot() },
  }));
}

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

const debouncedAdvancedFilterChange = debounce(() => handleAdvancedFilterChange(), 320);

// ── Startup ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  renderSkeletons(8);
  renderHeader();
  await Promise.all([loadCategories(), loadCart()]);
  await loadProducts();
  renderViewControls(state.viewMode);
  renderEditorialShelves(getCatalogHighlights());
  if (state.user) loadWishlistIds();
  bindStaticEvents();
  emitAppSnapshot('ready');
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
      minPrice: state.refine.minPrice,
      maxPrice: state.refine.maxPrice,
      minRating: state.refine.minRating,
      availability: state.refine.availability,
      author: state.refine.author,
    });
    if (append) {
      state.products = [...state.products, ...res.data];
    } else {
      state.products = res.data;
    }
    state.pagination = { ...state.pagination, ...res.pagination };
    renderProducts(state.products, cartProductIds(), state.wishlistIds, append, state.viewMode);
    updateSectionHeading();
    updateProductCount();
    emitAppSnapshot('products');
    // Show/hide load more
    const lmc = document.getElementById('loadMoreContainer');
    if (lmc) lmc.style.display = state.pagination.page < state.pagination.totalPages ? 'block' : 'none';
  } catch (err) {
    console.error('loadProducts:', err);
    document.getElementById('productGrid').innerHTML =
      '<p class="no-results">⚠️ Could not load products. Is the server running?</p>';
  }
}

function handleAdvancedFilterChange() {
  state.refine = {
    minPrice: document.getElementById('minPriceFilter')?.value || '',
    maxPrice: document.getElementById('maxPriceFilter')?.value || '',
    minRating: Number(document.getElementById('ratingFilter')?.value || 0),
    availability: document.getElementById('availabilityFilter')?.value || 'all',
    author: document.getElementById('authorFilter')?.value.trim() || '',
  };
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
}

function clearAdvancedFilters() {
  ['minPriceFilter', 'maxPriceFilter', 'authorFilter'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
  const rating = document.getElementById('ratingFilter');
  const availability = document.getElementById('availabilityFilter');
  if (rating) rating.value = '0';
  if (availability) availability.value = 'all';
  handleAdvancedFilterChange();
}

function setViewMode(mode) {
  state.viewMode = ['grid', 'shelf', 'compact', 'spotlight'].includes(mode) ? mode : 'grid';
  localStorage.setItem('inkbound_view_mode', state.viewMode);
  renderViewControls(state.viewMode);
  renderProducts(state.products, cartProductIds(), state.wishlistIds, false, state.viewMode);
  updateProductCount();
  emitAppSnapshot('view-mode');
}

async function loadCart() {
  try {
    const res  = await fetchCart();
    state.cart = res.data;
    renderCart(state.cart, state.coupon);
    emitAppSnapshot('cart-add');
    emitAppSnapshot('cart');
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
  else if (categoryName) el.textContent = displayCategoryName(categoryName);
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
    state.filter = { categoryId, genreId: null, categoryName: displayCategoryName(cat?.name || ''), genreName: '' };
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
    state.filter = { categoryId, genreId: null, categoryName: displayCategoryName(cat?.name || ''), genreName: '' };
  } else {
    state.filter = { categoryId, genreId, categoryName: displayCategoryName(cat?.name || ''), genreName };
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
    renderCart(state.cart, state.coupon);
    emitAppSnapshot('cart-update');
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
    renderCart(state.cart, state.coupon);
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
    renderCart(state.cart, state.coupon);
    emitAppSnapshot('cart-remove');
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
    state.coupon = null;
    renderCart(state.cart, state.coupon);
    emitAppSnapshot('cart-clear');
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
  openCheckout();
}

function calculateCheckoutTotals() {
  const subtotal = Number(state.cart.subtotal || 0);
  const discount = state.coupon ? Number((subtotal * state.coupon.percent).toFixed(2)) : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount >= 35 ? 0 : 4.95;
  const tax = Number(((afterDiscount + shipping) * 0.08).toFixed(2));
  const grandTotal = Number((afterDiscount + shipping + tax).toFixed(2));
  return { subtotal, discount, afterDiscount, shipping, tax, grandTotal };
}

function handleApplyCoupon() {
  const input = document.getElementById('couponInput');
  const code = String(input?.value || '').trim().toUpperCase();
  const coupons = {
    INK10: { code: 'INK10', percent: 0.10, label: '10% off' },
    LUXE15: { code: 'LUXE15', percent: 0.15, label: '15% off' },
    MANGA20: { code: 'MANGA20', percent: 0.20, label: '20% off' },
  };
  state.coupon = coupons[code] || null;
  renderCart(state.cart, state.coupon);
  emitAppSnapshot('coupon');
  showToast(state.coupon ? `${state.coupon.code} applied` : 'Coupon not found', state.coupon ? 'default' : 'error');
}

function openCheckout() {
  renderCheckout(state.cart, state.coupon, calculateCheckoutTotals());
  document.getElementById('checkoutModal').classList.add('open');
  document.getElementById('checkoutModal').setAttribute('aria-hidden', 'false');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
  document.getElementById('checkoutModal').setAttribute('aria-hidden', 'true');
}

async function submitCheckout(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const address = {
    name: form.fullName.value.trim(),
    line1: form.address.value.trim(),
    city: form.city.value.trim(),
    postcode: form.postcode.value.trim(),
  };
  const paymentMethod = form.paymentMethod.value;
  const shipping = Number(state.cart.subtotal || 0) >= 35 ? 0 : 4.95;
  const { tax, grandTotal, discount } = calculateCheckoutTotals();
  const ok = await requestConfirmation({
    kicker: 'Checkout',
    title: 'Place this order?',
    message: `${state.cart.item_count} item${state.cart.item_count !== 1 ? 's' : ''} will be prepared for ${address.name}. Estimated total $${grandTotal.toFixed(2)}.`,
    confirmText: 'Place order',
  });
  if (!ok) return;

  try {
    const res  = await placeOrder({
      address,
      payment_method: paymentMethod,
      coupon_code: state.coupon?.code || null,
      discount_amount: discount,
    });
    renderReceipt({
      orderId: res.data.orderId,
      subtotal: state.cart.subtotal,
      shipping,
      tax,
      total: grandTotal,
      discount,
      coupon: state.coupon,
      items: state.cart.items,
      eta: res.data.fulfillment_eta,
    });
    state.cart = { items: [], subtotal: 0, item_count: 0 };
    state.coupon = null;
    closeCheckout();
    renderCart(state.cart, state.coupon);
    emitAppSnapshot('order');
    document.querySelectorAll('.add-btn').forEach(b => { b.textContent = '+ Add'; b.classList.remove('in-cart'); });
    showToast(`Order #${res.data.orderId} placed`);
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
    emitAppSnapshot('wishlist');
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

function closeReceipt() {
  document.getElementById('receiptModal').classList.remove('open');
  document.getElementById('receiptModal').setAttribute('aria-hidden', 'true');
}

// ── Product modal ────────────────────────────────────────────
async function openModal(productId) {
  const product = state.products.find(p => p.id === productId)
    || window.INKBOUND_STATIC_CATALOG?.products?.find(p => p.id === productId);
  if (!product) return;
  rememberRecentlyViewed(product);
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

function openCommandPalette() {
  const overlay = document.getElementById('commandPalette');
  const input = document.getElementById('commandInput');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  input.value = '';
  renderCommandResults('', getCommandResults(''));
  setTimeout(() => input.focus(), 40);
}

function closeCommandPalette() {
  const overlay = document.getElementById('commandPalette');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

function getCommandResults(query) {
  const q = query.trim().toLowerCase();
  const actions = [
    { type: 'action', label: 'Open wishlist', detail: 'Saved books', run: () => openWishlist() },
    { type: 'action', label: 'Open orders', detail: 'Order history', run: () => openOrders() },
    { type: 'action', label: 'Toggle theme', detail: 'Light / dark', run: () => handleThemeToggle() },
    { type: 'action', label: 'Shelf view', detail: 'Editorial browsing layout', run: () => setViewMode('shelf') },
    { type: 'action', label: 'Grid view', detail: 'Classic store grid', run: () => setViewMode('grid') },
    { type: 'action', label: 'Spotlight view', detail: 'Full-bleed cover browsing', run: () => setViewMode('spotlight') },
    { type: 'action', label: 'Save current filters', detail: 'Add a local collection shortcut', run: () => saveCurrentFilterCollection() },
  ];
  const collections = [
    { type: 'collection', label: 'Staff picks', detail: 'Top rated titles', run: () => applyCollection('rating') },
    { type: 'collection', label: 'Award winners', detail: 'Highest rated literary shelf', run: () => applyCollection('awards') },
    { type: 'collection', label: 'Dark academia', detail: 'Moody classics and mysteries', run: () => applyCollection('dark') },
    { type: 'collection', label: 'Under $20', detail: 'Budget shelf', run: () => applyCollection('under20') },
    { type: 'collection', label: 'Low stock', detail: 'Almost gone', run: () => applyCollection('low') },
    { type: 'collection', label: 'Manga essentials', detail: 'Manga', run: () => applyCategoryBySlug('manga') },
    { type: 'collection', label: 'Light Novel Starter Pack', detail: 'Fantasy and portal picks', run: () => applyCategoryBySlug('light-novels') },
    { type: 'collection', label: 'Graphic Novel Icons', detail: 'Visual storytelling shelf', run: () => applyCategoryBySlug('graphic-novels') },
    ...getSavedFilterCollections(),
  ];
  const productResults = (window.INKBOUND_STATIC_CATALOG?.products || state.products)
    .filter(p => !q || `${p.title} ${p.author} ${p.genre_name}`.toLowerCase().includes(q))
    .slice(0, 7)
    .map(p => ({ type: 'book', label: p.title, detail: `${p.author} · $${Number(p.price).toFixed(2)}`, image_url: p.image_url, run: () => openModal(p.id) }));
  return [...actions, ...collections, ...productResults]
    .filter(item => !q || `${item.label} ${item.detail}`.toLowerCase().includes(q))
    .slice(0, 10);
}

function executeCommand(index) {
  const input = document.getElementById('commandInput');
  const result = getCommandResults(input.value)[index];
  if (!result) return;
  closeCommandPalette();
  result.run();
}

function applyCollection(kind) {
  handleClearFilter();
  if (kind === 'rating' || kind === 'awards') {
    const rating = document.getElementById('ratingFilter');
    if (rating) rating.value = kind === 'awards' ? '4.6' : '4.5';
  }
  if (kind === 'dark') {
    document.getElementById('searchInput').value = 'dark';
    state.search = 'dark';
  }
  if (kind === 'under20') {
    const max = document.getElementById('maxPriceFilter');
    if (max) max.value = '20';
  }
  if (kind === 'low') {
    const availability = document.getElementById('availabilityFilter');
    if (availability) availability.value = 'low';
  }
  handleAdvancedFilterChange();
  document.getElementById('sectionHeadingText')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveCurrentFilterCollection() {
  const name = prompt('Name this collection');
  if (!name) return;
  const saved = getSavedFilterCollectionsRaw();
  saved.push({ name, filter: state.filter, refine: state.refine, search: state.search, sort: state.sort });
  localStorage.setItem('inkbound_saved_filters', JSON.stringify(saved.slice(-8)));
  showToast('Collection saved');
}

function getSavedFilterCollectionsRaw() {
  try { return JSON.parse(localStorage.getItem('inkbound_saved_filters') || '[]'); }
  catch { return []; }
}

function getSavedFilterCollections() {
  return getSavedFilterCollectionsRaw().map((item, index) => ({
    type: 'collection',
    label: item.name,
    detail: 'Saved filter collection',
    run: () => applySavedFilterCollection(index),
  }));
}

function applySavedFilterCollection(index) {
  const item = getSavedFilterCollectionsRaw()[index];
  if (!item) return;
  state.filter = item.filter || state.filter;
  state.refine = item.refine || state.refine;
  state.search = item.search || '';
  state.sort = item.sort || 'title';
  document.getElementById('searchInput').value = state.search;
  renderSidebar(state.categories, state.filter, handleCategoryClick, handleGenreClick);
  renderFilterPill(state.filter.categoryName, state.filter.genreName);
  renderSkeletons(8);
  loadProducts();
}

function applyCategoryBySlug(slug) {
  const category = state.categories.find(cat => cat.slug === slug);
  if (!category) return;
  state.filter = { categoryId: category.id, genreId: null, categoryName: displayCategoryName(category.name), genreName: '' };
  renderSidebar(state.categories, state.filter, handleCategoryClick, handleGenreClick);
  renderFilterPill(state.filter.categoryName, '');
  state.pagination.page = 1;
  renderSkeletons(8);
  loadProducts();
}

function getCatalogHighlights() {
  const all = window.INKBOUND_STATIC_CATALOG?.products || state.products || [];
  const byRating = [...all].sort((a, b) => Number(b.goodreads_rating || 0) - Number(a.goodreads_rating || 0)).slice(0, 8);
  const recent = getRecentlyViewed();
  const newArrivals = [...all].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 8);
  const trendingManga = all.filter(p => p.category_slug === 'manga').sort((a, b) => Number(b.goodreads_rating || 0) - Number(a.goodreads_rating || 0)).slice(0, 8);
  const awardWinners = byRating.slice(0, 8);
  const darkAcademia = all.filter(p => `${p.title} ${p.genre_name} ${p.description}`.toLowerCase().match(/dark|mystery|classic|horror|literary|school|secret/)).slice(0, 8);
  const continueShopping = state.filter.categoryId
    ? all.filter(p => p.category_id === state.filter.categoryId).slice(0, 8)
    : recent;
  return { byRating, recent, newArrivals, trendingManga, awardWinners, darkAcademia, continueShopping };
}

function rememberRecentlyViewed(product) {
  try {
    const key = 'inkbound_recently_viewed';
    const current = JSON.parse(localStorage.getItem(key) || '[]').filter(id => id !== product.id);
    localStorage.setItem(key, JSON.stringify([product.id, ...current].slice(0, 12)));
    renderEditorialShelves(getCatalogHighlights());
  } catch {}
}

function getRecentlyViewed() {
  try {
    const ids = JSON.parse(localStorage.getItem('inkbound_recently_viewed') || '[]');
    const all = window.INKBOUND_STATIC_CATALOG?.products || [];
    return ids.map(id => all.find(p => p.id === id)).filter(Boolean).slice(0, 8);
  } catch { return []; }
}

async function handleAdminStatusChange(orderId, status) {
  try {
    await apiUpdateOrderStatus(orderId, status);
    showToast(`Order #${orderId} marked ${status}`);
    openAdminPanel();
  } catch (err) {
    showToast(err.message || 'Could not update order', 'error');
  }
}

async function handleAdminUserUpdate(userId, field, value) {
  try {
    await apiUpdateAdminUser(userId, { [field]: value });
    showToast('User updated');
    openAdminPanel();
  } catch (err) { showToast(err.message || 'Could not update user', 'error'); }
}

async function handleAdminProductSave(e, productId = null) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = {
    title: form.title.value.trim(),
    author: form.author.value.trim(),
    price: Number(form.price.value || 0),
    stock: Number(form.stock.value || 0),
    category_id: Number(form.category_id.value || 1),
    genre_id: Number(form.genre_id.value || 1),
    image_url: form.image_url.value.trim(),
    description: form.description.value.trim(),
  };
  try {
    if (productId) await apiUpdateAdminProduct(productId, data);
    else await apiCreateAdminProduct(data);
    showToast(productId ? 'Product updated' : 'Product created');
    openAdminPanel();
  } catch (err) { showToast(err.message || 'Could not save product', 'error'); }
}

async function handleAdminProductDelete(productId) {
  const ok = await requestConfirmation({
    kicker: 'Product manager',
    title: 'Delete this title?',
    message: 'This removes the product from the catalog.',
    confirmText: 'Delete',
    danger: true,
  });
  if (!ok) return;
  try {
    await apiDeleteAdminProduct(productId);
    showToast('Product deleted');
    openAdminPanel();
  } catch (err) { showToast(err.message || 'Could not delete product', 'error'); }
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
    emitAppSnapshot('register');
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
    renderProducts(state.products, cartProductIds(), state.wishlistIds, false, state.viewMode);
    updateProductCount();
    emitAppSnapshot('login');
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
  state.coupon = null;
  renderCart(state.cart, state.coupon);
  renderHeader();
  // Re-render to remove heart states
  renderProducts(state.products, new Set(), new Set(), false, state.viewMode);
  updateProductCount();
  emitAppSnapshot('logout');
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
    const [cartsRes, analyticsRes, ordersRes, usersRes, productsRes, reviewsRes] = await Promise.all([
      apiGetAllUserCarts(),
      apiGetAnalytics(),
      apiGetAllOrders(),
      apiGetAdminUsers(),
      apiGetAdminProducts(),
      apiGetAdminReviews(),
    ]);
    renderAdminPanel(cartsRes.data, analyticsRes.data, ordersRes.data, {
      users: usersRes.data,
      products: productsRes.data,
      reviews: reviewsRes.data,
      categories: state.categories,
    });
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
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
      return;
    }
    if (!isTyping && e.key === '/') {
      e.preventDefault();
      openCommandPalette();
      return;
    }
    if (e.key === 'Escape') {
      closeConfirmation(false);
      closeCommandPalette();
      closeReceipt();
      closeCheckout();
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
  document.getElementById('commandPalette')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCommandPalette();
  });
  document.getElementById('commandInput')?.addEventListener('input', e => {
    renderCommandResults(e.target.value, getCommandResults(e.target.value));
  });
  document.getElementById('commandInput')?.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    executeCommand(0);
  });
}
