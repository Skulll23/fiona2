// Express + MongoDB server
const express       = require('express');
const cors          = require('cors');
const path          = require('path');
require('dotenv').config();

const { router: mongoRoutes, ensureMongoSeed } = require('./routes/mongoRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api', mongoRoutes);

//SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

//error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

ensureMongoSeed()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Inkbound running on MongoDB at http://localhost:${PORT}\n`);
    });
  })
  .catch(err => {
    console.error('MongoDB startup failed:', err.message);
    process.exit(1);
  });
