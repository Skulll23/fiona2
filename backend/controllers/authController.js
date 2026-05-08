// controllers/authController.js — Register, Login, and Get Profile

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const CartModel = require('../models/cartModel');

const JWT_SECRET  = process.env.JWT_SECRET || 'inkbound_jwt_secret_key';
const JWT_EXPIRES = '7d';

const AuthController = {

  // POST /api/auth/register
  // Body: { username, email, password }
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Input validation
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      }

      // Uniqueness checks
      const existingEmail    = await UserModel.findByEmail(email);
      if (existingEmail) return res.status(409).json({ success: false, message: 'Email already registered' });

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) return res.status(409).json({ success: false, message: 'Username already taken' });

      // Hash password — bcrypt cost factor 10 is the standard balance of speed vs. security
      const passwordHash = await bcrypt.hash(password, 10);
      const userId       = await UserModel.create({ username, email, passwordHash });
      const user         = await UserModel.findById(userId);

      // Sign JWT — payload contains id, username, role so we don't need a DB lookup on every request
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      // Link any guest cart items to this new user
      const sessionId = req.headers['x-session-id'];
      if (sessionId) await CartModel.linkCartToUser(sessionId, userId);

      res.status(201).json({ success: true, message: 'Account created successfully', data: { user, token } });
    } catch (err) {
      console.error('register error:', err);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  },

  // POST /api/auth/login
  // Body: { email, password }
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      // findByEmail returns the full row including password_hash
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Return same message for both "no account" and "wrong password" — prevents user enumeration
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // bcrypt.compare hashes the input and compares — never compare plain text passwords
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      // Link any guest cart items to this user on login
      const sessionId = req.headers['x-session-id'];
      if (sessionId) await CartModel.linkCartToUser(sessionId, user.id);

      // Strip password_hash before sending to client
      const { password_hash, ...safeUser } = user;

      res.json({ success: true, message: 'Logged in successfully', data: { user: safeUser, token } });
    } catch (err) {
      console.error('login error:', err);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  },

  // GET /api/auth/me  (requires verifyToken middleware)
  // Returns the currently logged-in user's profile
  async getMe(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, data: user });
    } catch (err) {
      console.error('getMe error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  },
};

module.exports = AuthController;
