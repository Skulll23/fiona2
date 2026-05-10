// routes/productRoutes.js
const express           = require('express');
const router            = express.Router();
const ProductController = require('../controllers/productController');
const db                = require('../config/db');

router.get('/categories', ProductController.getCategories);

// GET /api/products/autocomplete?q=  — must be before /:id
router.get('/autocomplete', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });
    const like = `%${q}%`;
    const [rows] = await db.query(
      `SELECT id, title, author, image_url FROM products
       WHERE title LIKE ? OR author LIKE ?
       ORDER BY CASE WHEN title LIKE ? THEN 0 ELSE 1 END, title
       LIMIT 8`,
      [like, like, `${q}%`]
    );
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/products — with pagination, sort, price filter
router.get('/', async (req, res) => {
  try {
    const {
      categoryId, genreId, search,
      sort = 'title',
      minPrice, maxPrice,
      minRating, availability, author,
      page = 1, limit = 24,
    } = req.query;

    const conditions = [];
    const params     = [];

    if (categoryId) { conditions.push('p.category_id = ?'); params.push(parseInt(categoryId)); }
    if (genreId)    { conditions.push('p.genre_id = ?');    params.push(parseInt(genreId)); }
    if (search) {
      conditions.push('(p.title LIKE ? OR p.author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (author) { conditions.push('p.author LIKE ?'); params.push(`%${author}%`); }
    if (minPrice) { conditions.push('p.price >= ?'); params.push(parseFloat(minPrice)); }
    if (maxPrice) { conditions.push('p.price <= ?'); params.push(parseFloat(maxPrice)); }
    if (minRating) { conditions.push('COALESCE(p.goodreads_rating, 0) >= ?'); params.push(parseFloat(minRating)); }
    if (availability === 'available') conditions.push('p.stock > 0');
    if (availability === 'low') conditions.push('p.stock > 0 AND p.stock <= 12');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortMap = {
      title:      'p.title ASC',
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
      rating:     'p.goodreads_rating DESC',
      newest:     'p.created_at DESC',
      popularity: 'COALESCE(p.goodreads_rating, 0) DESC, p.stock DESC',
    };
    const orderBy = sortMap[sort] || 'p.title ASC';

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`, params
    );

    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, g.name AS genre_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN genres     g ON p.genre_id     = g.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/products/:id/similar — before /:id catch-all
router.get('/:id/similar', async (req, res) => {
  try {
    const [product] = await db.query('SELECT genre_id FROM products WHERE id = ?', [parseInt(req.params.id)]);
    if (!product.length) return res.status(404).json({ success: false, message: 'Not found' });
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, g.name AS genre_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN genres     g ON p.genre_id     = g.id
       WHERE p.genre_id = ? AND p.id != ?
       ORDER BY RAND() LIMIT 4`,
      [product[0].genre_id, parseInt(req.params.id)]
    );
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', ProductController.getProductById);

module.exports = router;
