// controllers/cartController.js — Full CRUD for shopping cart

const CartModel    = require('../models/cartModel');
const ProductModel = require('../models/productModel');
const jwt          = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'inkbound_jwt_secret_key';

// Extract userId from the Authorization header if present — does not throw
function extractUserId(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    return decoded.id || null;
  } catch { return null; }
}

// Helper function to calculate subtotal and item count for the cart response
function buildCartResponse(items) {
  const subtotal   = items.reduce((sum, i) => sum + parseFloat(i.line_total), 0);
  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    items,
    subtotal:   parseFloat(subtotal.toFixed(2)),
    item_count,
  };
}

// Fetch cart items — uses user_id when logged in so the user's view is
// always identical to what the admin panel sees.  Falls back to session_id
// for anonymous guests.
async function fetchItems(sessionId, userId) {
  if (userId) return CartModel.getCartByUser(userId);
  return CartModel.getCartBySession(sessionId);
}

const CartController = {

  // READ — GET /api/cart
  async getCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID required' });
      const userId = extractUserId(req);
      const items  = await fetchItems(sessionId, userId);
      res.json({ success: true, data: buildCartResponse(items) });
    } catch (err) {
      console.error('getCart error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
  },

  // CREATE — POST /api/cart  { product_id, quantity? }
  async addToCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID required' });

      const { product_id, quantity = 1 } = req.body;
      if (!product_id || isNaN(parseInt(product_id))) {
        return res.status(400).json({ success: false, message: 'Valid product_id required' });
      }
      if (quantity < 1 || quantity > 99) {
        return res.status(400).json({ success: false, message: 'Quantity must be 1–99' });
      }

      const product = await ProductModel.getById(parseInt(product_id));
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const userId = extractUserId(req);
      await CartModel.addItemWithUser(sessionId, parseInt(product_id), parseInt(quantity), userId);
      const items = await fetchItems(sessionId, userId);
      res.status(201).json({
        success: true,
        message: `"${product.title}" added to cart`,
        data: buildCartResponse(items),
      });
    } catch (err) {
      console.error('addToCart error:', err);
      res.status(500).json({ success: false, message: 'Failed to add item' });
    }
  },

  // UPDATE — PATCH /api/cart/:productId  { quantity }
  async updateQuantity(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID required' });

      const productId = parseInt(req.params.productId);
      const quantity  = parseInt(req.body.quantity);
      if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' });
      if (isNaN(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ success: false, message: 'Quantity must be 1–99' });
      }

      const existing = await CartModel.getItem(sessionId, productId);
      if (!existing) return res.status(404).json({ success: false, message: 'Item not in cart' });

      const userId = extractUserId(req);
      await CartModel.updateQuantity(sessionId, productId, quantity);
      const items = await fetchItems(sessionId, userId);
      res.json({ success: true, message: 'Quantity updated', data: buildCartResponse(items) });
    } catch (err) {
      console.error('updateQuantity error:', err);
      res.status(500).json({ success: false, message: 'Failed to update quantity' });
    }
  },

  // DELETE — DELETE /api/cart/:productId
  async removeItem(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID required' });

      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product ID' });

      const existing = await CartModel.getItem(sessionId, productId);
      if (!existing) return res.status(404).json({ success: false, message: 'Item not in cart' });

      const userId = extractUserId(req);
      await CartModel.removeItem(sessionId, productId);
      const items = await fetchItems(sessionId, userId);
      res.json({ success: true, message: 'Item removed', data: buildCartResponse(items) });
    } catch (err) {
      console.error('removeItem error:', err);
      res.status(500).json({ success: false, message: 'Failed to remove item' });
    }
  },

  // DELETE — DELETE /api/cart  (clear all)
  async clearCart(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID required' });
      const userId = extractUserId(req);
      // When logged in, clear by user_id so all their items across any session are removed
      if (userId) {
        await CartModel.clearCartByUser(userId);
      } else {
        await CartModel.clearCart(sessionId);
      }
      res.json({ success: true, message: 'Cart cleared', data: { items: [], subtotal: 0, item_count: 0 } });
    } catch (err) {
      console.error('clearCart error:', err);
      res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
  },
};

module.exports = CartController;
