// models/userModel.js — CRUD queries for the users table

const db = require('../config/db');

const UserModel = {

  // CREATE — insert a new user, return the new row's ID
  async create({ username, email, passwordHash, role = 'user' }) {
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );
    return result.insertId;
  },

  // READ — find by email (used during login to fetch password hash)
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  // READ — find by username (used during registration to check uniqueness)
  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  // READ — find by ID, never returns password_hash
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // READ — all users for the admin panel, never returns password_hash
  async getAll() {
    const [rows] = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },
};

module.exports = UserModel;
