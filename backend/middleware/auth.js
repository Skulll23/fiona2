// middleware/auth.js — JWT verification middleware
//
// verifyToken: protects any route that requires a logged-in user
// isAdmin:     further restricts a route to admin-role users only
//
// Usage in routes:
//   router.get('/protected', verifyToken, handler)
//   router.get('/admin-only', verifyToken, isAdmin, handler)

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'inkbound_jwt_secret_key';

// Reads the Bearer token from the Authorization header,
// verifies its signature, and attaches the decoded payload to req.user
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Must be used AFTER verifyToken — checks that the user is an admin
function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// Soft version of verifyToken — attaches req.user if token is present
// but does NOT block the request if no token is provided (used for cart)
function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    } catch {
      // invalid token — just ignore it, treat as guest
    }
  }
  next();
}

module.exports = { verifyToken, isAdmin, optionalAuth };
