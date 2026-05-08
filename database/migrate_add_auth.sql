-- migrate_add_auth.sql
-- Run this if you already have the inkbound database set up and want to
-- add user authentication WITHOUT losing existing product/cart data.
-- If you're starting fresh, just run schema.sql instead.

USE inkbound;

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed admin account (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
  ('admin', 'admin@inkbound.com',
   '$2b$10$anXWZyf0cS/DUehl88f4Z.XOt3u6Ed3gLjvqf82Zcsl4F0xZdXCWW',
   'admin');

-- 3. Add user_id column to cart_items (NULL = guest cart)
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER session_id;

-- 4. Add foreign key linking cart items to users
ALTER TABLE cart_items
  ADD CONSTRAINT fk_cart_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
