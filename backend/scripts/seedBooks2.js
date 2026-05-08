require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const books = [
  // ── BOOKS: Fantasy (genre_id=1, cat_id=1) ──
  { title: "The Name of the Wind", author: "Patrick Rothfuss", price: 17.99, genre_id: 1, description: "The riveting first-person narrative of a young man who grows to be the most notorious magician, lover, and musician of his age.", stock: 30 },
  { title: "The Wise Man's Fear", author: "Patrick Rothfuss", price: 19.99, genre_id: 1, description: "Day Two of the Kingkiller Chronicle — Kvothe chases rumors of the Amyr and learns the secrets of the Adem.", stock: 25 },
  { title: "A Game of Thrones", author: "George R.R. Martin", price: 18.99, genre_id: 1, description: "In a land where summers span decades and winters last a lifetime, trouble is brewing in the Seven Kingdoms of Westeros.", stock: 40 },
  { title: "A Clash of Kings", author: "George R.R. Martin", price: 18.99, genre_id: 1, description: "A comet the color of blood and flame cuts across the sky. And from the ancient citadel of Dragonstone to the forbidding shores of Winterfell, chaos reigns.", stock: 35 },
  { title: "A Storm of Swords", author: "George R.R. Martin", price: 18.99, genre_id: 1, description: "Of the five contenders for power, one is dead, another in disfavor, and still the wars rage as violently as ever.", stock: 35 },
  { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", price: 16.99, genre_id: 1, description: "A young hobbit is given a ring of enormous and terrible power, and sets out on an epic quest to destroy it.", stock: 50 },
  { title: "The Two Towers", author: "J.R.R. Tolkien", price: 16.99, genre_id: 1, description: "The Fellowship is sundered. Frodo and Sam, guided by Gollum, creep ever deeper into Mordor.", stock: 45 },
  { title: "The Return of the King", author: "J.R.R. Tolkien", price: 16.99, genre_id: 1, description: "The final volume of the Lord of the Rings — the great War of the Ring reaches its climax in Mordor.", stock: 45 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", price: 14.99, genre_id: 1, description: "Bilbo Baggins is swept into an epic quest to reclaim the lost Dwarf Kingdom of Erebor.", stock: 60 },
  { title: "American Gods", author: "Neil Gaiman", price: 17.99, genre_id: 1, description: "A war is gathering. The old gods of mythology face a new pantheon of media, technology, and globalization.", stock: 30 },
  { title: "Neverwhere", author: "Neil Gaiman", price: 15.99, genre_id: 1, description: "Below the streets of London there is a place most people could never even dream of — London Below.", stock: 28 },
  { title: "The Lies of Locke Lamora", author: "Scott Lynch", price: 16.99, genre_id: 1, description: "An orphan's life is spared by the Thiefmaker of Camorr, who sets him loose in a world of ruthless political intrigue.", stock: 25 },
  { title: "Red Seas Under Red Skies", author: "Scott Lynch", price: 16.99, genre_id: 1, description: "Locke Lamora and Jean Tannen flee to the exotic city of Tal Verrar, intent on stealing a fortune from the world's most secure casino.", stock: 20 },
  { title: "The Blade Itself", author: "Joe Abercrombie", price: 16.99, genre_id: 1, description: "Logen Ninefingers, infamous barbarian, has a bad habit of following murderous fights wherever they lead.", stock: 25 },
  { title: "Before They Are Hanged", author: "Joe Abercrombie", price: 16.99, genre_id: 1, description: "Superior Glokta leads an impossible task to hold the city of Dagoska against the Gurkish army.", stock: 22 },
  { title: "The Last Argument of Kings", author: "Joe Abercrombie", price: 16.99, genre_id: 1, description: "The end of the trilogy — destinies will be decided as war sweeps across the Union.", stock: 22 },
  { title: "Assassin's Apprentice", author: "Robin Hobb", price: 15.99, genre_id: 1, description: "Young Fitz, the illegitimate son of the noble Prince Chivalry, is raised in the stable quarters of the royal court.", stock: 25 },
  { title: "Royal Assassin", author: "Robin Hobb", price: 15.99, genre_id: 1, description: "Fitz has survived his first mission as king's assassin but is left little more than a helpless cripple.", stock: 22 },
  { title: "The Priory of the Orange Tree", author: "Samantha Shannon", price: 22.99, genre_id: 1, description: "A world-spanning epic of queens, dragons, and the divided houses of East and West.", stock: 20 },
  { title: "The Goblin Emperor", author: "Katherine Addison", price: 15.99, genre_id: 1, description: "The youngest son of an elven emperor wakes to find himself suddenly the ruler of an empire he was never expected to lead.", stock: 22 },

  // ── BOOKS: Sci-Fi (genre_id=2, cat_id=1) ──
  { title: "Hyperion", author: "Dan Simmons", price: 17.99, genre_id: 2, description: "On the world called Hyperion, beyond the reach of galactic law, seven pilgrims set forth on a final voyage to the Time Tombs.", stock: 28 },
  { title: "The Fall of Hyperion", author: "Dan Simmons", price: 17.99, genre_id: 2, description: "The terrifying conclusion to the Hyperion Cantos opens as the secret of the Shrike is finally revealed.", stock: 25 },
  { title: "Endymion", author: "Dan Simmons", price: 17.99, genre_id: 2, description: "Set centuries after the fall of the Hegemony, a young man is tasked with protecting a girl who carries a terrible secret.", stock: 22 },
  { title: "Rendezvous with Rama", author: "Arthur C. Clarke", price: 14.99, genre_id: 2, description: "A massive cylinder appears in the solar system, and a crew of astronauts must explore this artifact of alien origin.", stock: 30 },
  { title: "Childhood's End", author: "Arthur C. Clarke", price: 14.99, genre_id: 2, description: "Peaceful alien invaders take over the Earth and bring a utopia — but at what cost to humanity's future?", stock: 28 },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", price: 15.99, genre_id: 2, description: "An envoy to a planet of beings with no fixed gender must navigate political intrigue on an alien world.", stock: 25 },
  { title: "The Dispossessed", author: "Ursula K. Le Guin", price: 15.99, genre_id: 2, description: "A physicist from an anarchist society visits the lush twin planet of his birth to break down the walls between two worlds.", stock: 25 },
  { title: "A Fire Upon the Deep", author: "Vernor Vinge", price: 16.99, genre_id: 2, description: "Two children are stranded on a planet of doglike aliens while a vast fleet races across the galaxy to save or destroy them.", stock: 20 },
  { title: "Old Man's War", author: "John Scalzi", price: 15.99, genre_id: 2, description: "At the age of 75, John Perry joins the Colonial Defense Forces and discovers the universe is a dangerous place.", stock: 30 },
  { title: "Redshirts", author: "John Scalzi", price: 14.99, genre_id: 2, description: "Ensign Andrew Dahl discovers that life aboard the Universal Union's flagship is incredibly dangerous — and suspects something strange is going on.", stock: 25 },
  { title: "The Martian Chronicles", author: "Ray Bradbury", price: 14.99, genre_id: 2, description: "A beautifully written account of the colonization of Mars and the destruction of Martian civilization.", stock: 28 },
  { title: "Snow Crash", author: "Neal Stephenson", price: 17.99, genre_id: 2, description: "In a future America, pizza delivery, computer viruses, and linguistic anthropology all collide in the Metaverse.", stock: 25 },
  { title: "Cryptonomicon", author: "Neal Stephenson", price: 19.99, genre_id: 2, description: "Two parallel narratives across WWII cryptography and a 1990s dot-com startup weave together in a massive techno-thriller.", stock: 20 },

  // ── BOOKS: Literary Fiction (genre_id=3, cat_id=1) ──
  { title: "To Kill a Mockingbird", author: "Harper Lee", price: 14.99, genre_id: 3, description: "A young girl in the Deep South witnesses her father's courageous act of defending a Black man wrongly accused.", stock: 50 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 12.99, genre_id: 3, description: "In Jazz Age Long Island, young Nick Carraway encounters the mysterious and fabulously wealthy Jay Gatsby.", stock: 55 },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", price: 16.99, genre_id: 3, description: "The multi-generational story of the Buendía family in the mythical town of Macondo.", stock: 35 },
  { title: "Beloved", author: "Toni Morrison", price: 15.99, genre_id: 3, description: "Set after the Civil War, a mother is haunted by the ghost of her dead daughter in a tale of slavery's enduring trauma.", stock: 30 },
  { title: "Middlemarch", author: "George Eliot", price: 16.99, genre_id: 3, description: "A sweeping portrait of English provincial life in the 1830s, following intersecting stories of love, politics, and ambition.", stock: 25 },
  { title: "Anna Karenina", author: "Leo Tolstoy", price: 17.99, genre_id: 3, description: "A tale of love and infidelity among Russian aristocracy, following a married woman's tragic affair with Count Vronsky.", stock: 30 },
  { title: "Madame Bovary", author: "Gustave Flaubert", price: 13.99, genre_id: 3, description: "Emma Bovary, a doctor's wife, pursues romance and luxury that her provincial life cannot provide.", stock: 28 },
  { title: "The Sound and the Fury", author: "William Faulkner", price: 15.99, genre_id: 3, description: "The decline of the Southern Compson family told through four highly individual voices.", stock: 22 },
  { title: "Invisible Man", author: "Ralph Ellison", price: 15.99, genre_id: 3, description: "A nameless African American man navigates a society that renders him invisible due to his race.", stock: 28 },
  { title: "Siddhartha", author: "Hermann Hesse", price: 12.99, genre_id: 3, description: "A young Brahmin's spiritual journey of self-discovery in ancient India.", stock: 35 },
  { title: "Steppenwolf", author: "Hermann Hesse", price: 14.99, genre_id: 3, description: "Harry Haller, a lone wolf of a man, struggles between his human and wolf natures in Weimar Germany.", stock: 28 },
  { title: "A Passage to India", author: "E.M. Forster", price: 14.99, genre_id: 3, description: "Tensions between East and West play out through an incident at the Marabar Caves in British-ruled India.", stock: 25 },
  { title: "Tender is the Night", author: "F. Scott Fitzgerald", price: 14.99, genre_id: 3, description: "The decline of Dick Diver, a promising psychiatrist, told against the glittering backdrop of 1920s Europe.", stock: 22 },

  // ── BOOKS: Horror (genre_id=4, cat_id=1) ──
  { title: "The Stand", author: "Stephen King", price: 19.99, genre_id: 4, description: "A plague kills most of humanity; the survivors are drawn into a confrontation between good and evil.", stock: 30 },
  { title: "It", author: "Stephen King", price: 19.99, genre_id: 4, description: "Seven adults return to their hometown to confront a horrific force that has lurked there since their childhood.", stock: 35 },
  { title: "The Shining", author: "Stephen King", price: 16.99, genre_id: 4, description: "Writer Jack Torrance takes a winter caretaker job at the isolated Overlook Hotel, where supernatural forces drive him to madness.", stock: 40 },
  { title: "Pet Sematary", author: "Stephen King", price: 16.99, genre_id: 4, description: "A doctor and his family move to Maine, where a burial ground with a terrifying power lies beyond their new home.", stock: 28 },
  { title: "Misery", author: "Stephen King", price: 15.99, genre_id: 4, description: "Novelist Paul Sheldon is rescued from a car crash by his self-described 'number one fan' — and her help comes at a terrible price.", stock: 30 },
  { title: "Haunting of Hill House", author: "Shirley Jackson", price: 14.99, genre_id: 4, description: "Dr. Montague brings three others to Hill House, a dark, forbidding place that seems to have a will of its own.", stock: 28 },
  { title: "Interview with the Vampire", author: "Anne Rice", price: 15.99, genre_id: 4, description: "Louis tells a journalist of his life as a vampire — of his maker Lestat and the child-vampire Claudia.", stock: 30 },
  { title: "The Vampire Lestat", author: "Anne Rice", price: 15.99, genre_id: 4, description: "The charismatic vampire Lestat tells his own story — how he became a vampire and what he found in the world of the undead.", stock: 25 },
  { title: "House of Leaves", author: "Mark Z. Danielewski", price: 18.99, genre_id: 4, description: "A family discovers their house is impossible — bigger on the inside than outside — and documents it through a layered, unsettling narrative.", stock: 20 },
  { title: "Bird Box", author: "Josh Malerman", price: 15.99, genre_id: 4, description: "Something is out there, something terrifying that must not be seen — or you will be driven to madness and violence.", stock: 28 },

  // ── BOOKS: Thriller (genre_id=5, cat_id=1) ──
  { title: "The Silent Patient", author: "Alex Michaelides", price: 16.99, genre_id: 5, description: "A famous painter shoots her husband five times and then never speaks again — a psychotherapist becomes obsessed with uncovering her motive.", stock: 35 },
  { title: "The Midnight Library", author: "Matt Haig", price: 16.99, genre_id: 5, description: "Between life and death there is a library, and its books give you the chance to try another version of your life.", stock: 40 },
  { title: "Gone Girl", author: "Gillian Flynn", price: 16.99, genre_id: 5, description: "On their fifth wedding anniversary, Nick Dunne's wife Amy disappears — and Nick becomes the prime suspect.", stock: 38 },
  { title: "Sharp Objects", author: "Gillian Flynn", price: 15.99, genre_id: 5, description: "Reporter Camille Preaker returns to her hometown to investigate the murders of two preteen girls.", stock: 30 },
  { title: "Dark Places", author: "Gillian Flynn", price: 15.99, genre_id: 5, description: "Libby Day survived the massacre of her family as a child and has lived off donations ever since — until a killer cult group forces her to revisit the past.", stock: 28 },
  { title: "The Girl on the Train", author: "Paula Hawkins", price: 15.99, genre_id: 5, description: "Rachel watches a seemingly perfect couple every day from the train — until one day she sees something shocking.", stock: 38 },
  { title: "The Da Vinci Code", author: "Dan Brown", price: 15.99, genre_id: 5, description: "Harvard symbologist Robert Langdon is drawn into a deadly conspiracy involving a secret society and the Holy Grail.", stock: 40 },
  { title: "Angels and Demons", author: "Dan Brown", price: 15.99, genre_id: 5, description: "A murder at CERN sends Robert Langdon racing to Rome to uncover the ancient order of the Illuminati.", stock: 35 },
  { title: "Inferno", author: "Dan Brown", price: 15.99, genre_id: 5, description: "Langdon awakens in Florence with no memory and finds himself at the center of a plot to unleash a deadly virus.", stock: 30 },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", price: 16.99, genre_id: 5, description: "Journalist Mikael Blomkvist and hacker Lisbeth Salander investigate a decades-old disappearance in a Swedish industrialist family.", stock: 35 },
  { title: "The Girl Who Played with Fire", author: "Stieg Larsson", price: 16.99, genre_id: 5, description: "Lisbeth Salander is accused of triple murder and goes into hiding while Blomkvist tries to clear her name.", stock: 30 },
  { title: "The Girl Who Kicked the Hornet's Nest", author: "Stieg Larsson", price: 16.99, genre_id: 5, description: "The explosive conclusion — Lisbeth Salander faces trial while fighting for her life and the truth about her past.", stock: 28 },

  // ── MANGA: Action (genre_id=6, cat_id=2) ──
  { title: "Naruto Vol. 1", author: "Masashi Kishimoto", price: 9.99, genre_id: 6, description: "A mischievous ninja with a powerful fox demon sealed inside him dreams of becoming the leader of his village.", stock: 50 },
  { title: "Naruto Vol. 2", author: "Masashi Kishimoto", price: 9.99, genre_id: 6, description: "Naruto, Sasuke, and Sakura take on their first real mission — protecting a bridge builder in the Land of Waves.", stock: 45 },
  { title: "Naruto Vol. 3", author: "Masashi Kishimoto", price: 9.99, genre_id: 6, description: "The battle at the bridge reaches its peak as Naruto's hidden power awakens for the first time.", stock: 42 },
  { title: "Bleach Vol. 1", author: "Tite Kubo", price: 9.99, genre_id: 6, description: "Ichigo Kurosaki becomes a substitute Soul Reaper and vows to protect the living from evil spirits.", stock: 45 },
  { title: "Bleach Vol. 2", author: "Tite Kubo", price: 9.99, genre_id: 6, description: "Ichigo faces the enormous hollow Grand Fisher, who is responsible for his mother's death.", stock: 40 },
  { title: "Dragon Ball Z Vol. 1", author: "Akira Toriyama", price: 9.99, genre_id: 6, description: "Goku discovers his alien heritage when his brother Raditz arrives on Earth to recruit him.", stock: 50 },
  { title: "Dragon Ball Z Vol. 2", author: "Akira Toriyama", price: 9.99, genre_id: 6, description: "The Z-Fighters train desperately to face the incoming Saiyan threat of Nappa and Vegeta.", stock: 45 },
  { title: "One Piece Vol. 3", author: "Eiichiro Oda", price: 9.99, genre_id: 6, description: "Luffy and Zoro recruit the thief Nami to their fledgling pirate crew while battling Captain Buggy.", stock: 48 },
  { title: "One Piece Vol. 4", author: "Eiichiro Oda", price: 9.99, genre_id: 6, description: "Luffy's small crew faces the greatest swordsman east of the Grand Line — the fearsome Mihawk.", stock: 45 },
  { title: "Hunter x Hunter Vol. 1", author: "Yoshihiro Togashi", price: 9.99, genre_id: 6, description: "Gon Freecss leaves his island home to find his father, taking the legendary Hunter Exam as his first step.", stock: 40 },
  { title: "Hunter x Hunter Vol. 2", author: "Yoshihiro Togashi", price: 9.99, genre_id: 6, description: "The Hunter Exam continues through deadly forests and psychological traps to find the best of the best.", stock: 38 },
  { title: "My Hero Academia Vol. 3", author: "Kohei Horikoshi", price: 9.99, genre_id: 6, description: "Midoriya and his U.A. classmates train for their first major combat exercise — but the League of Villains attacks.", stock: 50 },
  { title: "My Hero Academia Vol. 4", author: "Kohei Horikoshi", price: 9.99, genre_id: 6, description: "The sports festival begins! Midoriya must prove himself worthy of inheriting All Might's power.", stock: 48 },
  { title: "Black Clover Vol. 1", author: "Yūki Tabata", price: 9.99, genre_id: 6, description: "In a world where magic is everything, a boy born without magic dreams of becoming the Wizard King.", stock: 35 },
  { title: "Chainsaw Man Vol. 3", author: "Tatsuki Fujimoto", price: 10.99, genre_id: 6, description: "Denji and Power join Division 4 of Public Safety Devil Hunters, facing increasingly dangerous assignments.", stock: 38 },

  // ── MANGA: Romance (genre_id=8, cat_id=2) ──
  { title: "Fruits Basket Vol. 1", author: "Natsuki Takaya", price: 9.99, genre_id: 8, description: "Tohru Honda discovers the Sohma family's secret — some of them transform into animals of the Chinese zodiac when hugged by a member of the opposite sex.", stock: 38 },
  { title: "Fruits Basket Vol. 2", author: "Natsuki Takaya", price: 9.99, genre_id: 8, description: "Tohru grows closer to Yuki and Kyo as more of the cursed Sohma family members are revealed.", stock: 35 },
  { title: "Kaguya-sama: Love is War Vol. 1", author: "Aka Akasaka", price: 10.99, genre_id: 8, description: "Two genius students at an elite academy are in love but refuse to confess — instead devising elaborate schemes to make the other confess first.", stock: 40 },
  { title: "Kaguya-sama: Love is War Vol. 2", author: "Aka Akasaka", price: 10.99, genre_id: 8, description: "The psychological war of love continues as Shirogane and Kaguya escalate their schemes to new heights.", stock: 38 },
  { title: "Maid-Sama! Vol. 1", author: "Hiro Fujiwara", price: 9.99, genre_id: 8, description: "The fiercely competitive student council president works secretly as a maid at a maid café — until her school's most popular boy discovers her secret.", stock: 32 },
  { title: "Toradora! Vol. 1", author: "Yuyuko Takemiya", price: 10.99, genre_id: 8, description: "Ryuji and Taiga — classmates who couldn't be more different — team up to help each other confess to their respective crushes.", stock: 30 },
  { title: "Ao Haru Ride Vol. 1", author: "Io Sakisaka", price: 9.99, genre_id: 8, description: "Futaba reunites with her first love in high school — but he seems to have changed completely.", stock: 28 },
  { title: "Say I Love You Vol. 1", author: "Kanae Hazuki", price: 9.99, genre_id: 8, description: "A girl who has never had friends or a boyfriend has her life turned upside down when the popular boy falls for her.", stock: 28 },

  // ── MANGA: Comedy (genre_id=7, cat_id=2) ──
  { title: "Gintama Vol. 1", author: "Hideaki Sorachi", price: 9.99, genre_id: 7, description: "In an alternate Edo Japan occupied by aliens, samurai Gintoki Sakata works odd jobs to pay the rent.", stock: 35 },
  { title: "Gintama Vol. 2", author: "Hideaki Sorachi", price: 9.99, genre_id: 7, description: "More absurd adventures with the Yorozuya — from a haunted dojo to a very persistent debt collector.", stock: 32 },
  { title: "Grand Blue Dreaming Vol. 1", author: "Kenji Inoue", price: 11.99, genre_id: 7, description: "A young man joins a diving club at his coastal university but finds the club is mostly about drinking and brotherhood.", stock: 30 },
  { title: "Nichijou Vol. 1", author: "Keiichi Arawi", price: 10.99, genre_id: 7, description: "The everyday life of three high school friends is anything but normal — robots, deer, professors, and octopuses abound.", stock: 28 },
  { title: "The Way of the Househusband Vol. 1", author: "Kousuke Oono", price: 10.99, genre_id: 7, description: "A legendary yakuza retires to become a househusband — and takes his new duties just as seriously as his criminal past.", stock: 40 },
  { title: "Konosuba Vol. 1", author: "Natsume Akatsuki", price: 10.99, genre_id: 7, description: "A NEET is reborn in a fantasy world and forms a dysfunctional party with a useless goddess, an explosion-obsessed mage, and a masochistic crusader.", stock: 35 },

  // ── MANGA: Fantasy (genre_id=9, cat_id=2) ──
  { title: "Magi: The Labyrinth of Magic Vol. 1", author: "Shinobu Ohtaka", price: 9.99, genre_id: 9, description: "A young boy with mysterious powers searches for his destiny in a world of dungeons filled with djinn.", stock: 30 },
  { title: "The Rising of the Shield Hero Vol. 1 (Manga)", author: "Aiya Kyu", price: 10.99, genre_id: 9, description: "Naofumi Iwatani is summoned to another world as the shield hero and must survive betrayal to save the kingdom.", stock: 35 },
  { title: "That Time I Got Reincarnated as a Slime Vol. 1 (Manga)", author: "Taiki Kawakami", price: 10.99, genre_id: 9, description: "A man dies and is reborn as a slime monster with unique abilities — and begins building a nation of monsters.", stock: 38 },
  { title: "Mushishi Vol. 1", author: "Yuki Urushibara", price: 10.99, genre_id: 9, description: "Ginko travels across ancient Japan as a 'Mushi Master', studying and solving problems caused by mysterious life forms.", stock: 28 },
  { title: "Claymore Vol. 1", author: "Norihiro Yagi", price: 9.99, genre_id: 9, description: "Half-human, half-monster warriors called Claymores wield giant swords to protect humans from shape-shifting demons.", stock: 28 },
  { title: "Overlord Vol. 1 (Manga)", author: "Hugin Miyama", price: 10.99, genre_id: 9, description: "A player is trapped in a MMORPG as the final server shutdown occurs and the NPCs gain sentience.", stock: 30 },

  // ── MANGA: Horror (genre_id=10, cat_id=2) ──
  { title: "Uzumaki", author: "Junji Ito", price: 14.99, genre_id: 10, description: "A small town becomes obsessed with spirals — and the obsession grows into something deeply, cosmically horrifying.", stock: 35 },
  { title: "Tomie", author: "Junji Ito", price: 13.99, genre_id: 10, description: "Tomie is a beautiful girl who drives men to murder — and cannot die. A collection of Junji Ito's most disturbing tales.", stock: 30 },
  { title: "Gyo", author: "Junji Ito", price: 12.99, genre_id: 10, description: "Dead fish walk on mechanical legs, and a deadly smell spreads across Japan in this nightmare from Junji Ito.", stock: 28 },
  { title: "Homunculus Vol. 1", author: "Hideo Yamamoto", price: 11.99, genre_id: 10, description: "A homeless man agrees to experimental trepanation surgery and gains the ability to see people's subconscious fears.", stock: 22 },
  { title: "Flowers of Evil Vol. 1", author: "Shuzo Oshimi", price: 10.99, genre_id: 10, description: "A middle school boy's obsession with Baudelaire and a deviant girl lead him down a dark path.", stock: 25 },
  { title: "Made in Abyss Vol. 1", author: "Akihito Tsukushi", price: 12.99, genre_id: 10, description: "A young orphan girl and a robot boy descend into an immense chasm to find her mother — as the abyss reveals its curse.", stock: 30 },

  // ── MANGA: Sci-Fi (genre_id=11, cat_id=2) ──
  { title: "Ghost in the Shell", author: "Masamune Shirow", price: 14.99, genre_id: 11, description: "In a cyberpunk future, a cyborg secret agent explores the boundary between human and machine consciousness.", stock: 28 },
  { title: "Pluto Vol. 1", author: "Naoki Urasawa", price: 12.99, genre_id: 11, description: "A reimagining of Astro Boy — the world's greatest robots are being murdered one by one.", stock: 25 },
  { title: "Pluto Vol. 2", author: "Naoki Urasawa", price: 12.99, genre_id: 11, description: "The investigation deepens as Gesicht uncovers a global conspiracy behind the robot murders.", stock: 22 },
  { title: "20th Century Boys Vol. 1", author: "Naoki Urasawa", price: 12.99, genre_id: 11, description: "A childhood game becomes a global conspiracy as an ordinary man realizes a terrorist cult is following his childhood plans.", stock: 28 },
  { title: "20th Century Boys Vol. 2", author: "Naoki Urasawa", price: 12.99, genre_id: 11, description: "Kenji and his friends dig deeper into the conspiracy, and a mysterious 'Book of Prophecy' is revealed.", stock: 25 },
  { title: "Biomega Vol. 1", author: "Tsutomu Nihei", price: 11.99, genre_id: 11, description: "In a dying world overrun by zombie-like drones, a motorcycle-riding agent seeks a cure for humanity.", stock: 22 },

  // ── MANGA: Sports (genre_id=12, cat_id=2) ──
  { title: "Slam Dunk Vol. 1", author: "Takehiko Inoue", price: 9.99, genre_id: 12, description: "A delinquent joins the basketball team to impress a girl — and turns out to be a basketball prodigy.", stock: 40 },
  { title: "Slam Dunk Vol. 2", author: "Takehiko Inoue", price: 9.99, genre_id: 12, description: "Hanamichi's raw talent is tested in his first real game as the Shohoku team struggles to find its footing.", stock: 38 },
  { title: "Yowamushi Pedal Vol. 1", author: "Wataru Watanabe", price: 10.99, genre_id: 12, description: "A shy anime-loving boy discovers he's an incredible natural cyclist and joins his school's road racing club.", stock: 28 },
  { title: "Captain Tsubasa Vol. 1", author: "Yoichi Takahashi", price: 9.99, genre_id: 12, description: "Young Tsubasa Ozora dreams of winning the World Cup with Japan — his first step is dominating junior high school soccer.", stock: 30 },
  { title: "Eyeshield 21 Vol. 1", author: "Riichiro Inagaki", price: 9.99, genre_id: 12, description: "Sena Kobayakawa, a fast but timid boy, is drafted by the American football team and hidden under a helmet as the mysterious Eyeshield 21.", stock: 28 },
  { title: "Major Vol. 1", author: "Takuya Mitsuda", price: 9.99, genre_id: 12, description: "Goro Honda dreams of following in his father's footsteps as a professional baseball pitcher.", stock: 25 },

  // ── MANGA: Thriller (genre_id=13, cat_id=2) ──
  { title: "Monster Vol. 2", author: "Naoki Urasawa", price: 12.99, genre_id: 13, description: "Dr. Tenma pursues Johan across Germany, but his quarry seems always one step ahead in this intricate thriller.", stock: 28 },
  { title: "Monster Vol. 3", author: "Naoki Urasawa", price: 12.99, genre_id: 13, description: "The mystery of Johan's origins deepens as Tenma discovers the twins' horrifying past.", stock: 25 },
  { title: "Liar Game Vol. 1", author: "Shinobu Kaitani", price: 11.99, genre_id: 13, description: "A naive girl is drawn into a vicious game where the goal is to swindle as much money as possible from your opponent.", stock: 28 },
  { title: "Doubt Vol. 1", author: "Yoshiki Tonogai", price: 10.99, genre_id: 13, description: "Six players of a mobile game called 'Doubt' wake up in a locked building — someone among them is a traitor.", stock: 25 },
  { title: "Judge Vol. 1", author: "Yoshiki Tonogai", price: 10.99, genre_id: 13, description: "Seven people are trapped with animal masks and forced to vote each other to death in this psychological thriller.", stock: 22 },
  { title: "Deadman Wonderland Vol. 1", author: "Jinsei Kataoka", price: 10.99, genre_id: 13, description: "A boy is wrongly convicted and sent to a prison amusement park where inmates fight to the death for spectators.", stock: 25 },

  // ── LIGHT NOVELS: Isekai (genre_id=14, cat_id=3) ──
  { title: "Re:Zero Vol. 3", author: "Tappei Nagatsuki", price: 13.99, genre_id: 14, description: "Subaru suffers increasingly harsh resets as he tries to prevent calamity at the Roswaal mansion.", stock: 28 },
  { title: "Re:Zero Vol. 4", author: "Tappei Nagatsuki", price: 13.99, genre_id: 14, description: "The White Whale arc begins — Subaru leads a raid against the legendary monster that has terrorized the kingdom.", stock: 25 },
  { title: "Overlord Vol. 3", author: "Kugane Maruyama", price: 13.99, genre_id: 14, description: "Ainz dispatches his guild members to expand his influence, and the mysterious 'Bloody Valkyrie' incident begins.", stock: 25 },
  { title: "Overlord Vol. 4", author: "Kugane Maruyama", price: 13.99, genre_id: 14, description: "The Lizardman tribe arc — Ainz commands his general Cocytus to prove his worth by defeating the lizardman warriors.", stock: 22 },
  { title: "Sword Art Online Vol. 3", author: "Reki Kawahara", price: 12.99, genre_id: 14, description: "The Fairy Dance arc — Kirito learns Asuna is trapped in another VR game and must reach the top of the World Tree.", stock: 30 },
  { title: "Sword Art Online Vol. 4", author: "Reki Kawahara", price: 12.99, genre_id: 14, description: "Kirito and Leafa approach the World Tree while Asuna searches for a way to escape from within.", stock: 28 },
  { title: "Rising of the Shield Hero Vol. 3", author: "Aneko Yusagi", price: 13.99, genre_id: 14, description: "Naofumi and Raphtalia face the second wave of calamity while navigating the kingdom's prejudice against them.", stock: 25 },
  { title: "Rising of the Shield Hero Vol. 4", author: "Aneko Yusagi", price: 13.99, genre_id: 14, description: "Naofumi adds a third member to his party and enters the Cal Mira island event to level up before the next wave.", stock: 22 },
  { title: "That Time I Got Reincarnated as a Slime Vol. 3", author: "Fuse", price: 13.99, genre_id: 14, description: "Rimuru's nation grows as he negotiates with dwarves and confronts the Orc Disaster threatening the forest.", stock: 28 },
  { title: "Konosuba Vol. 3", author: "Natsume Akatsuki", price: 13.99, genre_id: 14, description: "Kazuma and his dysfunctional party take on a giant frog quest — and Kazuma's dubious life choices multiply.", stock: 30 },

  // ── LIGHT NOVELS: Fantasy (genre_id=15, cat_id=3) ──
  { title: "Spice and Wolf Vol. 3", author: "Isuna Hasekura", price: 13.99, genre_id: 15, description: "Lawrence and Holo visit the city of Kumersun, where Lawrence attempts a grand merchant scheme — with dangerous consequences.", stock: 22 },
  { title: "Spice and Wolf Vol. 4", author: "Isuna Hasekura", price: 13.99, genre_id: 15, description: "Lawrence risks everything in a silver futures deal that could free Holo — or destroy him.", stock: 20 },
  { title: "The Ancient Magus' Bride Vol. 1", author: "Kore Yamazaki", price: 12.99, genre_id: 15, description: "A young girl sold at auction is purchased by a mysterious masked mage who makes her his apprentice and future bride.", stock: 28 },
  { title: "Delicious in Dungeon Vol. 1 (LN)", author: "Ryoko Kui", price: 12.99, genre_id: 15, description: "An adventuring party must survive the dungeon by cooking and eating the monsters they defeat.", stock: 25 },
  { title: "Grimgar of Fantasy and Ash Vol. 1", author: "Ao Jūmonji", price: 13.99, genre_id: 15, description: "A group of strangers find themselves in a fantasy world with only their names remembered — and must survive as novice hunters.", stock: 22 },

  // ── LIGHT NOVELS: Action (genre_id=16, cat_id=3) ──
  { title: "Dungeon ni Deai Vol. 3 (Is It Wrong to Try to Pick Up Girls in a Dungeon?)", author: "Fujino Omori", price: 13.99, genre_id: 16, description: "Bell confronts the Minotaur that nearly killed him — and his rapid growth begins to attract dangerous attention.", stock: 25 },
  { title: "Dungeon ni Deai Vol. 4", author: "Fujino Omori", price: 13.99, genre_id: 16, description: "The War Game arc — Hestia Familia must compete in a city-wide battle to protect Bell from Apollo Familia.", stock: 22 },
  { title: "Black Clover Vol. 1 (LN)", author: "Yūki Tabata", price: 12.99, genre_id: 16, description: "The light novel adaptation expands on Asta and Yuno's backstory as they leave their village for the Magic Knights exam.", stock: 25 },
  { title: "Campfire Cooking in Another World Vol. 1", author: "Ren Eguchi", price: 13.99, genre_id: 16, description: "A man summoned to another world is given the overpowered ability to order food from a Japanese supermarket.", stock: 20 },
  { title: "Mushoku Tensei Vol. 3 (Jobless Reincarnation)", author: "Rifujin na Magonote", price: 13.99, genre_id: 16, description: "Rudeus and Eris navigate the Demon Continent, growing stronger as the mystery of the Teleportation Incident deepens.", stock: 25 },

  // ── LIGHT NOVELS: Sci-Fi (genre_id=17, cat_id=3) ──
  { title: "The Empty Box and Zeroth Maria Vol. 1", author: "Eiji Mikage", price: 13.99, genre_id: 17, description: "A high school boy is trapped in a time loop by a mysterious 'box' — and a cold transfer student claims she's lived the same day 13,118 times.", stock: 22 },
  { title: "The Empty Box and Zeroth Maria Vol. 2", author: "Eiji Mikage", price: 13.99, genre_id: 17, description: "The mystery of the Boxes deepens as Kazuki and Maria face a new Box — one that may destroy everything they know.", stock: 20 },
  { title: "Boogiepop and Others Vol. 1", author: "Kouhei Kadono", price: 12.99, genre_id: 17, description: "An entity that manifests as an alternate personality of a high school girl protects the world from supernatural threats.", stock: 20 },
  { title: "The Isolator Vol. 1", author: "Reki Kawahara", price: 13.99, genre_id: 17, description: "A trauma-scarred boy gains the power of absolute isolation — and is recruited to fight others given strange powers by alien spheres.", stock: 22 },

  // ── LIGHT NOVELS: Mystery (genre_id=18, cat_id=3) ──
  { title: "Hyouka Vol. 1", author: "Honobu Yonezawa", price: 12.99, genre_id: 18, description: "An energy-conserving high school boy joins the Classic Literature Club and gets drawn into solving an old school mystery.", stock: 25 },
  { title: "Decapitation: Kubikiri Cycle Vol. 1", author: "Nisio Isin", price: 12.99, genre_id: 18, description: "A mystery set on a private island where a young boy visits a genius with strange friends — and decapitation murders begin.", stock: 20 },
  { title: "Zaregoto Vol. 1 (The Kubikiri Cycle)", author: "Nisio Isin", price: 13.99, genre_id: 18, description: "A cynical young man accompanies a genius to an island villa and witnesses murders that defy explanation.", stock: 20 },
  { title: "Another Vol. 1", author: "Yukito Ayatsuji", price: 13.99, genre_id: 18, description: "A transfer student arrives at a school haunted by a curse that kills students and their families each year.", stock: 28 },

  // ── GRAPHIC NOVELS: Superhero (genre_id=19, cat_id=4) ──
  { title: "Batman: Year One", author: "Frank Miller", price: 16.99, genre_id: 19, description: "The definitive origin story of Batman — and the parallel story of Jim Gordon's first year as a Gotham cop.", stock: 35 },
  { title: "Batman: The Long Halloween", author: "Jeph Loeb", price: 19.99, genre_id: 19, description: "A serial killer strikes only on holidays as Batman, Jim Gordon, and Harvey Dent pursue the killer through Gotham's underworld.", stock: 30 },
  { title: "Batman: Dark Victory", author: "Jeph Loeb", price: 19.99, genre_id: 19, description: "The follow-up to The Long Halloween — the Hangman killer targets the GCPD while Dick Grayson becomes Robin.", stock: 28 },
  { title: "Superman: Red Son", author: "Mark Millar", price: 17.99, genre_id: 19, description: "What if Superman's rocket had landed in the Soviet Union instead of Kansas? A brilliant alternate-history reimagining.", stock: 28 },
  { title: "Spider-Man: Kraven's Last Hunt", author: "J.M. DeMatteis", price: 16.99, genre_id: 19, description: "The villain Kraven buries Spider-Man alive and takes his place — in one of the darkest Spider-Man stories ever told.", stock: 25 },
  { title: "Thor: The God Butcher", author: "Jason Aaron", price: 17.99, genre_id: 19, description: "A God Killer stalks the universe across time — and Thor must face him as a young warrior, a present-day Avenger, and a future All-Father.", stock: 28 },
  { title: "Thor: God of Thunder Vol. 2", author: "Jason Aaron", price: 17.99, genre_id: 19, description: "Gorr's devastating plan reaches its conclusion as three Thors unite for one final battle.", stock: 25 },
  { title: "Captain America: Man Out of Time", author: "Mark Waid", price: 16.99, genre_id: 19, description: "Steve Rogers wakes in the 21st century and struggles to find his place in a world that has moved on without him.", stock: 25 },
  { title: "Iron Man: Extremis", author: "Warren Ellis", price: 17.99, genre_id: 19, description: "Tony Stark faces a Super Soldier experiment gone wrong — and injects experimental technology into his own bloodstream.", stock: 28 },

  // ── GRAPHIC NOVELS: Horror (genre_id=20, cat_id=4) ──
  { title: "Locke & Key Vol. 3: Crown of Shadows", author: "Joe Hill", price: 17.99, genre_id: 20, description: "The Locke children discover the Crown of Shadows and the true nature of the darkness at Keyhouse.", stock: 22 },
  { title: "Locke & Key Vol. 4: Keys to the Kingdom", author: "Joe Hill", price: 17.99, genre_id: 20, description: "The children's enemies gather as new keys are discovered — and Tyler faces an impossible choice.", stock: 20 },
  { title: "Locke & Key Vol. 5: Clockworks", author: "Joe Hill", price: 17.99, genre_id: 20, description: "The origins of the keys and the demons of the Black Door are revealed in this penultimate volume.", stock: 20 },
  { title: "The Walking Dead Vol. 3: Safety Behind Bars", author: "Robert Kirkman", price: 14.99, genre_id: 20, description: "Rick's group arrives at a prison hoping it offers safety — but the living dead aren't the only danger inside.", stock: 28 },
  { title: "The Walking Dead Vol. 4: The Heart's Desire", author: "Robert Kirkman", price: 14.99, genre_id: 20, description: "Tensions escalate within the prison as Michonne arrives and the group must decide who to trust.", stock: 25 },
  { title: "Swamp Thing Vol. 1: Saga of the Swamp Thing", author: "Alan Moore", price: 16.99, genre_id: 20, description: "Alan Moore's revolutionary reimagining of Swamp Thing as not a man turned into a monster but a plant that thinks it's a man.", stock: 25 },

  // ── GRAPHIC NOVELS: Historical (genre_id=21, cat_id=4) ──
  { title: "March Vol. 1", author: "John Lewis", price: 14.99, genre_id: 21, description: "Civil rights icon John Lewis tells his story from his Alabama childhood through the historic March on Washington.", stock: 30 },
  { title: "March Vol. 2", author: "John Lewis", price: 14.99, genre_id: 21, description: "The civil rights movement reaches its peak as the Freedom Rides and sit-ins escalate in intensity.", stock: 28 },
  { title: "March Vol. 3", author: "John Lewis", price: 14.99, genre_id: 21, description: "The Selma-to-Montgomery marches and the passage of the Voting Rights Act — the triumphant conclusion.", stock: 25 },
  { title: "Corto Maltese: Under the Sign of Capricorn", author: "Hugo Pratt", price: 19.99, genre_id: 21, description: "The legendary sailor-adventurer Corto Maltese navigates intrigues across the Caribbean at the dawn of the 20th century.", stock: 18 },
  { title: "Palestine", author: "Joe Sacco", price: 17.99, genre_id: 21, description: "A graphic memoir of Joe Sacco's travels through the occupied territories in 1991–1992.", stock: 22 },
  { title: "Safe Area Goražde", author: "Joe Sacco", price: 18.99, genre_id: 21, description: "A documentary graphic novel about life in the Bosnian War — spent alongside the people of an isolated enclave.", stock: 20 },

  // ── GRAPHIC NOVELS: Sci-Fi (genre_id=22, cat_id=4) ──
  { title: "Saga Vol. 4", author: "Brian K. Vaughan", price: 14.99, genre_id: 22, description: "Marko and Alana's family faces new threats from the Robot Kingdom and a ruthless bounty hunter.", stock: 28 },
  { title: "Saga Vol. 5", author: "Brian K. Vaughan", price: 14.99, genre_id: 22, description: "The family is separated — and both halves face mortal danger in the far reaches of a universe at war.", stock: 25 },
  { title: "Saga Vol. 6", author: "Brian K. Vaughan", price: 14.99, genre_id: 22, description: "A devastating loss changes the family forever as the war between two worlds threatens to consume everything.", stock: 22 },
  { title: "Descender Vol. 1: Tin Stars", author: "Jeff Lemire", price: 14.99, genre_id: 22, description: "A young robot boy named TIM-21 is the key to the universe's greatest mystery — and hunted by all sides.", stock: 22 },
  { title: "Descender Vol. 2: Machine Moon", author: "Jeff Lemire", price: 14.99, genre_id: 22, description: "TIM-21's origins are revealed as the forces hunting him close in from every direction.", stock: 20 },
  { title: "East of West Vol. 1", author: "Jonathan Hickman", price: 15.99, genre_id: 22, description: "In an alternate America that never united, the Four Horsemen of the Apocalypse ride — and one of them refuses to play his role.", stock: 22 },
  { title: "Prophet Vol. 1: Remission", author: "Brandon Graham", price: 14.99, genre_id: 22, description: "A soldier wakes from cryogenic sleep on an alien Earth millions of years in the future.", stock: 18 },

  // ── GRAPHIC NOVELS: Fantasy (genre_id=23, cat_id=4) ──
  { title: "The Sandman Vol. 4: Season of Mists", author: "Neil Gaiman", price: 19.99, genre_id: 23, description: "Dream returns to Hell to free a former lover — only to find Lucifer has closed Hell and given him the key.", stock: 25 },
  { title: "The Sandman Vol. 5: A Game of You", author: "Neil Gaiman", price: 19.99, genre_id: 23, description: "Barbie travels to a dream country in crisis — with deadly consequences for those who accompany her.", stock: 22 },
  { title: "The Sandman Vol. 6: Fables and Reflections", author: "Neil Gaiman", price: 19.99, genre_id: 23, description: "A collection of stories spanning history — from ancient Babylon to revolutionary France to modern day.", stock: 22 },
  { title: "Bone Vol. 3: Eyes of the Storm", author: "Jeff Smith", price: 13.99, genre_id: 23, description: "The Bone cousins find themselves in the middle of an ancient war between the Lord of the Locusts and the dragons.", stock: 25 },
  { title: "Bone Vol. 4: The Dragonslayer", author: "Jeff Smith", price: 13.99, genre_id: 23, description: "Phoney Bone becomes a dragonslayer hero — but his scheme puts everyone in terrible danger.", stock: 22 },
  { title: "Fables Vol. 3: Storybook Love", author: "Bill Willingham", price: 14.99, genre_id: 23, description: "Fables characters are enchanted to fall in love with each other in a fable that turns dangerously real.", stock: 20 },
  { title: "Fables Vol. 4: March of the Wooden Soldiers", author: "Bill Willingham", price: 14.99, genre_id: 23, description: "An army of wooden soldiers invades Fabletown from the Homelands in the most violent Fables arc yet.", stock: 18 },

  // ── GRAPHIC NOVELS: Crime (genre_id=24, cat_id=4) ──
  { title: "Criminal Vol. 2: Lawless", author: "Ed Brubaker", price: 15.99, genre_id: 24, description: "Tracy Lawless returns from the military to find his brother murdered — and he'll do whatever it takes to find the killer.", stock: 22 },
  { title: "Criminal Vol. 3: The Dead and the Dying", author: "Ed Brubaker", price: 15.99, genre_id: 24, description: "Three interconnected crime stories from 1972 — a fighter, a dealer, and a hitwoman all tied to a fatal night.", stock: 20 },
  { title: "Queen & Country Vol. 1: Operation: Broken Ground", author: "Greg Rucka", price: 14.99, genre_id: 24, description: "British intelligence operative Tara Chace is assigned to take out a Serbian sniper — a mission with devastating consequences.", stock: 18 },
  { title: "100 Bullets Vol. 2: Split Second Chance", author: "Brian Azzarello", price: 15.99, genre_id: 24, description: "Agent Graves gives another wronged person a briefcase with irrefutable proof and 100 untraceable bullets.", stock: 20 },
  { title: "100 Bullets Vol. 3: Hang Up on the Hang Low", author: "Brian Azzarello", price: 15.99, genre_id: 24, description: "A young man in the ghetto gets a chance at revenge — and more pieces of the Trust conspiracy fall into place.", stock: 18 },
  { title: "Stray Bullets Vol. 1: Innocence of Nihilism", author: "David Lapham", price: 16.99, genre_id: 24, description: "An anthology of interconnected crime stories spanning decades — told from the perspectives of ordinary people caught in violence.", stock: 18 },
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
      [b.title, b.author]
    );
    if (existing.length > 0) { skipped++; continue; }

    // Derive category_id from genre_id ranges
    let cat_id;
    if (b.genre_id >= 1  && b.genre_id <= 5)  cat_id = 1; // Books
    else if (b.genre_id >= 6  && b.genre_id <= 13) cat_id = 2; // Manga
    else if (b.genre_id >= 14 && b.genre_id <= 18) cat_id = 3; // Light Novels
    else cat_id = 4; // Graphic Novels (19-24)

    await conn.query(
      `INSERT INTO products (title, author, price, genre_id, category_id, description, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
      [b.title, b.author, b.price, b.genre_id, cat_id, b.description, b.stock ?? 25]
    );
    inserted++;
  }

  const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM products');
  console.log(`✅ Done! Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  console.log(`📚 Total products in database: ${total}`);
  await conn.end();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
