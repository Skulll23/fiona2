require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const books = [
  { t:"A Deadly Education", a:"Naomi Novik", p:15.99, g:1, d:"A girl with catastrophic destructive magic attends a school of magic where the monsters are real and very hungry." },
  { t:"The Last Graduate", a:"Naomi Novik", p:15.99, g:1, d:"El Higgins returns for her senior year at the Scholomance — and begins to question everything she thought she knew about the school." },
  { t:"Jonathan Strange & Mr Norrell", a:"Susanna Clarke", p:18.99, g:1, d:"Two very different magicians revive English magic in the Napoleonic era — with unforeseen consequences." },
  { t:"Piranesi", a:"Susanna Clarke", p:14.99, g:1, d:"A man lives in a labyrinthine House full of statues and tidal halls with only two other inhabitants and no memory of his past." },
  { t:"The Left-Handed Booksellers of London", a:"Garth Nix", p:15.99, g:1, d:"A magical guild of booksellers protects Britain from Old Kingdom threats in 1983 London." },
  { t:"Leviathan Wakes", a:"James S.A. Corey", p:16.99, g:2, d:"The first Expanse novel — a detective and a spaceship captain investigate a mystery that could ignite an interplanetary war." },
  { t:"Caliban's War", a:"James S.A. Corey", p:16.99, g:2, d:"The protomolecule threat expands as war breaks out between Earth and Mars." },
  { t:"Abbadon's Gate", a:"James S.A. Corey", p:16.99, g:2, d:"The protomolecule builds a massive gate in the outer solar system — and humanity must decide whether to go through." },
  { t:"Flowers for Algernon", a:"Daniel Keyes", p:13.99, g:2, d:"A man with an intellectual disability undergoes an experimental procedure that makes him a genius — but the transformation has costs." },
  { t:"The Invisible Man", a:"H.G. Wells", p:11.99, g:2, d:"A scientist discovers a way to make himself invisible but cannot reverse the process, and slowly descends into madness." },
  { t:"Brave New World", a:"Aldous Huxley", p:13.99, g:2, d:"In a future world of genetic engineering and conditioning, a 'savage' raised outside the system threatens the comfortable order." },
  { t:"Do Androids Dream of Electric Sheep?", a:"Philip K. Dick", p:13.99, g:2, d:"In a post-nuclear future, bounty hunter Rick Deckard hunts down rogue androids — and questions what it means to be human." },
  { t:"A Scanner Darkly", a:"Philip K. Dick", p:13.99, g:2, d:"An undercover narcotics agent is assigned to surveil himself — a harrowing spiral into paranoia and addiction." },
  { t:"The Player of Games", a:"Iain M. Banks", p:15.99, g:2, d:"The Culture's greatest game player is sent to an alien empire where the ruling game determines who holds power." },
  { t:"Use of Weapons", a:"Iain M. Banks", p:15.99, g:2, d:"A mercenary fights for the Culture while haunted by atrocities in his past — told in two interweaving timelines." },
  { t:"Oryx and Crake", a:"Margaret Atwood", p:15.99, g:2, d:"Snowman, possibly the last human, survives in a post-apocalyptic world and recalls how genetic engineering destroyed civilization." },
  { t:"The Year of the Flood", a:"Margaret Atwood", p:15.99, g:2, d:"Two women survivors of the same catastrophe tell their stories from different perspectives in Atwood's MaddAddam trilogy." },
  { t:"Saga Vol. 7", a:"Brian K. Vaughan", p:14.99, g:22, d:"Marko and Alana reunite — but their family faces a new crisis as the war reaches a devastating turning point." },
  { t:"Saga Vol. 8", a:"Brian K. Vaughan", p:14.99, g:22, d:"The galaxy's most wanted family tries to find peace on a tourist planet — but peace never lasts long." },
  { t:"Black Hole", a:"Charles Burns", p:19.99, g:20, d:"Teenagers in 1970s Seattle contract a mysterious STD that causes grotesque mutations in this landmark of indie horror comics." },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||3306,
    user: process.env.DB_USER||'root', password: process.env.DB_PASSWORD||'',
    database: process.env.DB_NAME||'inkbound',
  });
  console.log('✅ Connected');
  let inserted = 0, skipped = 0;
  for (const b of books) {
    const [ex] = await conn.query('SELECT id FROM products WHERE title=? AND author=?', [b.t, b.a]);
    if (ex.length > 0) { skipped++; continue; }
    let cat_id = b.g<=5?1:b.g<=13?2:b.g<=18?3:4;
    await conn.query(
      'INSERT INTO products (title,author,price,genre_id,category_id,description,stock,image_url) VALUES(?,?,?,?,?,?,?,\'\')',
      [b.t, b.a, b.p, b.g, cat_id, b.d, 25]
    );
    inserted++;
  }
  const [[{total}]] = await conn.query('SELECT COUNT(*) as total FROM products');
  console.log(`✅ Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`📚 Total products in database: ${total}`);
  await conn.end();
}
seed().catch(e=>{console.error('❌',e.message);process.exit(1);});
