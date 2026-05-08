//All backend communication. This will make fetch request and return raw data. It will not do any DOM manipulation or UI rendering, which is handled in ui.js

const API_BASE = '/api';

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
function getToken()      { return localStorage.getItem('inkbound_token'); }
function setToken(t)     { localStorage.setItem('inkbound_token', t); }
function removeToken()   { localStorage.removeItem('inkbound_token'); }

function getStoredUser() {
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
    const fallback = staticApiFetch(endpoint, config);
    if (fallback) return fallback;
    throw err;
  }
}

// ── Static fallback ──────────────────────────────────────────
// Lets the shop work from frontend/index.html without running Express/MySQL.
function hasStaticCatalog() {
  return Boolean(window.INKBOUND_STATIC_CATALOG?.products?.length);
}

function staticCartKey() {
  return staticCartKeyForSession(getSessionId());
}

function staticCartKeyForSession(sessionId) {
  return `inkbound_static_cart_v2_${sessionId}`;
}

function staticCartKeyForUser(userId) {
  return staticCartKeyForSession(`user_session_${userId}`);
}

function readStaticCart(key = staticCartKey()) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function writeStaticCart(items, key = staticCartKey()) {
  localStorage.setItem(key, JSON.stringify(items));
}

function buildStaticCart(key = staticCartKey()) {
  const products = window.INKBOUND_STATIC_CATALOG.products;
  const items = readStaticCart(key)
    .map(line => {
      const product = products.find(p => p.id === line.product_id);
      if (!product) return null;
      return {
        ...product,
        product_id: product.id,
        quantity: line.quantity,
        line_total: Number((Number(product.price) * line.quantity).toFixed(2)),
      };
    })
    .filter(Boolean);
  const subtotal = Number(items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
  const item_count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { success: true, data: { items, subtotal, item_count } };
}

function sortStaticProducts(products, sort) {
  const sorted = [...products];
  const byText = key => (a, b) => String(a[key]).localeCompare(String(b[key]));
  if (sort === 'price_asc') sorted.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === 'price_desc') sorted.sort((a, b) => Number(b.price) - Number(a.price));
  else if (sort === 'rating') sorted.sort((a, b) => Number(b.goodreads_rating || 0) - Number(a.goodreads_rating || 0));
  else if (sort === 'newest') sorted.sort((a, b) => Number(b.id) - Number(a.id));
  else sorted.sort(byText('title'));
  return sorted;
}

function staticWishlistKey() {
  return `inkbound_static_wishlist_v2_${getStoredUser()?.id || 'guest'}`;
}

function readStaticWishlist() {
  try { return JSON.parse(localStorage.getItem(staticWishlistKey()) || '[]'); }
  catch { return []; }
}

function writeStaticWishlist(ids) {
  localStorage.setItem(staticWishlistKey(), JSON.stringify([...new Set(ids)]));
}

function staticUsersKey() {
  return 'inkbound_static_users_v2';
}

function defaultStaticUsers() {
  return [{
    id: 1,
    username: 'admin',
    email: 'admin@inkbound.com',
    password: 'admin123',
    role: 'admin',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  }];
}

function readStaticUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(staticUsersKey()) || 'null');
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {}
  const users = defaultStaticUsers();
  writeStaticUsers(users);
  return users;
}

function writeStaticUsers(users) {
  localStorage.setItem(staticUsersKey(), JSON.stringify(users));
}

function publicStaticUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function staticTokenFor(user) {
  return `static-token-${user.id}-${user.role}`;
}

function currentStaticUserFromToken() {
  const token = getToken();
  const id = Number(String(token || '').match(/^static-token-(\d+)-/)?.[1]);
  if (!id) return null;
  return readStaticUsers().find(user => user.id === id) || null;
}

function staticOrdersKey() {
  return 'inkbound_static_orders_v2';
}

function readStaticOrders() {
  try { return JSON.parse(localStorage.getItem(staticOrdersKey()) || '[]'); }
  catch { return []; }
}

function writeStaticOrders(orders) {
  localStorage.setItem(staticOrdersKey(), JSON.stringify(orders));
}

function nextStaticOrderId(orders) {
  return Math.max(1000, ...orders.map(order => Number(order.id) || 0)) + 1;
}

function staticApiFetch(endpoint, config = {}) {
  if (!hasStaticCatalog()) return null;

  const url = new URL(endpoint, 'https://inkbound.local');
  const method = (config.method || 'GET').toUpperCase();
  const catalog = window.INKBOUND_STATIC_CATALOG;
  const products = catalog.products;

  if (url.pathname === '/auth/register' && method === 'POST') {
    const body = JSON.parse(config.body || '{}');
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!username || !email || !password) throw new Error('Username, email and password are required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email address');

    const users = readStaticUsers();
    if (users.some(user => user.email.toLowerCase() === email)) throw new Error('Email already registered');
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) throw new Error('Username already taken');

    const user = {
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      username,
      email,
      password,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    users.push(user);
    writeStaticUsers(users);
    return { success: true, message: 'Account created successfully', data: { user: publicStaticUser(user), token: staticTokenFor(user) } };
  }

  if (url.pathname === '/auth/login' && method === 'POST') {
    const body = JSON.parse(config.body || '{}');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = readStaticUsers().find(u => u.email.toLowerCase() === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    return { success: true, message: 'Logged in successfully', data: { user: publicStaticUser(user), token: staticTokenFor(user) } };
  }

  if (url.pathname === '/auth/me' && method === 'GET') {
    const user = currentStaticUserFromToken();
    if (!user) throw new Error('User not found');
    return { success: true, data: publicStaticUser(user) };
  }

  if (url.pathname === '/admin/users-carts' && method === 'GET') {
    const current = currentStaticUserFromToken();
    if (current?.role !== 'admin') throw new Error('Admin access required');
    const data = readStaticUsers().map(user => ({
      ...publicStaticUser(user),
      cart: buildStaticCart(staticCartKeyForUser(user.id)).data,
    }));
    return { success: true, data };
  }

  if (url.pathname === '/admin/analytics' && method === 'GET') {
    const current = currentStaticUserFromToken();
    if (current?.role !== 'admin') throw new Error('Admin access required');
    const orders = readStaticOrders();
    return {
      success: true,
      data: {
        total_users: readStaticUsers().filter(user => user.role !== 'admin').length,
        total_products: products.length,
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      },
    };
  }

  if (url.pathname === '/admin/orders' && method === 'GET') {
    const current = currentStaticUserFromToken();
    if (current?.role !== 'admin') throw new Error('Admin access required');
    const users = readStaticUsers();
    const data = readStaticOrders()
      .map(order => {
        const user = users.find(u => u.id === order.user_id);
        return {
          ...order,
          username: user?.username || 'Unknown',
          email: user?.email || '',
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, data };
  }

  if (method === 'GET' && url.pathname === '/products/categories') {
    return { success: true, data: catalog.categories };
  }

  if (method === 'GET' && url.pathname === '/products') {
    const categoryId = Number(url.searchParams.get('categoryId')) || null;
    const genreId = Number(url.searchParams.get('genreId')) || null;
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const sort = url.searchParams.get('sort') || 'title';
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 500;
    let data = products.filter(p => {
      if (categoryId && Number(p.category_id) !== categoryId) return false;
      if (genreId && Number(p.genre_id) !== genreId) return false;
      if (search && !`${p.title} ${p.author}`.toLowerCase().includes(search)) return false;
      return true;
    });
    data = sortStaticProducts(data, sort);
    const total = data.length;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    return { success: true, data, pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  if (method === 'GET' && url.pathname === '/products/autocomplete') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const data = products
      .filter(p => `${p.title} ${p.author}`.toLowerCase().includes(q))
      .slice(0, 8)
      .map(({ id, title, author }) => ({ id, title, author }));
    return { success: true, data };
  }

  const similarMatch = url.pathname.match(/^\/products\/(\d+)\/similar$/);
  if (method === 'GET' && similarMatch) {
    const product = products.find(p => p.id === Number(similarMatch[1]));
    const data = product
      ? products.filter(p => p.genre_id === product.genre_id && p.id !== product.id).slice(0, 4)
      : [];
    return { success: true, data };
  }

  if (url.pathname === '/cart') {
    if (method === 'GET') return buildStaticCart();
    if (method === 'DELETE') {
      writeStaticCart([]);
      return buildStaticCart();
    }
    if (method === 'POST') {
      const body = JSON.parse(config.body || '{}');
      const productId = Number(body.product_id);
      const quantity = Math.max(1, Number(body.quantity) || 1);
      const cart = readStaticCart();
      const existing = cart.find(item => item.product_id === productId);
      if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
      else cart.push({ product_id: productId, quantity });
      writeStaticCart(cart);
      return buildStaticCart();
    }
  }

  const cartItemMatch = url.pathname.match(/^\/cart\/(\d+)$/);
  if (cartItemMatch) {
    const productId = Number(cartItemMatch[1]);
    let cart = readStaticCart();
    if (method === 'PATCH') {
      const body = JSON.parse(config.body || '{}');
      const item = cart.find(line => line.product_id === productId);
      if (item) item.quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
    }
    if (method === 'DELETE') cart = cart.filter(line => line.product_id !== productId);
    writeStaticCart(cart);
    return buildStaticCart();
  }

  if (method === 'GET' && url.pathname === '/wishlist/ids') {
    return { success: true, data: readStaticWishlist() };
  }

  if (method === 'GET' && url.pathname === '/wishlist') {
    const ids = new Set(readStaticWishlist());
    return { success: true, data: products.filter(p => ids.has(p.id)).map(p => ({ ...p, product_id: p.id })) };
  }

  const wishlistMatch = url.pathname.match(/^\/wishlist\/(\d+)$/);
  if (wishlistMatch) {
    const productId = Number(wishlistMatch[1]);
    let ids = readStaticWishlist();
    if (method === 'POST') ids.push(productId);
    if (method === 'DELETE') ids = ids.filter(id => id !== productId);
    writeStaticWishlist(ids);
    return { success: true, data: readStaticWishlist() };
  }

  if (url.pathname === '/orders') {
    if (method === 'GET') {
      const current = currentStaticUserFromToken();
      if (!current) throw new Error('Please log in to view orders');
      const data = readStaticOrders()
        .filter(order => order.user_id === current.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { success: true, data };
    }
    if (method === 'POST') {
      const current = currentStaticUserFromToken();
      if (!current) throw new Error('Please log in to checkout');
      const cart = buildStaticCart().data;
      if (!cart.items.length) throw new Error('Cart is empty');
      const orders = readStaticOrders();
      const order = {
        id: nextStaticOrderId(orders),
        user_id: current.id,
        total_amount: cart.subtotal,
        total: cart.subtotal,
        status: 'Placed',
        created_at: new Date().toISOString(),
        items: cart.items.map(item => ({
          product_id: item.product_id,
          title: item.title,
          author: item.author,
          image_url: item.image_url,
          quantity: item.quantity,
          unit_price: Number(item.price),
          line_total: Number(item.line_total),
        })),
      };
      orders.push(order);
      writeStaticOrders(orders);
      writeStaticCart([]);
      return { success: true, data: { orderId: order.id, total: cart.subtotal, itemCount: cart.items.length } };
    }
  }

  if (url.pathname.match(/^\/reviews\/\d+$/)) {
    return { success: true, data: [] };
  }

  return null;
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

// ── Products (with pagination/sort/filter) ────────────────────

async function fetchProducts(categoryId = null, genreId = null, search = null, extra = {}) {
  const params = new URLSearchParams();
  if (categoryId)       params.append('categoryId', categoryId);
  if (genreId)          params.append('genreId',    genreId);
  if (search)           params.append('search',     search);
  if (extra.sort)       params.append('sort',       extra.sort);
  if (extra.minPrice)   params.append('minPrice',   extra.minPrice);
  if (extra.maxPrice)   params.append('maxPrice',   extra.maxPrice);
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

async function placeOrder()     { return apiFetch('/orders', { method: 'POST' }); }
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
