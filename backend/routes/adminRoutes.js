// routes/adminRoutes.js — All routes require login + admin role
const express          = require('express');
const router           = express.Router();
const AdminController  = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const db               = require('../config/db');

router.get('/users-carts', verifyToken, isAdmin, AdminController.getAllUserCarts);

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

module.exports = router;
