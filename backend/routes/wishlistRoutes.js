const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/wishlist — user's wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id AS product_id, p.title, p.author, p.price, p.image_url, p.cover_color,
              p.goodreads_rating, c.name AS category_name, c.slug AS category_slug,
              g.name AS genre_name, w.added_at
       FROM wishlists w
       JOIN products p   ON w.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN genres g     ON p.genre_id    = g.id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/wishlist/ids — just product IDs (for quick "is wishlisted?" check)
router.get('/ids', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT product_id FROM wishlists WHERE user_id = ?', [req.user.id]
    );
    res.json({ success: true, data: rows.map(r => r.product_id) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/wishlist/:productId — add to wishlist
router.post('/:productId', verifyToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    await db.query(
      'INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete('/:productId', verifyToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    await db.query(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
