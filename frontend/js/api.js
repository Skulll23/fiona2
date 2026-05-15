//All backend communication. This will make fetch request and return raw data. It will not do any DOM manipulation or UI rendering, which is handled in ui.js

const API_BASE = window.location.protocol === 'file:'
  ? 'http://localhost:3000/api'
  : '/api';

function clearLegacySession() {
  localStorage.removeItem('inkbound_token');
  localStorage.removeItem('inkbound_user');
}

// ── Session ────────────────────────────────────────────────────
// When logged in:  use a stable user-specific key so every user has
//                  their own isolated cart regardless of which browser
//                  session or UUID happens to be in localStorage.
// When logged out: use a random UUID guest session.
//                  On logout we delete this UUID so the very next
//                  login (even a different account on the same machine)
//                  always starts from an empty guest cart.
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getSessionId() {
  // If there is a stored user, use a deterministic per-user session key.
  const user = getStoredUser();
  if (user && user.id) {
    return `user_session_${user.id}`;
  }
  // Guest path — generate a UUID once and keep it until logout clears it.
  let id = localStorage.getItem('inkbound_session');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('inkbound_session', id);
  }
  return id;
}

// ── Auth token helpers (JWT stored in localStorage) ──────────
function getToken() {
  const token = localStorage.getItem('inkbound_token');
  if (token?.startsWith('static-token-')) {
    clearLegacySession();
    return null;
  }
  return token;
}
function setToken(t)     { localStorage.setItem('inkbound_token', t); }
function removeToken()   { localStorage.removeItem('inkbound_token'); }

function getStoredUser() {
  if (localStorage.getItem('inkbound_token')?.startsWith('static-token-')) {
    clearLegacySession();
    return null;
  }
  try { return JSON.parse(localStorage.getItem('inkbound_user') || 'null'); }
  catch { return null; }
}
function setStoredUser(u)  { localStorage.setItem('inkbound_user', JSON.stringify(u)); }
function removeStoredUser(){ localStorage.removeItem('inkbound_user'); }

// ── Base fetch helper ────────────────────────────────────────
// Automatically attaches x-session-id and Authorization Bearer token on every request
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': getSessionId(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  try {
    const res  = await fetch(`${API_BASE}${endpoint}`, config);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
    return json;
  } catch (err) {
    throw err;
  }
}

// ── Products ─────────────────────────────────────────────────

async function fetchCategories() {
  return apiFetch('/products/categories');
}


// ── Cart ─────────────────────────────────────────────────────

async function fetchCart() {
  return apiFetch('/cart');
}

async function addToCart(productId, quantity = 1) {
  return apiFetch('/cart', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

async function updateCartItem(productId, quantity) {
  return apiFetch(`/cart/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

async function removeCartItem(productId) {
  return apiFetch(`/cart/${productId}`, { method: 'DELETE' });
}

async function clearCart() {
  return apiFetch('/cart', { method: 'DELETE' });
}

// ── Auth ─────────────────────────────────────────────────────

async function apiRegister({ username, email, password }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

async function apiLogin({ email, password }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function apiGetMe() {
  return apiFetch('/auth/me');
}

// ── Admin ─────────────────────────────────────────────────────

async function apiGetAllUserCarts() { return apiFetch('/admin/users-carts'); }
async function apiGetAnalytics()    { return apiFetch('/admin/analytics'); }
async function apiGetAllOrders()    { return apiFetch('/admin/orders'); }
async function apiGetAdminUsers()   { return apiFetch('/admin/users'); }
async function apiGetAdminReviews() { return apiFetch('/admin/reviews'); }
async function apiGetAdminProducts(){ return apiFetch('/admin/products'); }
async function apiUpdateAdminUser(userId, data) {
  return apiFetch(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });
}
async function apiCreateAdminProduct(data) {
  return apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(data) });
}
async function apiUpdateAdminProduct(id, data) {
  return apiFetch(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
async function apiDeleteAdminProduct(id) {
  return apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
}
async function apiUpdateOrderStatus(orderId, status) {
  return apiFetch(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Products (with pagination/sort/filter) ────────────────────

async function fetchProducts(categoryId = null, genreId = null, search = null, extra = {}) {
  const params = new URLSearchParams();
  if (categoryId)       params.append('categoryId', categoryId);
  if (genreId)          params.append('genreId',    genreId);
  if (search)           params.append('search',     search);
  if (extra.author)     params.append('author',     extra.author);
  if (extra.sort)       params.append('sort',       extra.sort);
  if (extra.minPrice)   params.append('minPrice',   extra.minPrice);
  if (extra.maxPrice)   params.append('maxPrice',   extra.maxPrice);
  if (extra.minRating)  params.append('minRating',  extra.minRating);
  if (extra.availability) params.append('availability', extra.availability);
  if (extra.page)       params.append('page',       extra.page);
  if (extra.limit)      params.append('limit',      extra.limit || 24);
  const query = params.toString() ? `?${params}` : '';
  return apiFetch(`/products${query}`);
}

async function fetchAutocomplete(q) {
  return apiFetch(`/products/autocomplete?q=${encodeURIComponent(q)}`);
}

async function fetchSimilar(productId) {
  return apiFetch(`/products/${productId}/similar`);
}

// ── Wishlist ──────────────────────────────────────────────────

async function fetchWishlist()         { return apiFetch('/wishlist'); }
async function fetchWishlistIds()      { return apiFetch('/wishlist/ids'); }
async function addToWishlist(id)       { return apiFetch(`/wishlist/${id}`, { method: 'POST' }); }
async function removeFromWishlist(id)  { return apiFetch(`/wishlist/${id}`, { method: 'DELETE' }); }

// ── Orders ────────────────────────────────────────────────────

async function placeOrder(payload = {}) {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
}
async function fetchOrders()    { return apiFetch('/orders'); }

// ── Reviews ───────────────────────────────────────────────────

async function fetchReviews(productId) { return apiFetch(`/reviews/${productId}`); }
async function submitReview(productId, { rating, body }) {
  return apiFetch(`/reviews/${productId}`, {
    method: 'POST',
    body: JSON.stringify({ rating, body }),
  });
}
async function deleteReview(reviewId) {
  return apiFetch(`/reviews/${reviewId}`, { method: 'DELETE' });
}
