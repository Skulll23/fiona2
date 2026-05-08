// scripts/fetchCovers.js
// Fetches cover images from Open Library for all products that have no image_url.
// Run with: node scripts/fetchCovers.js
// Safe to re-run — skips books that already have an image_url.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const https = require('https');

// ── helpers ────────────────────────────────────────────────────────────────

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Inkbound-Bookstore/1.0 (educational project)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: null }); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Search Open Library for a book and return the best cover URL, or null
async function fetchCoverUrl(title, author) {
  const q = encodeURIComponent(`${title} ${author}`);
  const url = `https://openlibrary.org/search.json?q=${q}&limit=5&fields=cover_i,isbn,title`;

  try {
    const { status, body } = await httpsGet(url);
    if (status !== 200 || !body || !body.docs || body.docs.length === 0) return null;

    // Pick the first doc that has a cover_i
    for (const doc of body.docs) {
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
      // Fallback: first available ISBN
      if (doc.isbn && doc.isbn.length > 0) {
        return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'inkbound',
  });
  console.log('✅ Connected to MySQL');

  // Only fetch covers for books that are still missing one
  const [books] = await conn.query(
    "SELECT id, title, author FROM products WHERE image_url = '' OR image_url IS NULL ORDER BY id"
  );
  console.log(`📚 ${books.length} books need covers. Starting fetch...\n`);

  let found = 0, missing = 0;

  for (let i = 0; i < books.length; i++) {
    const { id, title, author } = books[i];
    const coverUrl = await fetchCoverUrl(title, author);

    if (coverUrl) {
      await conn.query('UPDATE products SET image_url = ? WHERE id = ?', [coverUrl, id]);
      found++;
      process.stdout.write(`\r[${i + 1}/${books.length}] ✅ Found: ${found}  ❌ Missing: ${missing}   `);
    } else {
      missing++;
      process.stdout.write(`\r[${i + 1}/${books.length}] ✅ Found: ${found}  ❌ Missing: ${missing}   `);
    }

    // Polite delay — Open Library is a free service, 400ms between requests
    await sleep(400);
  }

  console.log(`\n\n🎉 Done! Covers found: ${found}, Still missing: ${missing}`);
  await conn.end();
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
