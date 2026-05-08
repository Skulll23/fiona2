const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/reviews/:productId — public
router.get('/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.rating, r.body, r.created_at,
              u.username, u.id AS user_id
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [parseInt(req.params.productId)]
    );
    const avg = rows.length
      ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(2)
      : null;
    res.json({ success: true, data: rows, averageRating: avg ? parseFloat(avg) : null });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/reviews/:productId — auth required
router.post('/:productId', verifyToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { rating, body } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be 1–5' });

    const [existing] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    if (existing.length)
      return res.status(409).json({ success: false, message: 'You already reviewed this book' });

    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, body) VALUES (?, ?, ?, ?)',
      [req.user.id, productId, parseInt(rating), body?.trim() || null]
    );
    res.status(201).json({ success: true, message: 'Review submitted!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/reviews/:id — own review or admin
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [review] = await db.query('SELECT user_id FROM reviews WHERE id = ?', [parseInt(req.params.id)]);
    if (!review.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (review[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });
    await db.query('DELETE FROM reviews WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
