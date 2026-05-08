// routes/authRoutes.js

const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', AuthController.register); // CREATE account
router.post('/login',    AuthController.login);    // verify credentials, return JWT
router.get('/me',        verifyToken, AuthController.getMe); // READ own profile

module.exports = router;
