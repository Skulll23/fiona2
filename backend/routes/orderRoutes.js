const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const jwt     = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'inkbound_jwt_secret_key';

function extractUserId(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return jwt.verify(auth.split(' ')[1], JWT_SECRET)?.id || null;
  } catch { return null; }
}

// POST /api/orders — checkout: create order from cart, clear cart
router.post('/', verifyToken, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const userId    = req.user.id;
    const sessionId = req.headers['x-session-id'];

    // Fetch current cart items
    const [items] = await conn.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.title, p.author, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [userId]
    );

    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    const discount = Math.max(0, Math.min(subtotal, Number(req.body.discount_amount || 0)));
    const total = Math.max(0, subtotal - discount);

    // Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
      [userId, total.toFixed(2)]
    );
    const orderId = orderResult.insertId;

    // Create order items & decrement stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, title, author, image_url, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.title, item.author, item.image_url, item.quantity, item.price]
      );
      await conn.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Order placed!',
      data: {
        orderId,
        total: parseFloat(total.toFixed(2)),
        itemCount: items.length,
        fulfillment_eta: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      }
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, message: e.message });
  } finally {
    conn.release();
  }
});

// GET /api/orders — user's order history
router.get('/', verifyToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    // Attach items to each order
    for (const order of orders) {
      const [items] = await db.query(
        'SELECT * FROM order_items WHERE order_id = ?', [order.id]
      );
      order.items = items;
    }
    res.json({ success: true, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
