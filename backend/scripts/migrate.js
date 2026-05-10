// scripts/migrate.js
// Run with: node scripts/migrate.js
// Adds assignment tables WITHOUT touching existing data.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'inkbound',
    multipleStatements: true,
  });

  console.log('✅ Connected to MySQL');

  try {
    // 1. Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(100) NOT NULL UNIQUE,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        disabled      TINYINT(1) NOT NULL DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users table ready');

    const [disabledCols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'disabled'
    `, [process.env.DB_NAME || 'inkbound']);

    if (disabledCols.length === 0) {
      await conn.query('ALTER TABLE users ADD COLUMN disabled TINYINT(1) NOT NULL DEFAULT 0 AFTER role');
      console.log('✅ users.disabled column added');
    }

    // 2. Seed admin account (password: admin123)
    await conn.query(`
      INSERT IGNORE INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@inkbound.com',
              '$2b$10$anXWZyf0cS/DUehl88f4Z.XOt3u6Ed3gLjvqf82Zcsl4F0xZdXCWW',
              'admin')
    `);
    console.log('✅ Admin account ready  (admin@inkbound.com / admin123)');

    // 3. Add user_id column to cart_items if it doesn't already exist
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'user_id'
    `, [process.env.DB_NAME || 'inkbound']);

    if (cols.length === 0) {
      await conn.query(`
        ALTER TABLE cart_items
          ADD COLUMN user_id INT NULL AFTER session_id,
          ADD CONSTRAINT fk_cart_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ cart_items.user_id column added');
    } else {
      console.log('ℹ️  cart_items.user_id already exists — skipped');
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        product_id INT NOT NULL,
        added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_wishlist_product (user_id, product_id)
      )
    `);
    console.log('✅ wishlists table ready');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status       ENUM('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ orders table ready');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        order_id   INT NOT NULL,
        product_id INT NOT NULL,
        title      VARCHAR(255) NOT NULL,
        author     VARCHAR(255) NOT NULL,
        image_url  VARCHAR(255) NOT NULL,
        quantity   INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ order_items table ready');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        product_id INT NOT NULL,
        rating     INT NOT NULL,
        body       TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product_review (user_id, product_id),
        CHECK (rating BETWEEN 1 AND 5)
      )
    `);
    console.log('✅ reviews table ready');

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await conn.end();
  }
}

migrate();
