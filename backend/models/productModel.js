// models/productModel.js — SQL queries for products, categories, genres

const db = require('../config/db');

const ProductModel = {

  // READ — All categories with their genres nested inside
  async getCategoriesWithGenres() {
    const [categories] = await db.query(
      'SELECT * FROM categories ORDER BY display_order'
    );
    const [genres] = await db.query(
      'SELECT * FROM genres ORDER BY category_id, name'
    );
    // Nest genres under their parent category
    return categories.map(cat => ({
      ...cat,
      genres: genres.filter(g => g.category_id === cat.id),
    }));
  },

  // READ — All products, joined with category + genre names
  // Optional filters: category_id, genre_id
  async getAll({ categoryId = null, genreId = null, search = null } = {}) {
    let sql = `
      SELECT
        p.id, p.title, p.author, p.price,
        p.image_url, p.cover_color, p.description, p.goodreads_rating, p.stock,
        c.id   AS category_id,   c.name AS category_name, c.slug AS category_slug,
        g.id   AS genre_id,      g.name AS genre_name,    g.slug AS genre_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN genres     g ON p.genre_id    = g.id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    if (genreId) {
      sql += ' AND p.genre_id = ?';
      params.push(genreId);
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.author LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY c.display_order, g.name, p.title';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  // READ — Single product by ID
  async getById(id) {
    const sql = `
      SELECT
        p.id, p.title, p.author, p.price,
        p.image_url, p.cover_color, p.description, p.goodreads_rating, p.stock,
        c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
        g.id AS genre_id,    g.name AS genre_name,    g.slug AS genre_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN genres     g ON p.genre_id    = g.id
      WHERE p.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

};

module.exports = ProductModel;
