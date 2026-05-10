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
  disabled      TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS disabled TINYINT(1) NOT NULL DEFAULT 0 AFTER role;

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

-- 5. Wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_wishlist_product (user_id, product_id)
);

-- 6. Orders and line items
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status       ENUM('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

-- 7. Reviews
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
);
