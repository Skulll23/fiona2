//Express + MySQL server
const express       = require('express');
const cors          = require('cors');
const path          = require('path');
require('dotenv').config();

const productRoutes  = require('./routes/productRoutes');
const cartRoutes     = require('./routes/cartRoutes');
const authRoutes     = require('./routes/authRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const reviewRoutes   = require('./routes/reviewRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/products',  productRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/wishlist',  wishlistRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/reviews',   reviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

//SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

//error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Inkbound running at http://localhost:${PORT}\n`);
});
