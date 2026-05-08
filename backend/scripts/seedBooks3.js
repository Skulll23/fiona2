require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

// genre/cat: Books(1-5/cat1), Manga(6-13/cat2), LN(14-18/cat3), GN(19-24/cat4)
const books = [
  // Books Fantasy
  { t:"The Alloy of Law", a:"Brandon Sanderson", p:15.99, g:1, d:"Three hundred years after the events of Mistborn, a lawman and a dandy team up in a Roaring-Twenties-style city." },
  { t:"Shadows of Self", a:"Brandon Sanderson", p:15.99, g:1, d:"Waxillium Ladrian returns to investigate a series of murders that could throw Elendel into revolution." },
  { t:"The Bands of Mourning", a:"Brandon Sanderson", p:16.99, g:1, d:"Wax and Wayne chase a legend of the Lord Ruler's own Bands of Mourning — mythic artifacts of incredible power." },
  { t:"Elantris", a:"Brandon Sanderson", p:15.99, g:1, d:"A prince is struck by the Shaod and becomes one of the living dead in the fallen city of Elantris." },
  { t:"Warbreaker", a:"Brandon Sanderson", p:16.99, g:1, d:"Two princesses of Idris are sent to Hallandren — one to marry the God-King, one to stop a war." },
  { t:"The Eye of the World", a:"Robert Jordan", p:17.99, g:1, d:"Rand al'Thor and his companions flee their village when dark forces pursue them across a world of prophecy and peril." },
  { t:"The Great Hunt", a:"Robert Jordan", p:17.99, g:1, d:"The second Wheel of Time novel — Rand must recover the legendary Horn of Valere before it falls into Shadow." },
  { t:"The Dragon Reborn", a:"Robert Jordan", p:17.99, g:1, d:"Rand al'Thor accepts his destiny as the Dragon Reborn and races to claim his birthright." },
  { t:"Gardens of the Moon", a:"Steven Erikson", p:17.99, g:1, d:"The first book of the Malazan Book of the Fallen — a vast military fantasy spanning continents and millennia." },
  { t:"Deadhouse Gates", a:"Steven Erikson", p:17.99, g:1, d:"The Malazan Book of the Fallen continues with the Chain of Dogs — one of fantasy's most devastating marches." },
  { t:"The Crystal Shard", a:"R.A. Salvatore", p:14.99, g:1, d:"The iconic drow ranger Drizzt Do'Urden faces the demon-infested Crystal Shard in the icy north of the Forgotten Realms." },
  { t:"Streams of Silver", a:"R.A. Salvatore", p:14.99, g:1, d:"Drizzt and his companions journey to reclaim the homeland of Bruenor Battlehammer — Mithral Hall." },
  { t:"Kushiel's Dart", a:"Jacqueline Carey", p:18.99, g:1, d:"In a lush alternate France where desire is holy, a young courtesan spy uncovers a devastating treachery." },

  // Books Sci-Fi
  { t:"The Stars My Destination", a:"Alfred Bester", p:14.99, g:2, d:"In a future where teleportation is common, a man hunts the ship that left him to die in space — becoming something monstrous." },
  { t:"More Than Human", a:"Theodore Sturgeon", p:13.99, g:2, d:"A group of misfit children with strange gifts merge into a single gestalt being with godlike potential." },
  { t:"The Demolished Man", a:"Alfred Bester", p:13.99, g:2, d:"In a world with telepathic police, a powerful businessman plans the first premeditated murder in decades." },
  { t:"Gateway", a:"Frederik Pohl", p:14.99, g:2, d:"A man wins a lottery to visit a space station left by a vanished alien race — with ships that go somewhere, but no one knows where." },
  { t:"The Forever War", a:"Joe Haldeman", p:14.99, g:2, d:"A soldier fights a thousand-year interstellar war where time dilation means he returns to an unrecognizable Earth." },
  { t:"All You Need Is Kill", a:"Hiroshi Sakurazaka", p:13.99, g:2, d:"A soldier trapped in a time loop must die and reset every day until he learns to beat the alien invaders." },
  { t:"The Moon is a Harsh Mistress", a:"Robert A. Heinlein", p:14.99, g:2, d:"The colonists of a lunar penal colony revolt against Earth with the help of a supercomputer named Mike." },
  { t:"Stranger in a Strange Land", a:"Robert A. Heinlein", p:15.99, g:2, d:"A human raised by Martians returns to Earth and upends society with an alien perspective on religion, love, and freedom." },

  // Books Literary Fiction
  { t:"Catch-22", a:"Joseph Heller", p:15.99, g:3, d:"Set in WWII, a bombardier tries to get out of flying missions by being declared insane — but wanting to avoid danger proves he's sane." },
  { t:"Slaughterhouse-Five", a:"Kurt Vonnegut", p:14.99, g:3, d:"Billy Pilgrim becomes unstuck in time and experiences the firebombing of Dresden and an alien abduction simultaneously." },
  { t:"The Catcher in the Rye", a:"J.D. Salinger", p:13.99, g:3, d:"Holden Caulfield wanders New York after being expelled from prep school in a classic portrait of teenage alienation." },
  { t:"Franny and Zooey", a:"J.D. Salinger", p:13.99, g:3, d:"Two of the Glass siblings — brilliant, neurotic — wrestle with faith, identity, and family in this novella pair." },
  { t:"On the Road", a:"Jack Kerouac", p:14.99, g:3, d:"The defining novel of the Beat Generation — Sal Paradise and Dean Moriarty crisscross America in search of experience." },
  { t:"The Bell Jar", a:"Sylvia Plath", p:13.99, g:3, d:"Semi-autobiographical novel following Esther Greenwood's breakdown and recovery as a young woman in 1950s New York." },
  { t:"Their Eyes Were Watching God", a:"Zora Neale Hurston", p:14.99, g:3, d:"A Black woman in the early 20th century South searches for identity and love across three marriages." },

  // Books Horror
  { t:"Gerald's Game", a:"Stephen King", p:15.99, g:4, d:"Handcuffed to a bed after her husband's sudden death, a woman must survive the night with only her own mind — and something in the corner." },
  { t:"Needful Things", a:"Stephen King", p:16.99, g:4, d:"A new shop opens in Castle Rock selling townspeople their heart's desire at a terrible price." },
  { t:"The Elementals", a:"Michael McDowell", p:15.99, g:4, d:"Two families vacation in a beach house on Alabama's Gulf Coast — but a third, sand-filled house nearby hides something ancient and malevolent." },
  { t:"Burnt Offerings", a:"Robert Marasco", p:14.99, g:4, d:"A family rents a mansion for the summer — and the house feeds on their life force to restore itself." },
  { t:"The Hellbound Heart", a:"Clive Barker", p:13.99, g:4, d:"Frank Cotton opens a puzzle box and summons the Cenobites — beings from a dimension of extreme sensation." },

  // Books Thriller
  { t:"And Then There Were None", a:"Agatha Christie", p:13.99, g:5, d:"Ten strangers are lured to an isolated island and begin to die one by one, matching the verses of a nursery rhyme." },
  { t:"The Murder of Roger Ackroyd", a:"Agatha Christie", p:13.99, g:5, d:"Hercule Poirot investigates a murder in a quiet English village with a twist that shocked the world on publication." },
  { t:"Murder on the Orient Express", a:"Agatha Christie", p:13.99, g:5, d:"Poirot is trapped on a snowbound train where every passenger had motive to kill the victim." },
  { t:"The Talented Mr. Ripley", a:"Patricia Highsmith", p:14.99, g:5, d:"Tom Ripley is sent to Italy to bring home a playboy — and commits a desperate act that sets him on a dark path." },
  { t:"Ripley Under Ground", a:"Patricia Highsmith", p:14.99, g:5, d:"Tom Ripley's comfortable life is threatened when a murdered painter's work starts appearing on the market." },
  { t:"In the Woods", a:"Tana French", p:15.99, g:5, d:"A Dublin detective investigates a murder near the woods where he survived a childhood trauma he can no longer remember." },
  { t:"The Likeness", a:"Tana French", p:15.99, g:5, d:"A detective goes undercover as a dead woman to infiltrate a group of grad students — and finds herself being absorbed into their world." },

  // Manga Action
  { t:"Fairy Tail Vol. 1", a:"Hiro Mashima", p:9.99, g:6, d:"Lucy Heartfilia joins the boisterous Fairy Tail guild and teams up with the fire dragon slayer Natsu Dragneel." },
  { t:"Fairy Tail Vol. 2", a:"Hiro Mashima", p:9.99, g:6, d:"The Fairy Tail guild battles the dark wizard Lullaby in a city-threatening showdown." },
  { t:"Blue Exorcist Vol. 1", a:"Kazue Kato", p:9.99, g:6, d:"Rin Okumura discovers he is the son of Satan and enrolls in an exorcist academy to fight his heritage." },
  { t:"Soul Eater Vol. 1", a:"Atsushi Ohkubo", p:9.99, g:6, d:"At the Death Weapon Meister Academy, students and their weapon partners hunt evil souls to create Death Scythes." },
  { t:"Noragami Vol. 1", a:"Adachitoka", p:9.99, g:6, d:"A minor god with no shrine charges five yen to grant wishes — and must earn enough faith to truly matter." },
  { t:"Attack on Titan Vol. 3", a:"Hajime Isayama", p:9.99, g:6, d:"The 57th Expedition begins — and the Female Titan appears among the Scouts, threatening everything." },
  { t:"Attack on Titan Vol. 4", a:"Hajime Isayama", p:9.99, g:6, d:"Secrets about the Titans are revealed as Eren struggles to master his transformation ability." },

  // Manga Romance
  { t:"Horimiya Vol. 1", a:"HERO", p:10.99, g:8, d:"Hori, a popular girl who secretly handles housework, and Miyamura, a quiet boy with hidden tattoos, discover each other's true selves." },
  { t:"Horimiya Vol. 2", a:"HERO", p:10.99, g:8, d:"Hori and Miyamura grow closer as their circle of friends expands and romantic feelings deepen." },
  { t:"Ouran High School Host Club Vol. 1", a:"Bisco Hatori", p:9.99, g:8, d:"Haruhi accidentally breaks an expensive vase and must work as a host club member — despite being a girl — to pay off the debt." },
  { t:"Nana Vol. 1", a:"Ai Yazawa", p:9.99, g:8, d:"Two young women named Nana meet on a train to Tokyo and become roommates, navigating very different paths to love and music." },
  { t:"Skip Beat! Vol. 1", a:"Yoshiki Nakamura", p:9.99, g:8, d:"Abandoned by the boy she loved, Kyoko enters the entertainment industry to get revenge — and discovers her own talent." },

  // Manga Thriller/Mystery
  { t:"The Promised Neverland Vol. 3", a:"Kaiu Shirai", p:9.99, g:13, d:"Emma, Norman, and Ray put their escape plan in motion — but the house mother is always watching." },
  { t:"The Promised Neverland Vol. 4", a:"Kaiu Shirai", p:9.99, g:13, d:"The children face a devastating betrayal as their escape night approaches." },
  { t:"Bungo Stray Dogs Vol. 1", a:"Kafka Asagiri", p:10.99, g:13, d:"A teenager with a fearsome ability joins the Armed Detective Agency — a group of literary-named superhuman investigators." },
  { t:"Bungo Stray Dogs Vol. 2", a:"Kafka Asagiri", p:10.99, g:13, d:"The Agency faces the Port Mafia as Dazai's dark past is slowly revealed." },

  // Light Novels
  { t:"No Game No Life Vol. 1", a:"Yuu Kamiya", p:13.99, g:14, d:"Genius NEET siblings are transported to a world where all disputes are settled by games — and immediately set out to conquer it." },
  { t:"No Game No Life Vol. 2", a:"Yuu Kamiya", p:13.99, g:14, d:"Sora and Shiro challenge the Warbeast nation for the right to challenge the other Exceed races." },
  { t:"Sword Art Online Vol. 5 (Phantom Bullet)", a:"Reki Kawahara", p:12.99, g:14, d:"Kirito enters the gun-based GGO as a quest to find and stop a player who can kill people through the game." },
  { t:"The Devil is a Part-Timer! Vol. 1", a:"Satoshi Wagahara", p:13.99, g:14, d:"The Demon King flees to modern Tokyo and gets a part-time job at MgRonald's while plotting his return to power." },
  { t:"The Devil is a Part-Timer! Vol. 2", a:"Satoshi Wagahara", p:13.99, g:14, d:"A new threat from Ente Isla arrives in Tokyo, disrupting Maou's peaceful life as a fast-food employee." },
  { t:"Is It Wrong to Try to Pick Up Girls in a Dungeon? Vol. 1", a:"Fujino Omori", p:12.99, g:16, d:"Bell Cranel enters the dungeon alone and is saved by the famous adventurer Aiz Wallenstein — triggering his rapid growth." },
  { t:"Is It Wrong to Try to Pick Up Girls in a Dungeon? Vol. 2", a:"Fujino Omori", p:12.99, g:16, d:"Bell trains desperately to become worthy of Aiz while navigating the complex politics of Orario." },
  { t:"Spice and Wolf Vol. 1", a:"Isuna Hasekura", p:12.99, g:15, d:"A traveling merchant discovers a wolf deity in his cart and the two form an unlikely partnership built on wit and trade." },
  { t:"Spice and Wolf Vol. 2", a:"Isuna Hasekura", p:12.99, g:15, d:"Lawrence plots a silver trade scheme that could make him rich — but Holo sees complications he doesn't." },

  // Graphic Novels
  { t:"Y: The Last Man Vol. 3: One Small Step", a:"Brian K. Vaughan", p:14.99, g:22, d:"Yorick and Agent 355 discover why male astronauts in orbit survived the plague — and face new threats on Earth." },
  { t:"Y: The Last Man Vol. 4: Safeword", a:"Brian K. Vaughan", p:14.99, g:22, d:"Yorick is captured by a mysterious organization and must face his own psychological demons." },
  { t:"Preacher Vol. 3: Proud Americans", a:"Garth Ennis", p:14.99, g:23, d:"Jesse Custer learns more about the Saint of Killers and confronts the Grail organization." },
  { t:"Transmetropolitan Vol. 3: Year of the Bastard", a:"Warren Ellis", p:15.99, g:22, d:"Spider Jerusalem covers the presidential campaign — a contest of two equally corrupt villains." },
  { t:"From Hell", a:"Alan Moore", p:29.99, g:24, d:"A detailed fictional account of the Jack the Ripper murders, following the killer and the detective on his trail." },
  { t:"V for Vendetta", a:"Alan Moore", p:19.99, g:19, d:"In a fascist future England, a mysterious anarchist in a Guy Fawkes mask wages a one-man war against the government." },
  { t:"The League of Extraordinary Gentlemen Vol. 1", a:"Alan Moore", p:17.99, g:23, d:"Victorian adventure heroes — Allan Quatermain, Mina Murray, Captain Nemo and more — unite under British Intelligence." },
  { t:"Planetary Vol. 1: All Over the World and Other Stories", a:"Warren Ellis", p:15.99, g:22, d:"A team of archaeologists of the impossible investigate the physical residue of the 20th century's pulp heroes." },
  { t:"Hawkeye Vol. 1: My Life as a Weapon", a:"Matt Fraction", p:15.99, g:19, d:"What does Hawkeye do when he's not being an Avenger? He fixes his car, buys a building, and gets into trouble." },
  { t:"Daredevil by Frank Miller Vol. 1", a:"Frank Miller", p:16.99, g:19, d:"Frank Miller's defining run on Daredevil — introducing Elektra and reshaping the Man Without Fear." },
];

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'inkbound',
  });
  console.log('✅ Connected');

  let inserted = 0, skipped = 0;
  for (const b of books) {
    const [existing] = await conn.query(
      'SELECT id FROM products WHERE title = ? AND author = ?',
      [b.t, b.a]
    );
    if (existing.length > 0) { skipped++; continue; }

    let cat_id;
    if (b.g >= 1  && b.g <= 5)  cat_id = 1;
    else if (b.g >= 6  && b.g <= 13) cat_id = 2;
    else if (b.g >= 14 && b.g <= 18) cat_id = 3;
    else cat_id = 4;

    await conn.query(
      `INSERT INTO products (title, author, price, genre_id, category_id, description, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
      [b.t, b.a, b.p, b.g, cat_id, b.d, 25]
    );
    inserted++;
  }

  const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM products');
  console.log(`✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`📚 Total products in database: ${total}`);
  await conn.end();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
