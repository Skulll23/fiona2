// controllers/adminController.js — Admin-only endpoints

const UserModel = require('../models/userModel');
const db        = require('../config/db');

const AdminController = {

  // GET /api/admin/users-carts
  // Returns every user with their current cart contents
  // Only accessible to users with role = 'admin'
  async getAllUserCarts(req, res) {
    try {
      const users = await UserModel.getAll();

      // For each user, fetch their cart items (joined with product details)
      const usersWithCarts = await Promise.all(
        users.map(async (user) => {
          const [items] = await db.query(
            `SELECT
               ci.id         AS cart_item_id,
               ci.quantity,
               ci.added_at,
               p.id          AS product_id,
               p.title,
               p.author,
               p.price,
               p.image_url,
               p.cover_color,
               c.name        AS category_name,
               (p.price * ci.quantity) AS line_total
             FROM   cart_items ci
             JOIN   products   p  ON ci.product_id  = p.id
             JOIN   categories c  ON p.category_id  = c.id
             WHERE  ci.user_id = ?
             ORDER  BY ci.added_at DESC`,
            [user.id]
          );

          const subtotal  = items.reduce((sum, i) => sum + parseFloat(i.line_total), 0);
          const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

          return {
            ...user,
            cart: {
              items,
              item_count: itemCount,
              subtotal: parseFloat(subtotal.toFixed(2)),
            },
          };
        })
      );

      res.json({ success: true, data: usersWithCarts });
    } catch (err) {
      console.error('getAllUserCarts error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch user carts' });
    }
  },
};

module.exports = AdminController;
