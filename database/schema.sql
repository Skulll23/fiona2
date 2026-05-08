-- Drop and recreate to guarantee a clean state
DROP DATABASE IF EXISTS inkbound;
CREATE DATABASE inkbound;
USE inkbound;

-- categories
CREATE TABLE categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  display_order INT DEFAULT 0
);

-- Genres
CREATE TABLE genres (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT          NOT NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  UNIQUE (category_id, slug),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- products
CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  author      VARCHAR(255)  NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  image_url    VARCHAR(255)  NOT NULL DEFAULT '/images/placeholder.jpg',
  cover_color VARCHAR(20)   NOT NULL DEFAULT '#f5ece0',
  category_id INT           NOT NULL,
  genre_id    INT           NOT NULL,
  description TEXT,
  goodreads_rating DECIMAL(3,2) DEFAULT NULL,
  stock       INT           NOT NULL DEFAULT 50,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (genre_id)    REFERENCES genres(id)
);

-- users — stores registered accounts; password stored as bcrypt hash
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed one admin account (password: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin', 'admin@inkbound.com',
   '$2b$10$anXWZyf0cS/DUehl88f4Z.XOt3u6Ed3gLjvqf82Zcsl4F0xZdXCWW',
   'admin');

-- cart
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id    INT          NULL,
  product_id INT          NOT NULL,
  quantity   INT          NOT NULL DEFAULT 1,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
  UNIQUE KEY unique_session_product (session_id, product_id)
);

--  Seed categories

INSERT INTO categories (name, slug, display_order) VALUES
  ('Books',               'books',          1),
  ('Manga/Manhwa/Manhua', 'manga',          2),
  ('Light Novels',        'light-novels',   3),
  ('Graphic Novels',      'graphic-novels', 4);


--  Seed genres  (linked by category slug)
-- Books
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Fantasy',         'fantasy'   FROM categories WHERE slug='books';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Sci-Fi',          'sci-fi'    FROM categories WHERE slug='books';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Literary Fiction','literary'  FROM categories WHERE slug='books';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Horror',          'horror'    FROM categories WHERE slug='books';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Thriller',        'thriller'  FROM categories WHERE slug='books';


-- Manga/Manhwa/Manhua
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Action',       'action'       FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Comedy',      'comedy'      FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Romance',      'romance'      FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Fantasy',      'fantasy'      FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Horror',       'horror'       FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Sci-Fi',       'sci-fi'       FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Sports',       'sports'       FROM categories WHERE slug='manga';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Thriller',        'thriller'  FROM categories WHERE slug='manga';

-- Light Novels
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Isekai',  'isekai'   FROM categories WHERE slug='light-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Fantasy', 'fantasy'  FROM categories WHERE slug='light-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Action',  'action'   FROM categories WHERE slug='light-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Sci-Fi',  'sci-fi'   FROM categories WHERE slug='light-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Mystery', 'mystery'  FROM categories WHERE slug='light-novels';

-- Graphic Novels
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Superhero', 'superhero'  FROM categories WHERE slug='graphic-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Horror',    'horror'     FROM categories WHERE slug='graphic-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Historical',    'historical'     FROM categories WHERE slug='graphic-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Sci-Fi',    'sci-fi'     FROM categories WHERE slug='graphic-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Fantasy',   'fantasy'    FROM categories WHERE slug='graphic-novels';
INSERT INTO genres (category_id, name, slug)
SELECT id, 'Crime',     'crime'      FROM categories WHERE slug='graphic-novels';

--  SEED PRODUCTS
--  genre_id and category_id are looked up by name/slug
-- books
INSERT INTO products (title, author, price, cover_color, category_id, genre_id, description, image_url) VALUES
(
  'The Three Body Problem', 'Liu Cixin', 22.99, '#e8f0e8',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi'    AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'Set against the backdrop of China''s Cultural Revolution, a secret military project sends signals into space to establish contact with aliens. An alien civilization on the brink of destruction captures the signal and plans to invade Earth. Meanwhile, on Earth, different camps start forming, planning to either welcome the superior beings and help them take over a world seen as corrupt, or to fight against the invasion.',
  '/images/the-three-body-problem.jpg'
),(
  'Starship Troopers', 'Robert A. Heinlein', 22.99, '#f5ece0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi'     AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'The historians can''t seem to settle whether to call this one "The Third Space War" (or the fourth), or whether "The First Interstellar War" fits it better. We just call it "The Bug War." Everything up to then and still later were "incidents," "patrols," or "police actions." However, you are just as dead if you buy the farm in an "incident" as you are if you buy it in a declared war...
  
  In one of Robert A. Heinlein''s most controversial bestsellers, a recruit of the future goes through the toughest boot camp in the Universe-and into battle with the Terran Mobile Infantry against mankind''s most alarming enemy.',
  '/images/starship-troopers.jpg'
),(
  'Project Hail Mary', 'Andy Weir', 24.99, '#e0e8f5',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi'     AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A lone astronaut must save Earth - but first he has to figure out where he is and how he got there.',
  '/images/project-hail-mary.jpg'
),(
  'House of Leaves', 'Mark Z. Danielewski', 39.99, '#e0e8f5',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='thriller'     AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A young family moves into a small home on Ash Tree Lane where they discover something is terribly wrong: their house is bigger on the inside than it is on the outside.',
  '/images/house-of-leaves.jpg'
),(
  'The Fellowship of the Ring', 'J.R.R. Tolkien', 22.99, '#e8f0e8',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'The first volume of The Lord of the Rings: a dark and dangerous journey as a young hobbit sets out to destroy a ring of power before it falls into the hands of the Dark Lord.',
  '/images/fellowship-of-the-ring.jpg'
),(
  'The Poppy War', 'R.F. Kuang', 22.99, '#f0e8e0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A dark military fantasy inspired by 20th‑century Chinese history, following a war orphan who rises through a national military academy only to discover that gods and shamans are real - and that the price of power may be her own humanity.',
  '/images/poppy-war.jpg'
),(
  'Strange Houses', 'Uketsu', 32.99, '#f5ece0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='thriller' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A gripping psychological thriller about a family that moves into an old house with a dark secret - and the walls that whisper.',
  '/images/strange-houses.jpg'
),(
  'Heart of a Dog', 'Mikhail Bulgakov', 19.99, '#f5f0e8',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='literary' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A biting satirical novella about a stray dog who is surgically turned into a crude, boorish man - an allegory of the Soviet experiment gone wrong.',
  '/images/heart-of-a-dog.jpg'
),(
  'Tender is the Flesh', 'Agustina Bazterrica', 24.99, '#f0e8f0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A dystopian horror novel set in a world where a virus has made all animal meat poisonous, and humans are legally bred for consumption. A chilling exploration of complicity and moral decay.',
  '/images/tender-is-the-flesh.jpg'
),(
  'Animal Farm', 'George Orwell', 24.99, '#ede8e0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='literary' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A timeless allegorical novella about a group of farm animals who overthrow their human master, only to see their revolutionary ideals corrupted by the pigs who seize power.',
  '/images/animal-farm.jpg'
),(
  'Never Lie', 'Freida McFadden', 14.99, '#e0e0e8',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='thriller' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A psychological thriller where a young couple, trapped in a remote house during a blizzard, discovers old audio tapes that reveal a dark secret - but who is telling the truth?',
  '/images/never-lie.jpg'
),(
  'Slaughterhouse-Five', 'Kurt Vonnegut', 24.99, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A groundbreaking anti-war novel that blends science fiction, autobiography, and satire, following Billy Pilgrim as he becomes "unstuck in time" and witnesses the firebombing of Dresden.',
  '/images/slaughterhouse-five.jpg'
),(
  'The War of the Worlds', 'H.G. Wells', 22.99, '#e0f0e0',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'The classic alien invasion novel that terrified readers in 1898: Martians with heat-rays and poisonous black smoke descend on Victorian England, and humanity must fight for survival.',
  '/images/war-of-the-worlds.jpg'
),(
  'Hyperion', 'Dan Simmons', 24.99, '#e0e8f5',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'A sweeping space opera told in the style of The Canterbury Tales, where seven pilgrims journey to the mysterious Time Tombs on the world of Hyperion to confront the legendary Shrike.',
  '/images/hyperion.jpg'
),(
  'Ciaphas Cain: Hero of the Imperium', 'Sandy Mitchell', 26.99, '#f0e8f5',
  (SELECT id FROM categories WHERE slug='books'),
  (SELECT id FROM genres WHERE slug='sci-fi'  AND category_id=(SELECT id FROM categories WHERE slug='books')),
  'In the war-torn future of the 41st Millennium Commissar Ciaphas Cain, hero of the Imperium, is respected by his peers and an inspiration to his men - at least that''s what the propaganda would have you believe. The reality is very different, for Ciaphas is simply looking for an easy life and a way to stay out of peril. However, fate has a habit of throwing him into the deadliest situations, and luck (mixed with self preservation) always manages to pull him through and onto the loftiest of pedestals. To survive Commissar Cain must dodge, bluff and trick his way out of trouble, even if it increases his status beyond his control!',
  '/images/ciaphas-cain.jpg'
);

-- Manga/Manhwa/Manhua
INSERT INTO products (title, author, price, cover_color, category_id, genre_id, description, image_url) VALUES
(
  '20th Century Boys, Vol. 1', 'Naoki Urasawa', 33.99, '#f5e0e0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='thriller' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  ' Humanity, having faced extinction at the end of the 20th century, would not have entered the new millennium if it weren''t for them. In 1969, during their youth, they created a symbol. In 1997, as the coming disaster slowly starts to unfold, that symbol returns. This is the story of a group of boys who try to save the world.',
  '/images/20th-century.jpg'
),(
  'Land of the Lustrous, Vol. 1', 'Haruko Ichikawa', 24.99, '#e8e0f5',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'The young gem Phosphorite can''t seem to do anything right. Phos has nothing but a big mouth and guts. Cinnabar, a classmate, is a loner, shunned by the other gems because of the toxins emitted from their body. But when they get together, they will learn that they both have an essential role to play in the fight against the Moonfolk, who are intent on coming to Earth to abduct the gem folk and destroy their world. A beautifully-drawn new action manga from Haruko Ichikawa, winner of the Osamu Tezuka Cultural Prize.',
  '/images/land-of-the-lustrous.jpg'
),(
  'The Color of the End: Mission in the Apocalypse, Vol. 1', 'Haruo Iwamune', 24.99, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'Years after Earth was wiped clean of life by the mysterious beings known as Executioners, a single girl walks alone through the empty, beautiful ruins. Her seemingly endless mission—to search for survivors, cleanse the land, and bury the dead. But when the countless funerals are over, will there be anyone left alive to mourn...?',
  '/images/color-of-the-end.jpg'
),(
  'Magi: The Labyrinth of Magic, Vol. 1', 'Shinobu Ohtaka', 24.99, '#f0e8e0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A boy named Aladdin travels the world with his magical flute, seeking dungeons and uncovering the secrets of destiny.',
  '/images/magi.jpg'
),(
  'Billy Bat, Vol. 1', 'Naoki Urasawa', 24.99, '#e0e0e8',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='thriller' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A Japanese-American manga artist working on a Batman-like character discovers that his creation may be connected to a centuries-old conspiracy spanning history.',
  '/images/billy-bat.jpg'
),(
  'After God, Vol. 1', 'Enomoto', 24.99, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'In a world where gods have returned and demand human sacrifice, a girl with mysterious powers fights back.',
  '/images/after-god.jpg'
),(
  'Black Night Parade, Vol. 1', 'Hikaru Nakamura', 24.99, '#f0e0e0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A young man is recruited by a mysterious company that operates on Christmas Eve, delivering gifts – and curses – to unsuspecting families.',
  '/images/black-night-parade.jpg'
),(
  'Bug Ego, Vol. 1', 'ONE', 24.99, '#e0f0e8',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='action' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A surreal action comedy about a boy whose consciousness is trapped inside a video game, fighting bizarre enemies with bizarre logic.',
  '/images/bug-ego.jpg'
),(
  'Love Bullet, Vol. 1', 'Inori', 24.99, '#fce8f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='romance' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A cupid-in-training must shoot arrows of love, but her targets are anything but ordinary.',
  '/images/love-bullet.jpg'
),(
  'Ajin: Demi-Human, Vol. 1', 'Gamon Sakurai', 24.99, '#e0e8f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='action' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A high school student discovers he is an Ajin - an immortal being - and is hunted by the government for brutal experiments.',
  '/images/ajin.jpg'
),(
  'Killing Me / Killing You, Vol. 1', 'Sakura', 24.99, '#e8e0f5',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'Two immortal wanderers travel through a post-apocalyptic wasteland, trying to find a way to finally die.',
  '/images/killing-me-killing-you.jpg'
),(
  'Demon Slayer, Vol. 1', 'Koyoharu Gotouge', 24.99, '#e0e8f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='action' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A boy becomes a demon slayer to avenge his family and cure his demon-turned sister.',
  '/images/demon-slayer.jpg'
),(
  'Psyche Matashitemo, Vol. 1', 'Murakami', 24.99, '#e8e0e0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='action' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A psychological horror about a girl who can see the memories of the dead, and the secrets she uncovers.',
  '/images/psyche-matashitemo.jpg'
),(
  'The Disastrous Life of Saiki K, Vol. 1', 'Shuichi Asou', 24.99, '#f0f0e8',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='comedy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A psychic teen tries to live a normal life, but his powers and eccentric friends make it impossible.',
  '/images/saiki-k.jpg'
),(
  'The Girl From the Other Side: Siúil, a Rún, Vol. 1', 'Nagabe', 24.99, '#e8f0e8',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A cursed girl lives with a mysterious being in a forbidden land, in a hauntingly beautiful fairy tale.',
  '/images/girl-from-the-other-side.jpg'
),(
  'Tomie', 'Junji Ito', 24.99, '#f0e8f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A beautiful, immortal girl drives her victims to madness and murder, only to regenerate from any piece of her body.',
  '/images/tomie.jpg'
),(
  'Junji Ito''s Cat Diary: Yon & Mu', 'Junji Ito', 19.99, '#f5ece0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='comedy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'The master of horror turns to comedy as he documents his life with two mischievous cats.',
  '/images/cat-diary.jpg'
),(
  'Unholy Blood', 'Lina Lim', 24.99, '#f0e0e8',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='action' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A vampire girl hides her powers to live a normal life, but when a serial killer emerges, she must fight back. (Manhwa)',
  '/images/unholy-blood.jpg'
),(
  'The Boxer', 'JH', 24.49, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='sports' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A gifted young boxer with a tragic past rises through the ranks, facing opponents who each have their own reasons to fight. (Manhwa)',
  '/images/the-boxer.jpg'
),(
  'Sweet Home', 'Carnby Kim', 24.99, '#e0e0e0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A reclusive teenager must lead survivors in his apartment building as humans turn into monsters driven by their desires. (Manhwa)',
  '/images/sweet-home.jpg'
),(
  'Shotgun Boy', 'Carnby Kim', 24.99, '#d0d0d0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'A prequel to Sweet Home, following a bullied boy who finds a shotgun and fights for survival as monsters emerge.',
  '/images/shotgun-boy.jpg'
),(
  'I''m Really Not the Demon God''s Lackey, Book 1', 'Great Calamity Of Fire (万劫火)', 24.99, '#d0d0d0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='comedy' AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'placeholder.',
  '/images/im-really-not-the-demon-gods-lackey.jpg'
),(
  'Tower Dungeon, Vol. 1', 'Tsutomu Nihei', 24.99, '#f5e8e0',
  (SELECT id FROM categories WHERE slug='manga'),
  (SELECT id FROM genres WHERE slug='fantasy'      AND category_id=(SELECT id FROM categories WHERE slug='manga')),
  'The ingenuous farmboy Yuva must accompany a contingent of knights through the increasingly dangerous floors of massive tower on the way to rescue the princess, Nihei bringing his unique sensibility to bear on a crumbling world of malformed creatures, wounded soldiers, and labyrinthine darkness.',
  '/images/tower-dungeon.jpg'
);

-- Light Novels
INSERT INTO products (title, author, price, cover_color, category_id, genre_id, description, image_url) VALUES
(
  'All You Need is Kill, Vol. 1', 'Hiroshi Sakurazaka', 20.99, '#f0e8f5',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='sci-fi'  AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'When the alien Mimics invade, Keiji Kiriya is just one of many recruits shoved into a suit of battle armor called a Jacket and sent out to kill. Keiji dies on the battlefield, only to be reborn each morning to fight and die again and again. On the 158th iteration, he gets a message from a mysterious ally - the female soldier known as the Full Metal Bitch. Is she the key to Keiji''s escape or his final death?',
  '/images/all-you-need-is-kill.jpg'
),(
  'The Eminence in Shadow, Vol. 1', 'Daisuke Aizawa', 20.49, '#fdf0e0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='isekai'  AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'Even in his past life, Cid''s dream wasn''t to become a protagonist or a final boss. He''d rather lie low as a minor character until it''s prime time to reveal he''s a mastermind...or at least, do the next best thing-pretend to be one! And now that he''s been reborn into another world, he''s ready to set the perfect conditions to live out his dreams to the fullest. Armed with his overactive imagination, Cid jokingly recruits members to his organization and makes up a whole backstory about an evil cult that they need to take down. Well, as luck would have it, these imaginary adversaries turn out to be the real deal-and everyone knows the truth but him!',
  '/images/eminence-in-shadow.jpg'
),(
  'Omniscient Reader''s Viewpoint, Vol. 1', 'singNsong', 20.49, '#e8f5e8',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='action'       AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'Struggling office worker Dokja Kim''s sole joy in life is an online novel so obscure that he''s it''s only reader. Then one day the story comes to an end...and so does the world. Horrific monsters, ordinary people forced to kill or be killed, and Goblins gleefully streaming the carnage to a celestial audience—with the apocalypse straight out of his favorite novel unfolding around him, Dokja is the only one who can see this story to the finale!',
  '/images/omniscient-reader.jpg'
),(
  'Re:ZERO -Starting Life in Another World-, Vol. 1', 'Tappei Nagatsuki', 20.99, '#f0e8f5',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='isekai' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'Subaru Natsuki is summoned to a fantasy world, but his only power is "Return by Death" – every time he dies, he goes back in time. He must use this painful ability to save the people he loves.',
  '/images/rezero.jpg'
),(
  'So I''m a Spider, So What?, Vol. 1', 'Okina Baba', 20.49, '#e8f0e8',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='isekai' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A high school girl is reincarnated as a spider in a deadly dungeon. Using her wits and determination, she must survive monsters, starvation, and a system that wants her dead.',
  '/images/spider.jpg'
),(
  'Death March to the Parallel World Rhapsody, Vol. 1', 'Hiro Ainana', 20.99, '#f5f0e8',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='isekai' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A game programmer falls asleep and wakes up in his own RPG world as a young adventurer. With overpowered abilities, he explores the world while trying to keep a low profile.',
  '/images/death-march.jpg'
),(
  'The Saga of Tanya the Evil, Vol. 1: Deus lo Vult', 'Carlo Zen', 20.49, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='isekai' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A ruthless Japanese salaryman is reincarnated as a little girl in an alternate World War I-era Europe, becoming a brilliant but feared mage officer who will do anything to survive.',
  '/images/tanya.jpg'
),(
  'Gosick, Vol. 1', 'Kazuki Sakuraba', 20.99, '#e8eaf6',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='mystery' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'Set in 1920s fictional European country, a Japanese exchange student meets a brilliant but reclusive girl in the school library. Together they solve mysteries that weave through history.',
  '/images/gosick.jpg'
),(
  'Log Horizon, Vol. 1', 'Mamare Touno', 20.99, '#e0f0e8',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='isekai' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'Thirty thousand Japanese gamers are trapped in the MMORPG Elder Tale. Veteran player Shiroe uses his strategic genius to build a new society within the game world.',
  '/images/log-horizon.jpg'
),(
  'Lout of the Count''s Family, Vol. 1', 'Yu Ryeo Han', 20.99, '#f5e8e8',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A man falls asleep reading a novel and wakes up as a lazy, villainous noble in the story. He uses his knowledge of the plot to survive, but his attempts to slack off only make him more heroic.',
  '/images/lout-counts-family.jpg'
),(
  'Release That Witch, Vol. 1', 'Er Mu', 20.49, '#f0e8e0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'An engineer is reincarnated as a prince in a medieval world where witches are persecuted. He uses his scientific knowledge to turn witches into industrial power and build a modern kingdom.',
  '/images/release-that-witch.jpg'
),(
  'Heaven Official''s Blessing, Vol. 1', 'Mo Xiang Tong Xiu', 20.99, '#fce8f0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A disgraced god who was banished to the mortal realm ascends again. He wanders the world collecting scraps, only to become entangled with a mysterious ghost king.',
  '/images/heaven-official-blessing.jpg'
),(
  'Lord of the Mysteries, Vol. 1', 'Cuttlefish That Loves Diving', 20.99, '#e0e0f0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='mystery' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A modern man is transported to a Victorian-era steampunk world with Lovecraftian horrors. He joins a secret organization of "beyonders" to uncover the truth and protect his sanity.',
  '/images/lord-of-mysteries.jpg'
),(
  'Shadow Slave, Vol. 1', 'Guiltythree', 20.99, '#e8e0e8',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='action' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'A boy is chosen by a mysterious spell and thrown into a nightmare realm. He must survive deadly trials and gain powers, only to return to a world that now sees him as a "shadow slave."',
  '/images/shadow-slave.jpg'
),(
  'Little Mushroom, Vol. 1', 'Shisi', 20.99, '#e0f0f5',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'In a post-apocalyptic world where humanity is infected by a spore that mutates them into monsters, a mushroom who has gained human form searches for his stolen spore while trying to survive in a hostile human base.',
  '/images/little-mushroom.jpg'
),(
  'Got Dropped into a Ghost Story, Still Gotta Work, Vol. 1', 'Deoksoo Baek', 20.99, '#f0e0e0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='mystery' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'An ordinary salaryman is transported into a horror novel. Instead of trying to become a hero, he uses his office skills to survive, but the ghosts are not impressed by his spreadsheets.',
  '/images/ghost-story-work.jpg'
),(
  'Overlord, Vol. 1', 'Kugane Maruyama', 20.99, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='light-novels'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='light-novels')),
  'For twelve years, the virtual world of Yggdrasil has served as the playground and battlefield for the skeletal lord Momonga and his guild of fellow monsters, Ainz Ooal Gown. But the guild''s glory days are over, and the game is shutting down permanently. When Momonga logs in one last time just to be there when the servers go dark, something happens--and suddenly, fantasy is reality. A rogues'' gallery of fanatically devoted NPCs is ready to obey his every order, but the world Momonga now inhabits is not the one he remembers. The game may be over, but the epic tale of Ainz Ooal Gown is only beginning...',
  '/images/overlord.jpg'
);

-- Graphic Novels
INSERT INTO products (title, author, price, cover_color, category_id, genre_id, description, image_url) VALUES
(
  'Watchmen', 'Alan Moore', 44.99, '#e0e0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='superhero'  AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'Considered the greatest graphic novel in the history of the medium, the Hugo Award-winning story chronicles the fall from grace of a group of superheroes plagued by all-too-human failings. Along the way, the concept of the superhero is dissected as an unknown assassin stalks the erstwhile heroes.',
  '/images/watchmen.jpg'
),-- Additional graphic novels
(
  'Maus', 'Art Spiegelman', 36.99, '#f5f0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='historical' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A Pulitzer Prize-winning memoir of the Holocaust, told with Jews as mice and Nazis as cats. The author interviews his father, a survivor, and struggles to document the unspeakable.',
  '/images/maus.jpg'
),(
  'Absolute Martian Manhunter, Vol. 1', 'Steve Orlando', 33.99, '#e0f0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='superhero' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A deluxe collection of the Martian Manhunter''s greatest adventures, exploring the loneliness of the last Martian and his role as a shape - shifting detective on Earth.',
  '/images/absolute-martian-manhunter.jpg'
),(
  'Hellboy Omnibus', 'Mike Mignola', 42.99, '#e0e0e0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'The first volume of the epic saga collecting Hellboy''s early adventures: from his summoning by the Nazis to his battles with witches, demons, and the occult.',
  '/images/hellboy-omnibus.jpg'
),(
  'V for Vendetta, Vol. 1', 'Alan Moore', 34.99, '#e8e0e0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='crime' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'In a dystopian future Britain, a masked anarchist known as V orchestrates a revolution against the fascist government, aided by a young woman he rescues.',
  '/images/v-for-vendetta.jpg'
),(
  'Kill Six Billion Demons Book 1', 'Tom Parkinson-Morgan', 26.99, '#f0e0f0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A college student is thrust into a multiverse of demons, gods, and angels after her boyfriend is kidnapped. She must claim the power of the six billion demons to survive.',
  '/images/kill-six-billion-demons.jpg'
),(
  'Secret Wars, Vol. 1', 'Jonathan Hickman', 42.99, '#e0e0f0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='superhero' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'The 2015 event that collapsed the Marvel multiverse into a single planet called Battleworld, where heroes and villains fight for survival under God Emperor Doom.',
  '/images/secret-wars.jpg'
),(
  'Sweet Tooth, Vol. 1', 'Jeff Lemire', 39.99, '#f0ece0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A post-apocalyptic fable about a hybrid deer-boy named Gus, who travels across a ravaged America with a mysterious protector.',
  '/images/sweet-tooth.jpg'
),(
  'Transformers, Vol. 1', 'Daniel Warren Johnson', 30.99, '#e0e0e0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='sci-fi' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'The reboot of the Transformers comic line from Skybound Entertainment, focusing on the war between Autobots and Decepticons on Earth with high-stakes action.',
  '/images/transformers-skybound.jpg'
),(
  'Something is Killing the Children', 'James Tynion IV', 27.99, '#e8e0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A small town is terrorized by monsters that only children can see. A mysterious woman named Erica Slaughter arrives to hunt them, but her methods are brutal.',
  '/images/something-is-killing-children.jpg'
),(
  'Absolute Batman, Vol. 1', 'Various', 33.99, '#e8e0e0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='superhero' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A deluxe oversized collection of iconic Batman tales, celebrating the Dark Knight''s legacy through legendary story arcs.',
  '/images/absolute-batman.jpg'
),(
  'Batman: The Killing Joke', 'Alan Moore', 32.99, '#f0e0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='crime' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'The definitive Joker origin story, as the Clown Prince of Crime attempts to drive Commissioner Gordon mad to prove that anyone can become like him.',
  '/images/killing-joke.jpg'
),(
  'Flashpoint', 'Geoff Johns', 27.99, '#e0e0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='superhero' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'The Flash travels back in time to save his mother, creating an alternate timeline where the world is ravaged by war and heroes are changed forever.',
  '/images/flashpoint.jpg'
),(
  'Injustice: Gods Among Us, Vol. 1', 'Tom Taylor', 20.99, '#e8e0f0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='superhero' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'The Joker tricks Superman into killing Lois Lane, driving the Man of Steel to establish a global dictatorship. Batman leads a resistance against the tyrant.',
  '/images/injustice-gods-among-us.jpg'
),(
  'Once & Future, Vol. 1', 'Kieron Gillen', 38.99, '#f0e8e0',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='fantasy' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'A retired monster hunter and her grandson must stop a group of neo-Nazis from resurrecting King Arthur and the monsters of British mythology.',
  '/images/once-and-future.jpg'
),(
  'The Nice House on the Lake', 'James Tynion IV', 36.99, '#f5f0e8',
  (SELECT id FROM categories WHERE slug='graphic-novels'),
  (SELECT id FROM genres WHERE slug='horror' AND category_id=(SELECT id FROM categories WHERE slug='graphic-novels')),
  'Martinez Bueno comes a tale of psychological terror that plays on the anxieties of the 21st century. Walter has always seemed a little strange. But after he invites 10 friends to a weekend getaway at a secluded house on a lake, they discover just how different he is when he reveals his true face and announces that life as they knew it will never be the same again.',
  '/images/nice-house-on-the-lake.jpg'
);

-- ratings
-- books
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'The Three Body Problem';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'Starship Troopers';
UPDATE products SET goodreads_rating = 4.5 WHERE title = 'Project Hail Mary';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Ciaphas Cain: Hero of the Imperium';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'House of Leaves';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'The Fellowship of the Ring';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'The Poppy War';
UPDATE products SET goodreads_rating = 3.6 WHERE title = 'Strange Houses';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Heart of a Dog';
UPDATE products SET goodreads_rating = 3.8 WHERE title = 'Tender is the Flesh';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'Animal Farm';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Never Lie';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Slaughterhouse-Five';
UPDATE products SET goodreads_rating = 3.8 WHERE title = 'The War of the Worlds';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Hyperion';

-- Manga/Manhwa/Manhua
UPDATE products SET goodreads_rating = 4.4 WHERE title = '20th Century Boys, Vol. 1';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Land of the Lustrous, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'The Color of the End: Mission in the Apocalypse, Vol. 1';
UPDATE products SET goodreads_rating = 4.6 WHERE title = 'Omniscient Reader''s Viewpoint, Vol. 1';
UPDATE products SET goodreads_rating = 3.9 WHERE title = 'Tower Dungeon, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Magi: The Labyrinth of Magic, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Billy Bat, Vol. 1';
UPDATE products SET goodreads_rating = 3.9 WHERE title = 'After God, Vol. 1';
UPDATE products SET goodreads_rating = 3.6 WHERE title = 'Black Night Parade, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Bug Ego, Vol. 1';
UPDATE products SET goodreads_rating = 4.6 WHERE title = 'Love Bullet, Vol. 1';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'Ajin: Demi-Human, Vol. 1';
UPDATE products SET goodreads_rating = 3.3 WHERE title = 'Killing Me / Killing You, Vol. 1';
UPDATE products SET goodreads_rating = 4.5 WHERE title = 'Demon Slayer, Vol. 1';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'Psyche Matashitemo, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'The Disastrous Life of Saiki K, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'The Girl From the Other Side: Siúil, a Rún, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Tomie';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Junji Ito''s Cat Diary: Yon & Mu';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Unholy Blood';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'The Boxer';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Sweet Home';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Shotgun Boy';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'I''m Really Not The Demon God''s Lackey, Book 1';

-- Light Novels
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'All You Need is Kill, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'The Eminence in Shadow, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Overlord, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Re:ZERO -Starting Life in Another World-, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'So I''m a Spider, So What?, Vol. 1';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'Death March to the Parallel World Rhapsody, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'The Saga of Tanya the Evil, Vol. 1: Deus lo Vult';
UPDATE products SET goodreads_rating = 4.1 WHERE title = 'Gosick, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Log Horizon, Vol. 1';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Lout of the Count''s Family, Vol. 1';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Release That Witch, Vol. 1';
UPDATE products SET goodreads_rating = 4.6 WHERE title = 'Heaven Official''s Blessing, Vol. 1';
UPDATE products SET goodreads_rating = 4.5 WHERE title = 'Lord of the Mysteries, Vol. 1';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Shadow Slave, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Little Mushroom, Vol. 1';
UPDATE products SET goodreads_rating = 3.9 WHERE title = 'Got Dropped into a Ghost Story, Still Gotta Work, Vol. 1';

-- Graphic Novels
UPDATE products SET goodreads_rating = 4.8 WHERE title = 'Watchmen';
UPDATE products SET goodreads_rating = 4.0 WHERE title = 'The Nice House on the Lake';
UPDATE products SET goodreads_rating = 4.6 WHERE title = 'Maus';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Absolute Martian Manhunter, Vol. 1';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Hellboy Omnibus';
UPDATE products SET goodreads_rating = 4.5 WHERE title = 'V for Vendetta, Vol. 1';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Kill Six Billion Demons Book 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Secret Wars, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Sweet Tooth, Vol. 1';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Transformers, Vol. 1';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Something is Killing the Children';
UPDATE products SET goodreads_rating = 4.3 WHERE title = 'Absolute Batman, Vol. 1';
UPDATE products SET goodreads_rating = 4.5 WHERE title = 'Batman: The Killing Joke';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Flashpoint';
UPDATE products SET goodreads_rating = 4.4 WHERE title = 'Injustice: Gods Among Us, Vol. 1';
UPDATE products SET goodreads_rating = 4.2 WHERE title = 'Once & Future, Vol. 1';

