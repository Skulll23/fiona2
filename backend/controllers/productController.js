// controllers/productController.js

const ProductModel = require('../models/productModel');

const ProductController = {

  // GET /api/categories — returns all categories with their genres nested
  async getCategories(req, res) {
    try {
      const data = await ProductModel.getCategoriesWithGenres();
      res.json({ success: true, data });
    } catch (err) {
      console.error('getCategories error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  },

  // GET /api/products?categoryId=1&genreId=3
  async getAllProducts(req, res) {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
      const genreId    = req.query.genreId    ? parseInt(req.query.genreId)    : null;
      const search = req.query.search ? req.query.search.trim() : null;

      if (req.query.categoryId && isNaN(categoryId)) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId' });
      }
      if (req.query.genreId && isNaN(genreId)) {
        return res.status(400).json({ success: false, message: 'Invalid genreId' });
      }

      const products = await ProductModel.getAll({ categoryId, genreId, search });
      res.json({ success: true, data: products });
    } catch (err) {
      console.error('getAllProducts error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
  },

  // GET /api/products/:id
  async getProductById(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }
      const product = await ProductModel.getById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err) {
      console.error('getProductById error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
  },
};

module.exports = ProductController;
