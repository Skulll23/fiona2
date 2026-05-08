// ensure that the database connection is established before starting the server
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to the MySQL database using environment variables for configuration
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'inkbound',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the database connection when the module is loaded
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
module.exports = pool; //exports the pool object so it can be used in other parts of the application to execute queries
