// routes/cartRoutes.js
const express        = require('express');
const router         = express.Router();
const CartController = require('../controllers/cartController');

router.get('/',             CartController.getCart);        // READ
router.post('/',            CartController.addToCart);      // CREATE
router.patch('/:productId', CartController.updateQuantity); // UPDATE
router.delete('/:productId',CartController.removeItem);     // DELETE one
router.delete('/',          CartController.clearCart);      // DELETE all

module.exports = router;
