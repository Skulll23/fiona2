const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { connectMongo } = require('../config/mongo');

const catalogExport = require('../../database/catalog_export.json');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'inkbound_jwt_secret_key';
const JWT_EXPIRES = '7d';
const ADMIN_HASH = '$2b$10$anXWZyf0cS/DUehl88f4Z.XOt3u6Ed3gLjvqf82Zcsl4F0xZdXCWW';

function publicUser(user) {
  if (!user) return null;
  const { password_hash, password, ...safeUser } = user;
  return {
    ...safeUser,
    disabled: Boolean(user.disabled),
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function getTokenUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

function requireUser(req, res, next) {
  const user = getTokenUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function nextId(items, floor = 0) {
  return Math.max(floor, ...items.map(item => Number(item.id) || 0)) + 1;
}

function normalizeProduct(product) {
  return {
    ...product,
    id: Number(product.id),
    category_id: Number(product.category_id),
    genre_id: Number(product.genre_id),
    price: Number(product.price || 0),
    goodreads_rating: Number(product.goodreads_rating || 0),
    stock: Number(product.stock || 0),
  };
}

function sortProducts(products, sort) {
  const sorted = [...products];
  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case 'rating':
      return sorted.sort((a, b) => Number(b.goodreads_rating || 0) - Number(a.goodreads_rating || 0));
    case 'newest':
      return sorted.sort((a, b) => Number(b.id) - Number(a.id));
    case 'popularity':
      return sorted.sort((a, b) => Number(b.goodreads_rating || 0) * Number(b.stock || 1) - Number(a.goodreads_rating || 0) * Number(a.stock || 1));
    case 'title':
    default:
      return sorted.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  }
}

async function getCollections() {
  const db = await connectMongo();
  return {
    db,
    categories: db.collection('categories'),
    products: db.collection('products'),
    users: db.collection('users'),
    carts: db.collection('carts'),
    wishlists: db.collection('wishlists'),
    orders: db.collection('orders'),
    reviews: db.collection('reviews'),
  };
}

async function ensureMongoSeed() {
  const { categories, products, users, carts, wishlists, orders, reviews } = await getCollections();
  await Promise.all([
    products.createIndex({ id: 1 }, { unique: true }),
    products.createIndex({ title: 'text', author: 'text', genre_name: 'text' }),
    categories.createIndex({ id: 1 }, { unique: true }),
    users.createIndex({ id: 1 }, { unique: true }),
    users.createIndex({ email: 1 }, { unique: true }),
    users.createIndex({ username: 1 }, { unique: true }),
    carts.createIndex({ user_id: 1, product_id: 1 }, { unique: true, sparse: true }),
    carts.createIndex({ session_id: 1, product_id: 1 }),
    wishlists.createIndex({ user_id: 1, product_id: 1 }, { unique: true }),
    orders.createIndex({ id: 1 }, { unique: true }),
    reviews.createIndex({ user_id: 1, product_id: 1 }, { unique: true }),
  ]);

  if ((await categories.countDocuments()) === 0) {
    await categories.insertMany(catalogExport.categories);
  }

  if ((await products.countDocuments()) === 0) {
    await products.insertMany(catalogExport.products.map(normalizeProduct));
  }

  if (!(await users.findOne({ email: 'admin@inkbound.com' }))) {
    await users.insertOne({
      id: 1,
      username: 'admin',
      email: 'admin@inkbound.com',
      password_hash: ADMIN_HASH,
      role: 'admin',
      disabled: false,
      created_at: new Date('2026-01-01T00:00:00Z'),
    });
  }

  await Promise.all([
    carts.createIndex({ added_at: -1 }),
    wishlists.createIndex({ added_at: -1 }),
    orders.createIndex({ created_at: -1 }),
    reviews.createIndex({ created_at: -1 }),
  ]);
}

async function getCartResponse({ sessionId, userId }) {
  const { carts, products } = await getCollections();
  const normalizedUserId = userId ? Number(userId) : null;
  const sessionKeys = [sessionId, normalizedUserId ? `user_session_${normalizedUserId}` : null].filter(Boolean);
  const query = normalizedUserId
    ? { $or: [{ user_id: normalizedUserId }, { session_id: { $in: sessionKeys } }] }
    : { session_id: sessionId };
  const lines = await carts.find(query).sort({ added_at: -1 }).toArray();
  const ids = lines.map(line => Number(line.product_id));
  const productRows = await products.find({ id: { $in: ids } }).toArray();
  const productById = new Map(productRows.map(product => [Number(product.id), product]));
  const items = lines
    .map(line => {
      const product = productById.get(Number(line.product_id));
      if (!product) return null;
      const quantity = Number(line.quantity || 1);
      return {
        cart_item_id: String(line._id),
        product_id: product.id,
        title: product.title,
        author: product.author,
        price: product.price,
        image_url: product.image_url,
        cover_color: product.cover_color,
        category_name: product.category_name,
        genre_name: product.genre_name,
        quantity,
        line_total: Number((Number(product.price) * quantity).toFixed(2)),
        added_at: line.added_at,
      };
    })
    .filter(Boolean);
  const subtotal = Number(items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
  const item_count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, subtotal, item_count };
}

async function userFromDb(userId) {
  const { users } = await getCollections();
  return users.findOne({ id: Number(userId) });
}

router.get('/health', async (req, res) => {
  const { db } = await getCollections();
  res.json({ status: 'ok', database: 'mongodb', name: db.databaseName, timestamp: new Date().toISOString() });
});

router.post('/auth/register', async (req, res) => {
  try {
    const { users, carts } = await getCollections();
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Invalid email address' });
    if (await users.findOne({ email })) return res.status(409).json({ success: false, message: 'Email already registered' });
    if (await users.findOne({ username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    const existing = await users.find({}, { projection: { id: 1 } }).toArray();
    const user = {
      id: nextId(existing),
      username,
      email,
      password_hash: await bcrypt.hash(password, 10),
      role: 'user',
      disabled: false,
      created_at: new Date(),
    };
    await users.insertOne(user);
    const sessionId = req.headers['x-session-id'];
    if (sessionId) await carts.updateMany({ session_id: sessionId }, { $set: { user_id: user.id } });
    res.status(201).json({ success: true, message: 'Account created successfully', data: { user: publicUser(user), token: signToken(user) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { users, carts } = await getCollections();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (user.disabled) return res.status(403).json({ success: false, message: 'This account has been disabled' });
    const sessionId = req.headers['x-session-id'];
    if (sessionId) await carts.updateMany({ session_id: sessionId }, { $set: { user_id: user.id } });
    res.json({ success: true, message: 'Logged in successfully', data: { user: publicUser(user), token: signToken(user) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
});

router.get('/auth/me', requireUser, async (req, res) => {
  const user = await userFromDb(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: publicUser(user) });
});

router.get('/products/categories', async (req, res) => {
  const { categories } = await getCollections();
  const data = await categories.find({}).sort({ display_order: 1, id: 1 }).toArray();
  res.json({ success: true, data });
});

router.get('/products/autocomplete', async (req, res) => {
  const { products } = await getCollections();
  const q = String(req.query.q || '').trim();
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const data = await products.find({ $or: [{ title: rx }, { author: rx }] })
    .project({ id: 1, title: 1, author: 1, image_url: 1, _id: 0 })
    .limit(8)
    .toArray();
  res.json({ success: true, data });
});

router.get('/products/:id/similar', async (req, res) => {
  const { products } = await getCollections();
  const id = Number(req.params.id);
  const product = await products.findOne({ id });
  const data = product
    ? await products.find({ genre_id: product.genre_id, id: { $ne: id } }).limit(4).toArray()
    : [];
  res.json({ success: true, data });
});

router.get('/products/:id', async (req, res) => {
  const { products } = await getCollections();
  const product = await products.findOne({ id: Number(req.params.id) });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

router.get('/products', async (req, res) => {
  const { products } = await getCollections();
  const categoryId = Number(req.query.categoryId) || null;
  const genreId = Number(req.query.genreId) || null;
  const search = String(req.query.search || '').trim();
  const author = String(req.query.author || '').trim();
  const minPrice = Number(req.query.minPrice) || 0;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Infinity;
  const minRating = Number(req.query.minRating) || 0;
  const availability = String(req.query.availability || 'all');
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 24));

  const query = {};
  if (categoryId) query.category_id = categoryId;
  if (genreId) query.genre_id = genreId;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: rx }, { author: rx }, { genre_name: rx }];
  }
  if (author) query.author = new RegExp(author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  query.price = { $gte: minPrice, $lte: maxPrice };
  if (minRating) query.goodreads_rating = { $gte: minRating };
  if (availability === 'available') query.stock = { $gt: 0 };
  if (availability === 'low') query.stock = { $gt: 0, $lte: 12 };

  const total = await products.countDocuments(query);
  const all = await products.find(query).toArray();
  const data = sortProducts(all, req.query.sort || 'title').slice((page - 1) * limit, page * limit);
  res.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

router.get('/cart', async (req, res) => {
  const user = getTokenUser(req);
  const sessionId = req.headers['x-session-id'];
  res.json({ success: true, data: await getCartResponse({ sessionId, userId: user?.id }) });
});

router.post('/cart', async (req, res) => {
  const { carts, products } = await getCollections();
  const user = getTokenUser(req);
  const sessionId = req.headers['x-session-id'];
  const productId = Number(req.body.product_id);
  const quantity = Math.max(1, Math.min(99, Number(req.body.quantity) || 1));
  const product = await products.findOne({ id: productId });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const query = user?.id ? { user_id: user.id, product_id: productId } : { session_id: sessionId, product_id: productId };
  await carts.updateOne(
    query,
    {
      $setOnInsert: { ...query, added_at: new Date() },
      $inc: { quantity },
      $set: { updated_at: new Date() },
    },
    { upsert: true }
  );
  res.status(201).json({ success: true, message: `"${product.title}" added to cart`, data: await getCartResponse({ sessionId, userId: user?.id }) });
});

router.patch('/cart/:productId', async (req, res) => {
  const { carts } = await getCollections();
  const user = getTokenUser(req);
  const sessionId = req.headers['x-session-id'];
  const productId = Number(req.params.productId);
  const quantity = Math.max(1, Math.min(99, Number(req.body.quantity) || 1));
  const query = user?.id
    ? { product_id: productId, $or: [{ user_id: user.id }, { session_id: { $in: [sessionId, `user_session_${user.id}`].filter(Boolean) } }] }
    : { session_id: sessionId, product_id: productId };
  const result = await carts.updateOne(query, { $set: { quantity, updated_at: new Date() } });
  if (!result.matchedCount) return res.status(404).json({ success: false, message: 'Item not in cart' });
  res.json({ success: true, message: 'Quantity updated', data: await getCartResponse({ sessionId, userId: user?.id }) });
});

router.delete('/cart/:productId', async (req, res) => {
  const { carts } = await getCollections();
  const user = getTokenUser(req);
  const sessionId = req.headers['x-session-id'];
  const productId = Number(req.params.productId);
  const query = user?.id
    ? { product_id: productId, $or: [{ user_id: user.id }, { session_id: { $in: [sessionId, `user_session_${user.id}`].filter(Boolean) } }] }
    : { session_id: sessionId, product_id: productId };
  await carts.deleteOne(query);
  res.json({ success: true, message: 'Item removed', data: await getCartResponse({ sessionId, userId: user?.id }) });
});

router.delete('/cart', async (req, res) => {
  const { carts } = await getCollections();
  const user = getTokenUser(req);
  const sessionId = req.headers['x-session-id'];
  await carts.deleteMany(user?.id
    ? { $or: [{ user_id: user.id }, { session_id: { $in: [sessionId, `user_session_${user.id}`].filter(Boolean) } }] }
    : { session_id: sessionId });
  res.json({ success: true, message: 'Cart cleared', data: { items: [], subtotal: 0, item_count: 0 } });
});

router.get('/wishlist/ids', requireUser, async (req, res) => {
  const { wishlists } = await getCollections();
  const rows = await wishlists.find({ user_id: req.user.id }).toArray();
  res.json({ success: true, data: rows.map(row => row.product_id) });
});

router.get('/wishlist', requireUser, async (req, res) => {
  const { wishlists, products } = await getCollections();
  const rows = await wishlists.find({ user_id: req.user.id }).sort({ added_at: -1 }).toArray();
  const ids = rows.map(row => row.product_id);
  const data = await products.find({ id: { $in: ids } }).toArray();
  res.json({ success: true, data: data.map(product => ({ ...product, product_id: product.id })) });
});

router.post('/wishlist/:productId', requireUser, async (req, res) => {
  const { wishlists } = await getCollections();
  const productId = Number(req.params.productId);
  await wishlists.updateOne(
    { user_id: req.user.id, product_id: productId },
    { $setOnInsert: { user_id: req.user.id, product_id: productId, added_at: new Date() } },
    { upsert: true }
  );
  res.json({ success: true, message: 'Added to wishlist' });
});

router.delete('/wishlist/:productId', requireUser, async (req, res) => {
  const { wishlists } = await getCollections();
  await wishlists.deleteOne({ user_id: req.user.id, product_id: Number(req.params.productId) });
  res.json({ success: true, message: 'Removed from wishlist' });
});

router.post('/orders', requireUser, async (req, res) => {
  const { orders, carts, products } = await getCollections();
  const cart = await getCartResponse({ sessionId: req.headers['x-session-id'], userId: req.user.id });
  if (!cart.items.length) return res.status(400).json({ success: false, message: 'Cart is empty' });
  const existingOrders = await orders.find({}, { projection: { id: 1 } }).toArray();
  const discount = Math.max(0, Math.min(cart.subtotal, Number(req.body.discount_amount || 0)));
  const total = Number((cart.subtotal - discount).toFixed(2));
  const order = {
    id: nextId(existingOrders, 1000),
    user_id: req.user.id,
    total_amount: total,
    total,
    status: 'Confirmed',
    created_at: new Date(),
    fulfillment_eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
    address: req.body.address || null,
    payment_method: req.body.payment_method || 'card',
    coupon_code: req.body.coupon_code || null,
    items: cart.items.map(item => ({
      order_id: null,
      product_id: item.product_id,
      title: item.title,
      author: item.author,
      image_url: item.image_url,
      quantity: item.quantity,
      unit_price: item.price,
    })),
  };
  order.items = order.items.map(item => ({ ...item, order_id: order.id }));
  await orders.insertOne(order);
  await Promise.all(cart.items.map(item => products.updateOne({ id: item.product_id }, { $inc: { stock: -item.quantity } })));
  await carts.deleteMany({
    $or: [
      { user_id: req.user.id },
      { session_id: { $in: [req.headers['x-session-id'], `user_session_${req.user.id}`].filter(Boolean) } },
    ],
  });
  res.status(201).json({ success: true, message: 'Order placed!', data: { orderId: order.id, total, itemCount: cart.items.length, fulfillment_eta: order.fulfillment_eta } });
});

router.get('/orders', requireUser, async (req, res) => {
  const { orders } = await getCollections();
  const data = await orders.find({ user_id: req.user.id }).sort({ created_at: -1 }).toArray();
  res.json({ success: true, data });
});

router.get('/reviews/:productId', async (req, res) => {
  const { reviews, users } = await getCollections();
  const rows = await reviews.find({ product_id: Number(req.params.productId) }).sort({ created_at: -1 }).toArray();
  const userRows = await users.find({ id: { $in: rows.map(row => row.user_id) } }).toArray();
  const userById = new Map(userRows.map(user => [user.id, user]));
  const data = rows.map(row => ({ ...row, username: userById.get(row.user_id)?.username || 'Reader' }));
  const averageRating = data.length ? Number((data.reduce((sum, row) => sum + Number(row.rating), 0) / data.length).toFixed(2)) : null;
  res.json({ success: true, data, averageRating });
});

router.post('/reviews/:productId', requireUser, async (req, res) => {
  const { reviews } = await getCollections();
  const rating = Math.max(1, Math.min(5, Number(req.body.rating) || 5));
  const body = String(req.body.body || '').trim();
  const existing = await reviews.find({}, { projection: { id: 1 } }).toArray();
  await reviews.updateOne(
    { user_id: req.user.id, product_id: Number(req.params.productId) },
    {
      $set: { rating, body, created_at: new Date() },
      $setOnInsert: { id: nextId(existing), user_id: req.user.id, product_id: Number(req.params.productId) },
    },
    { upsert: true }
  );
  res.status(201).json({ success: true, message: 'Review submitted!' });
});

router.delete('/reviews/:id', requireUser, async (req, res) => {
  const { reviews } = await getCollections();
  const review = await reviews.findOne({ id: Number(req.params.id) });
  if (!review) return res.status(404).json({ success: false, message: 'Not found' });
  if (review.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  await reviews.deleteOne({ id: Number(req.params.id) });
  res.json({ success: true, message: 'Review deleted' });
});

router.get('/admin/users-carts', requireUser, requireAdmin, async (req, res) => {
  const { users } = await getCollections();
  const userRows = await users.find({}).sort({ created_at: -1 }).toArray();
  const data = await Promise.all(userRows.map(async user => ({
    ...publicUser(user),
    cart: await getCartResponse({ userId: user.id }),
  })));
  res.json({ success: true, data });
});

router.get('/admin/users', requireUser, requireAdmin, async (req, res) => {
  const { users } = await getCollections();
  const data = await users.find({}).sort({ created_at: -1 }).toArray();
  res.json({ success: true, data: data.map(publicUser) });
});

router.patch('/admin/users/:id', requireUser, requireAdmin, async (req, res) => {
  const { users } = await getCollections();
  const update = {};
  if (req.body.role && ['user', 'admin'].includes(req.body.role)) update.role = req.body.role;
  if (typeof req.body.disabled === 'boolean') update.disabled = req.body.disabled;
  await users.updateOne({ id: Number(req.params.id) }, { $set: update });
  const user = await users.findOne({ id: Number(req.params.id) });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: publicUser(user) });
});

router.get('/admin/analytics', requireUser, requireAdmin, async (req, res) => {
  const { users, products, orders } = await getCollections();
  const [userCount, productCount, orderRows] = await Promise.all([
    users.countDocuments({ role: { $ne: 'admin' } }),
    products.countDocuments(),
    orders.find({}).toArray(),
  ]);
  const totalRevenue = orderRows.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const categoryRevenue = {};
  const productRows = await products.find({}).toArray();
  const productById = new Map(productRows.map(product => [product.id, product]));
  orderRows.forEach(order => {
    (order.items || []).forEach(item => {
      const product = productById.get(item.product_id);
      const key = product?.category_name || 'Unknown';
      categoryRevenue[key] = (categoryRevenue[key] || 0) + Number(item.unit_price || 0) * Number(item.quantity || 0);
    });
  });
  res.json({
    success: true,
    data: {
      totals: { total_users: userCount, total_products: productCount, total_books: productCount, total_orders: orderRows.length, total_revenue: totalRevenue },
      topBooks: [],
      byCategory: Object.entries(categoryRevenue).map(([name, revenue]) => ({ name, revenue })),
      recentOrders: orderRows.slice(-10).reverse(),
    },
  });
});

router.get('/admin/orders', requireUser, requireAdmin, async (req, res) => {
  const { orders, users } = await getCollections();
  const [orderRows, userRows] = await Promise.all([
    orders.find({}).sort({ created_at: -1 }).toArray(),
    users.find({}).toArray(),
  ]);
  const userById = new Map(userRows.map(user => [user.id, user]));
  res.json({ success: true, data: orderRows.map(order => ({ ...order, username: userById.get(order.user_id)?.username || 'Unknown', email: userById.get(order.user_id)?.email || '' })) });
});

router.patch('/admin/orders/:id/status', requireUser, requireAdmin, async (req, res) => {
  const { orders } = await getCollections();
  const allowed = new Set(['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled']);
  const status = String(req.body.status || '').trim();
  if (!allowed.has(status)) return res.status(400).json({ success: false, message: 'Invalid order status' });
  const result = await orders.updateOne({ id: Number(req.params.id) }, { $set: { status } });
  if (!result.matchedCount) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: { id: Number(req.params.id), status } });
});

router.get('/admin/reviews', requireUser, requireAdmin, async (req, res) => {
  const { reviews, users, products } = await getCollections();
  const [reviewRows, userRows, productRows] = await Promise.all([
    reviews.find({}).sort({ created_at: -1 }).toArray(),
    users.find({}).toArray(),
    products.find({}).toArray(),
  ]);
  const userById = new Map(userRows.map(user => [user.id, user]));
  const productById = new Map(productRows.map(product => [product.id, product]));
  res.json({ success: true, data: reviewRows.map(review => ({ ...review, username: userById.get(review.user_id)?.username || 'Reader', product: productById.get(review.product_id) })) });
});

router.get('/admin/products', requireUser, requireAdmin, async (req, res) => {
  const { products } = await getCollections();
  const data = await products.find({}).sort({ id: -1 }).toArray();
  res.json({ success: true, data });
});

router.post('/admin/products', requireUser, requireAdmin, async (req, res) => {
  const { products, categories } = await getCollections();
  const existing = await products.find({}, { projection: { id: 1 } }).toArray();
  const categoryRows = await categories.find({}).toArray();
  const category = categoryRows.find(cat => cat.id === Number(req.body.category_id)) || categoryRows[0];
  const genre = categoryRows.flatMap(cat => cat.genres || []).find(item => item.id === Number(req.body.genre_id)) || category?.genres?.[0];
  const product = normalizeProduct({
    id: nextId(existing),
    title: String(req.body.title || 'Untitled Book').trim(),
    author: String(req.body.author || 'Unknown').trim(),
    price: Number(req.body.price || 19.99),
    image_url: req.body.image_url || 'images/placeholder.svg',
    cover_color: req.body.cover_color || '#222222',
    category_id: Number(category?.id || 1),
    genre_id: Number(genre?.id || 1),
    category_name: category?.name || 'Books',
    category_slug: category?.slug || 'books',
    genre_name: genre?.name || 'General',
    description: req.body.description || 'A freshly catalogued Inkbound title.',
    goodreads_rating: Number(req.body.goodreads_rating || 4.2),
    stock: Number(req.body.stock || 20),
    created_at: new Date(),
  });
  await products.insertOne(product);
  res.status(201).json({ success: true, data: product });
});

router.patch('/admin/products/:id', requireUser, requireAdmin, async (req, res) => {
  const { products } = await getCollections();
  const allowed = ['title', 'author', 'price', 'category_id', 'genre_id', 'description', 'stock', 'image_url', 'cover_color', 'goodreads_rating'];
  const update = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) update[field] = ['price', 'category_id', 'genre_id', 'stock', 'goodreads_rating'].includes(field)
      ? Number(req.body[field])
      : req.body[field];
  });
  await products.updateOne({ id: Number(req.params.id) }, { $set: update });
  const product = await products.findOne({ id: Number(req.params.id) });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

router.delete('/admin/products/:id', requireUser, requireAdmin, async (req, res) => {
  const { products } = await getCollections();
  const result = await products.deleteOne({ id: Number(req.params.id) });
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: { id: Number(req.params.id) } });
});

module.exports = {
  router,
  ensureMongoSeed,
};
