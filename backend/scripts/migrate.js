// scripts/migrate.js
// Run with: node scripts/migrate.js
// Adds the users table and user_id column to cart_items WITHOUT touching existing data.

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
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users table ready');

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

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await conn.end();
  }
}

migrate();
