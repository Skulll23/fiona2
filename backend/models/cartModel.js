// models/cartModel.js — CRUD queries for the shopping cart

const db = require('../config/db');

const CartModel = {

  // READ — Full cart for a session with all product details
  async getCartBySession(sessionId) {
    const sql = `
      SELECT
        ci.id AS cart_item_id, ci.session_id, ci.quantity,
        p.id  AS product_id,   p.title, p.author, p.price,
        p.image_url, p.cover_color, p.goodreads_rating,
        c.name AS category_name, c.slug AS category_slug,
        g.name AS genre_name,
        (p.price * ci.quantity) AS line_total
      FROM cart_items ci
      JOIN products   p ON ci.product_id  = p.id
      JOIN categories c ON p.category_id  = c.id
      JOIN genres     g ON p.genre_id     = g.id
      WHERE ci.session_id = ?
      ORDER BY ci.added_at ASC
    `;
    const [rows] = await db.query(sql, [sessionId]);
    return rows;
  },

  // CREATE — Add item (or increment quantity if already exists)
  async addItem(sessionId, productId, quantity = 1) {
    const sql = `
      INSERT INTO cart_items (session_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;
    const [result] = await db.query(sql, [sessionId, productId, quantity]);
    return result;
  },

  // UPDATE — Set exact quantity
  async updateQuantity(sessionId, productId, quantity) {
    const [result] = await db.query(
      'UPDATE cart_items SET quantity = ? WHERE session_id = ? AND product_id = ?',
      [quantity, sessionId, productId]
    );
    return result;
  },

  // DELETE — Remove one item
  async removeItem(sessionId, productId) {
    const [result] = await db.query(
      'DELETE FROM cart_items WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );
    return result;
  },

  // DELETE — Clear entire cart by session (guest)
  async clearCart(sessionId) {
    const [result] = await db.query(
      'DELETE FROM cart_items WHERE session_id = ?',
      [sessionId]
    );
    return result;
  },

  // DELETE — Clear entire cart by user_id (logged-in user)
  async clearCartByUser(userId) {
    const [result] = await db.query(
      'DELETE FROM cart_items WHERE user_id = ?',
      [userId]
    );
    return result;
  },

  // Helper — Check if item exists
  async getItem(sessionId, productId) {
    const [rows] = await db.query(
      'SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );
    return rows[0] || null;
  },

  // CREATE — Add item with optional user_id (set when user is logged in)
  async addItemWithUser(sessionId, productId, quantity = 1, userId = null) {
    const sql = `
      INSERT INTO cart_items (session_id, product_id, quantity, user_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        quantity = quantity + VALUES(quantity),
        user_id  = COALESCE(VALUES(user_id), user_id)
    `;
    const [result] = await db.query(sql, [sessionId, productId, quantity, userId]);
    return result;
  },

  // READ — Full cart for a logged-in user (matches the admin view query)
  async getCartByUser(userId) {
    const sql = `
      SELECT
        ci.id AS cart_item_id, ci.session_id, ci.quantity,
        p.id  AS product_id,   p.title, p.author, p.price,
        p.image_url, p.cover_color, p.goodreads_rating,
        c.name AS category_name, c.slug AS category_slug,
        g.name AS genre_name,
        (p.price * ci.quantity) AS line_total
      FROM cart_items ci
      JOIN products   p ON ci.product_id  = p.id
      JOIN categories c ON p.category_id  = c.id
      JOIN genres     g ON p.genre_id     = g.id
      WHERE ci.user_id = ?
      ORDER BY ci.added_at ASC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  // UPDATE — Tag all existing session cart items with the user's ID (called on login/register)
  async linkCartToUser(sessionId, userId) {
    await db.query(
      'UPDATE cart_items SET user_id = ? WHERE session_id = ?',
      [userId, sessionId]
    );
  },
};

module.exports = CartModel;
