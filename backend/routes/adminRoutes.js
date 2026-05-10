// routes/adminRoutes.js — All routes require login + admin role
const express          = require('express');
const router           = express.Router();
const AdminController  = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const db               = require('../config/db');

router.get('/users-carts', verifyToken, isAdmin, AdminController.getAllUserCarts);

// GET /api/admin/users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, disabled, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users.map(user => ({ ...user, disabled: Boolean(user.disabled) })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role, disabled } = req.body;
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid user role' });
      }
      await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    }

    if (typeof disabled === 'boolean') {
      try {
        await db.query('UPDATE users SET disabled = ? WHERE id = ?', [disabled ? 1 : 0, userId]);
      } catch {
        // Older local databases do not have this column; role management still works.
      }
    }

    const [[user]] = await db.query(
      'SELECT id, username, email, role, disabled, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { ...user, disabled: Boolean(user.disabled) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/admin/analytics
router.get('/analytics', verifyToken, isAdmin, async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role != 'admin')            AS total_users,
        (SELECT COUNT(*) FROM orders)                                  AS total_orders,
        (SELECT COALESCE(SUM(total_amount),0) FROM orders)             AS total_revenue,
        (SELECT COUNT(*) FROM products)                                AS total_books
    `);

    const [topBooks] = await db.query(`
      SELECT p.title, p.author, p.image_url, SUM(oi.quantity) AS units_sold,
             SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY oi.product_id
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    const [byCategory] = await db.query(`
      SELECT c.name, SUM(oi.quantity * oi.unit_price) AS revenue, SUM(oi.quantity) AS units
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id ORDER BY revenue DESC
    `);

    const [recentOrders] = await db.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.username
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    res.json({ success: true, data: { totals, topBooks, byCategory, recentOrders } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/admin/orders
router.get('/orders', verifyToken, isAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.username, u.email
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    for (const order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json({ success: true, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/admin/reviews
router.get('/reviews', verifyToken, isAdmin, async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.username, p.title AS product_title, p.author AS product_author
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    res.json({
      success: true,
      data: reviews.map(review => ({
        ...review,
        product: { title: review.product_title, author: review.product_author },
      })),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/admin/products
router.get('/products', verifyToken, isAdmin, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, g.name AS genre_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN genres g ON p.genre_id = g.id
      ORDER BY p.created_at DESC, p.id DESC
    `);
    res.json({ success: true, data: products });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/products
router.post('/products', verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      title, author, price, category_id, genre_id, description = '',
      stock = 20, image_url = '', cover_color = '#222222', goodreads_rating = 4.2,
    } = req.body;
    if (!title || !author || !price || !category_id || !genre_id) {
      return res.status(400).json({ success: false, message: 'Title, author, price, category, and genre are required' });
    }
    const [result] = await db.query(
      `INSERT INTO products
       (title, author, price, category_id, genre_id, description, stock, image_url, cover_color, goodreads_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, Number(price), Number(category_id), Number(genre_id), description, Number(stock), image_url, cover_color, Number(goodreads_rating)]
    );
    const [[product]] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: product });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = ['title', 'author', 'price', 'category_id', 'genre_id', 'description', 'stock', 'image_url', 'cover_color', 'goodreads_rating'];
    const updates = fields.filter(field => req.body[field] !== undefined);
    if (!updates.length) return res.status(400).json({ success: false, message: 'No product fields provided' });
    await db.query(
      `UPDATE products SET ${updates.map(field => `${field} = ?`).join(', ')} WHERE id = ?`,
      [...updates.map(field => req.body[field]), id]
    );
    const [[product]] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [parseInt(req.params.id, 10)]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: { id: parseInt(req.params.id, 10) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const allowed = new Set(['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled']);
    const status = String(req.body.status || '').trim();
    if (!allowed.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, parseInt(req.params.id, 10)]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { id: parseInt(req.params.id, 10), status } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
