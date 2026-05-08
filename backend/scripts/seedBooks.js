// scripts/seedBooks.js — seeds 450+ additional books
// Run: node scripts/seedBooks.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

// cover_color palettes per category
const bookColors   = ['#1a1a2e','#16213e','#0f3460','#1b1b2f','#2c2c54','#2d132c','#1c3334','#1a1a1a','#0d0d0d','#252525'];
const mangaColors  = ['#1a0a0a','#0a1a0a','#0a0a1a','#1a0a1a','#1a1a0a','#0f0a1a','#1a0f0a','#0a1a1a','#150a1a','#1a150a'];
const lnColors     = ['#0d1117','#161b22','#21262d','#1c2128','#0d1117','#1a1f26','#13171e','#191f28','#0e1319','#1d2229'];
const gnColors     = ['#0a0a0f','#0f0a0a','#0a0f0a','#0a0a0f','#130a0a','#0a130a','#0f0f0a','#0a0f13','#130f0a','#0a0a13'];

function rc(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function price(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function rating(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }

const books = [
  // ── BOOKS / Fantasy (cat 1, genre 1) ─────────────────────────
  ['The Final Empire','Brandon Sanderson',price(18,30),rc(bookColors),1,1,'The Lord Ruler has reigned for a thousand years. Ash falls from the sky. Mists dominate the night. Skaa are slaves. But Kelsier, a half-skaa thief, survived the Pits of Hathsin and has a plan.',rating(4.3,4.7)],
  ['The Well of Ascension','Brandon Sanderson',price(18,30),rc(bookColors),1,1,'The impossible has happened. Kelsier, the misting who could pierce the mists, is dead, but not before he changed the course of history.',rating(4.2,4.6)],
  ['The Hero of Ages','Brandon Sanderson',price(18,30),rc(bookColors),1,1,'Who is the Hero of Ages? To end the Final Empire and restore freedom, Vin killed the Lord Ruler. But as a result, the Deepness—the lethal form of the ubiquitous mists—is back.',rating(4.4,4.8)],
  ['The Way of Kings','Brandon Sanderson',price(22,35),rc(bookColors),1,1,'Speak again the ancient oaths. Life before death. Strength before weakness. Journey before Destination. A storm of unprecedented power is coming—and a world-shaking secret lies hidden within the storm.',rating(4.5,4.9)],
  ['Words of Radiance','Brandon Sanderson',price(22,35),rc(bookColors),1,1,'Return to a world of stunning power and surpassing peril in the second volume of the Stormlight Archive from Brandon Sanderson.',rating(4.6,4.9)],
  ['Oathbringer','Brandon Sanderson',price(22,35),rc(bookColors),1,1,'Dalinar Kholin\'s Alethi armies won a fleeting victory at a terrible cost: The enemy Parshendi summoned the Everstorm, which now sweeps the world with destruction.',rating(4.4,4.8)],
  ['Rhythm of War','Brandon Sanderson',price(22,35),rc(bookColors),1,1,'After forming a coalition of human resistance against the enemy invasion, Dalinar Kholin and his Knights Radiant have spent a year fighting a protracted, brutal war.',rating(4.4,4.8)],
  ['Elantris','Brandon Sanderson',price(15,22),rc(bookColors),1,1,'Elantris was the capital of Arelon: gigantic, beautiful, literally radiant, filled with benevolent beings who used their powerful magical abilities for the benefit of all.',rating(3.9,4.3)],
  ['Warbreaker','Brandon Sanderson',price(15,22),rc(bookColors),1,1,'Warbreaker is the story of two sisters, who happen to be princesses, the God King one of them has to marry, the lesser god who doesn\'t like his job, and the immortal who\s still trying to undo the mistakes he made hundreds of years ago.',rating(4.0,4.4)],
  ['The Eye of the World','Robert Jordan',price(18,28),rc(bookColors),1,1,'The Wheel of Time turns and Ages come and go, leaving memories that become legend. Legend fades to myth, and even myth is long forgotten when the Age that gave it birth returns again.',rating(4.1,4.5)],
  ['The Great Hunt','Robert Jordan',price(18,28),rc(bookColors),1,1,'The Forsaken are loose, the Horn of Valere has been found and lost, and so it begins: a hunt across sun-drenched plains and frozen lands.',rating(4.1,4.5)],
  ['The Dragon Reborn','Robert Jordan',price(18,28),rc(bookColors),1,1,'The Dragon Reborn—the leader long prophesied who will save the world, but in the saving destroy it—flees from his friends and from himself.',rating(4.2,4.6)],
  ['The Name of the Wind','Patrick Rothfuss',price(16,24),rc(bookColors),1,1,'Told in Kvothe\'s own voice, this is the tale of the magically gifted young man who grows to be the most notorious wizard his world has ever seen.',rating(4.4,4.8)],
  ['The Wise Man\'s Fear','Patrick Rothfuss',price(18,28),rc(bookColors),1,1,'In The Wise Man\'s Fear, Kvothe takes a rare opportunity to learn from a legendary Adem mercenary. He searches for answers, trying to uncover the truth about the mysterious Amyr.',rating(4.3,4.7)],
  ['Assassin\'s Apprentice','Robin Hobb',price(14,20),rc(bookColors),1,1,'In a far-off land where members of the royal family are named for the virtues they embody, one young boy will become a royal assassin.',rating(4.1,4.5)],
  ['Royal Assassin','Robin Hobb',price(14,20),rc(bookColors),1,1,'Fitz has survived his first hazardous mission as king\'s assassin, but barely. Now he is lost to the court life that grooms him for further loyalties.',rating(4.2,4.6)],
  ['The Blade Itself','Joe Abercrombie',price(15,22),rc(bookColors),1,1,'Logen Ninefingers, infamous barbarian, has finally run out of luck. Driven to the edge of the world by an enemy he cannot fight, he must journey back to a land he hoped to never see again.',rating(4.2,4.6)],
  ['Before They Are Hanged','Joe Abercrombie',price(15,22),rc(bookColors),1,1,'Superior Glokta has a problem. How do you defend a city surrounded by enemies and riddled with traitors, when your allies can by no means be trusted, and your predecessor vanished without a trace?',rating(4.2,4.6)],
  ['Last Argument of Kings','Joe Abercrombie',price(15,22),rc(bookColors),1,1,'The end is coming. Logen Ninefingers might only have one more fight in him, but it\'s going to be a big one. Battle rages across the North, the king of the Northmen still stands firm.',rating(4.2,4.6)],
  ['The Colour of Magic','Terry Pratchett',price(12,18),rc(bookColors),1,1,'The first Discworld novel. It starts in Ankh-Morpork—the biggest city on Discworld—which is sort of like London crossed with ancient Rome and a dash of medieval fantasy.',rating(3.9,4.3)],
  ['Guards! Guards!','Terry Pratchett',price(12,18),rc(bookColors),1,1,'There\'s a dragon in Ankh-Morpork—a real one for the first time in centuries. The Patrician is not pleased. The City Watch is definitely not pleased.',rating(4.3,4.7)],
  ['Small Gods','Terry Pratchett',price(12,18),rc(bookColors),1,1,'In the beginning was the Word. And the Word was: "Hey, you!" This is the Discworld, after all, and religion is a complicated matter.',rating(4.4,4.8)],
  ['The Fifth Season','N.K. Jemisin',price(14,20),rc(bookColors),1,1,'A season of endings has begun. It starts with the great red rift across the heart of the world\'s only continent, shattering a city to rubble.',rating(4.3,4.7)],
  ['The Obelisk Gate','N.K. Jemisin',price(14,20),rc(bookColors),1,1,'The season of endings grows darker as civilization fades into the long cold night. Essun—once Damaya, once Syenite, now herself—has found shelter in the stone-enclosed community of Castrima.',rating(4.3,4.7)],
  ['The Stone Sky','N.K. Jemisin',price(14,20),rc(bookColors),1,1,'The Moon will soon return. Whether this heralds the death of the world or its salvation is up to a young woman who was once a slave, a woman broken by terrible losses, and a woman who has never trusted the world to give her more than its worst.',rating(4.4,4.8)],
  ['A Wizard of Earthsea','Ursula K. Le Guin',price(12,18),rc(bookColors),1,1,'Originally published in 1968, Ursula K. Le Guin\'s A Wizard of Earthsea marks the first of the six books set in the archipelago known as Earthsea.',rating(4.0,4.4)],
  ['The Tombs of Atuan','Ursula K. Le Guin',price(12,18),rc(bookColors),1,1,'In this second book of the Earthsea cycle, Tenar is chosen as high priestess to the ancient and nameless Powers of the Earth.',rating(4.0,4.4)],
  ['American Gods','Neil Gaiman',price(14,20),rc(bookColors),1,1,'A storm is coming, warns Mr. Wednesday. But Shadow has done his time, and on the eve of his release from prison, he gets word that his wife has been killed in an accident.',rating(4.0,4.4)],
  ['Neverwhere','Neil Gaiman',price(13,19),rc(bookColors),1,1,'Under the streets of London there is a place most people could never even dream of. A city of monsters and saints, murderers and angels, knights in armour and pale girls in black velvet.',rating(4.1,4.5)],
  ['The Lies of Locke Lamora','Scott Lynch',price(15,22),rc(bookColors),1,1,'They say that the Thorn of Camorr can beat anyone in a fight. They say he steals from the rich and gives to the poor. They say he\'s part man, part myth, and mostly street-corner rumor.',rating(4.3,4.7)],
  ['Red Seas Under Red Skies','Scott Lynch',price(15,22),rc(bookColors),1,1,'Escaping from the burning city of Camorr, Locke Lamora and his partner Jean Tannen are on the run with nothing but the clothes on their backs.',rating(4.1,4.5)],
  ['Gardens of the Moon','Steven Erikson',price(16,24),rc(bookColors),1,1,'The vast, sprawling Malazan Empire simmers with discontent, bled dry by interminable warfare, bitter infighting and bloody confrontations with ancient, near-immortal beings and insane gods.',rating(3.9,4.3)],
  ['The Goblin Emperor','Katherine Addison',price(14,20),rc(bookColors),1,1,'The youngest, half-goblin son of the Emperor has lived his entire life in exile, alone, at the border of his father\'s Empire. Then, unexpectedly, the Emperor and his three sons die.',rating(4.2,4.6)],
  ['Jonathan Strange & Mr Norrell','Susanna Clarke',price(16,24),rc(bookColors),1,1,'Two magicians shall appear in England. The first shall fear me; the second shall long to surpass me. Together they shall remake the magic of England.',rating(4.0,4.4)],
  ['The Priory of the Orange Tree','Samantha Shannon',price(18,28),rc(bookColors),1,1,'A world divided. A queendom without an heir. An ancient enemy awakens. The House of Berethnet has ruled Inys for a thousand years.',rating(4.0,4.4)],
  ['Black Sun','Rebecca Roanhorse',price(15,22),rc(bookColors),1,1,'In the holy city of Tova, the winter solstice is usually a time for celebration and renewal, but this year it portends a solar eclipse heralding an age of darkness.',rating(4.0,4.4)],
  ['The Poppy War','R.F. Kuang',price(15,22),rc(bookColors),1,1,'A brilliantly imaginative talent makes her exciting debut with this epic historical military fantasy, inspired by the bloody history of China\'s twentieth century.',rating(4.1,4.5)],
  ['The Dragon Republic','R.F. Kuang',price(15,22),rc(bookColors),1,1,'In the aftermath of the Third Poppy War, shaman and warrior Rin is on the run: haunted by the atrocity she committed to end the war, addicted to opium.',rating(4.1,4.5)],

  // ── BOOKS / Sci-Fi (cat 1, genre 2) ──────────────────────────
  ['Foundation','Isaac Asimov',price(14,20),rc(bookColors),1,2,'For twelve thousand years the Galactic Empire has ruled supreme. Now it is dying. But only Hari Seldon, creator of the revolutionary science of psychohistory, can see into the future.',rating(4.2,4.6)],
  ['Foundation and Empire','Isaac Asimov',price(14,20),rc(bookColors),1,2,'Although the Foundation has managed to survive by converting planets to its religion and enlisting their support, it now faces two far greater dangers.',rating(4.1,4.5)],
  ['Second Foundation','Isaac Asimov',price(14,20),rc(bookColors),1,2,'With the First Foundation in ruins, the Mule begins his search for the Second Foundation—the only force in the galaxy that can oppose him.',rating(4.2,4.6)],
  ['Dune','Frank Herbert',price(16,24),rc(bookColors),1,2,'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only valuable substance in the universe is produced.',rating(4.3,4.7)],
  ['Dune Messiah','Frank Herbert',price(16,24),rc(bookColors),1,2,'Twelve years after his victory over House Harkonnen, Paul Atreides has become the most powerful emperor in the history of mankind.',rating(3.9,4.3)],
  ['Children of Dune','Frank Herbert',price(16,24),rc(bookColors),1,2,'Leto and Ghanima Atreides are the twin heirs of Paul Muad\'Dib and the Lady Chani. The twins have survived innumerable threats since they were born.',rating(3.9,4.3)],
  ['2001: A Space Odyssey','Arthur C. Clarke',price(13,19),rc(bookColors),1,2,'When an enigmatic monolith is found buried on the moon, scientists are amazed to discover it\'s at least three million years old. Soon a manned spacecraft, Discovery, is on its way to Saturn.',rating(4.0,4.4)],
  ['Rendezvous with Rama','Arthur C. Clarke',price(13,19),rc(bookColors),1,2,'At first, only a few things are known about the celestial object that astronomers dub Rama. It is huge, weighing more than ten trillion tons. And it is hurtling through the solar system at an inconceivable speed.',rating(4.1,4.5)],
  ['Do Androids Dream of Electric Sheep?','Philip K. Dick',price(12,18),rc(bookColors),1,2,'It was January 2021, and Rick Deckard had a licence to kill. Somewhere among the hordes of humans out in the streets, lurked several rogue androids.',rating(4.0,4.4)],
  ['The Man in the High Castle','Philip K. Dick',price(12,18),rc(bookColors),1,2,'It\'s America in 1962. Slavery is legal once again. The few Jews who still survive hide under assumed names. In San Francisco, the I Ching is as common as the Yellow Pages.',rating(3.9,4.3)],
  ['Ubik','Philip K. Dick',price(12,18),rc(bookColors),1,2,'Glen Runciter runs a lucrative business—deploying his teams of anti-psionics to corporate clients who need protection from psionic spies.',rating(4.0,4.4)],
  ['Kindred','Octavia Butler',price(13,19),rc(bookColors),1,2,'The first science fiction novel by acclaimed author Octavia Butler, Kindred has become a cornerstone of black American literature.',rating(4.3,4.7)],
  ['Parable of the Sower','Octavia Butler',price(13,19),rc(bookColors),1,2,'When climate change and economic failures cause American society to collapse, a young Black woman named Lauren Olamina living in the rubble of Los Angeles has a vision.',rating(4.3,4.7)],
  ['The Left Hand of Darkness','Ursula K. Le Guin',price(12,18),rc(bookColors),1,2,'A lone human ambassador is sent to the icebound planet of Winter, also known as Gethen, to convince its people to join the Ekumen.',rating(4.1,4.5)],
  ['The Dispossessed','Ursula K. Le Guin',price(12,18),rc(bookColors),1,2,'Shevek, a brilliant physicist, decides to take action. He will travel to Urras—the rich, civilized mother planet—to challenge the complex structures of life and living.',rating(4.2,4.6)],
  ['Snow Crash','Neal Stephenson',price(15,22),rc(bookColors),1,2,'In reality, Hiro Protagonist delivers pizza for Uncle Enzo\'s CosoNostra Pizza Inc., but in the Metaverse he\'s a warrior prince.',rating(4.0,4.4)],
  ['Neuromancer','William Gibson',price(13,19),rc(bookColors),1,2,'The sky above the port was the color of television, tuned to a dead channel. Case was the sharpest data-thief in the matrix—until he double-crossed the wrong people.',rating(3.9,4.3)],
  ['Ender\'s Game','Orson Scott Card',price(14,20),rc(bookColors),1,2,'In order to develop a secure defense against a hostile alien race\'s next attack, government agencies breed child geniuses and train them as soldiers.',rating(4.3,4.7)],
  ['Speaker for the Dead','Orson Scott Card',price(14,20),rc(bookColors),1,2,'Three thousand years after the events of Ender\'s Game, Andrew Wiggin—known by his Speakers as Ender—travels the galaxy as a Speaker for the Dead.',rating(4.2,4.6)],
  ['The Martian Chronicles','Ray Bradbury',price(12,18),rc(bookColors),1,2,'Ray Bradbury\'s the Martian Chronicles tells the story of humanity\'s repeated attempts to colonize the red planet, and the way the invaders affect and are affected by the strange, beautiful, terrible Martian civilization.',rating(4.0,4.4)],
  ['Fahrenheit 451','Ray Bradbury',price(12,18),rc(bookColors),1,2,'Guy Montag is a fireman. In his world, where television rules and literature is on the brink of extinction, firemen start fires rather than put them out.',rating(3.9,4.3)],
  ['The Hitchhiker\'s Guide to the Galaxy','Douglas Adams',price(12,18),rc(bookColors),1,2,'Seconds before Earth is demolished to make way for a hyperspace bypass, Arthur Dent is plucked off the planet by his friend Ford Prefect, a researcher for the revised edition of the Hitchhiker\'s Guide to the Galaxy.',rating(4.3,4.7)],
  ['The Restaurant at the End of the Universe','Douglas Adams',price(12,18),rc(bookColors),1,2,'Facing annihilation at the hands of the warlike Vogons, is a time for bold action. Or, failing that, a nice cup of tea.',rating(4.1,4.5)],
  ['Old Man\'s War','John Scalzi',price(13,19),rc(bookColors),1,2,'John Perry did two things on his 75th birthday. First he visited his wife\'s grave. Then he joined the army.',rating(4.1,4.5)],
  ['Red Rising','Pierce Brown',price(14,20),rc(bookColors),1,2,'Darrow is a Red, a member of the lowest caste in the color-coded society of the future. Like his fellow Reds, he digs all day, believing that he and his people are making the surface of Mars livable for future generations.',rating(4.3,4.7)],
  ['Golden Son','Pierce Brown',price(14,20),rc(bookColors),1,2,'With shades of The Hunger Games, Ender\'s Game, and Game of Thrones, an unforgettable hero embarks on a journey that will change worlds in this stunning sequel.',rating(4.4,4.8)],
  ['Morning Star','Pierce Brown',price(14,20),rc(bookColors),1,2,'Darrow once lived among the lowest caste in the color-coded society of the future. Forced into the loftiest ranks of society, he climbed up only to bring the fake hierarchy crashing down.',rating(4.5,4.9)],
  ['The Long Way to a Small, Angry Planet','Becky Chambers',price(13,19),rc(bookColors),1,2,'Follow a crew of unconventional characters as they embark on a journey through the galaxy.',rating(4.1,4.5)],
  ['A Memory Called Empire','Arkady Martine',price(14,20),rc(bookColors),1,2,'Ambassador Mahit Dzmare arrives in the center of the multi-system Teixcalaanli Empire only to discover that her predecessor, the previous ambassador from their small but fiercely independent mining Station, has died.',rating(4.1,4.5)],

  // ── BOOKS / Literary Fiction (cat 1, genre 3) ─────────────────
  ['Crime and Punishment','Fyodor Dostoevsky',price(11,16),rc(bookColors),1,3,'Raskolnikov, a destitute and desperate former student, wanders through the slums of St. Petersburg and commits a random murder without remorse or regret.',rating(4.2,4.6)],
  ['The Brothers Karamazov','Fyodor Dostoevsky',price(12,18),rc(bookColors),1,3,'The Brothers Karamazov is a murder mystery, a courtroom drama, and an exploration of erotic rivalry in a series of triangular love affairs.',rating(4.4,4.8)],
  ['The Idiot','Fyodor Dostoevsky',price(11,16),rc(bookColors),1,3,'Prince Lev Myshkin—a young man who has spent years in a Swiss sanatorium due to his severe epilepsy—arrives in St. Petersburg. His naivete and innocence earn him the nickname "the idiot."',rating(4.1,4.5)],
  ['War and Peace','Leo Tolstoy',price(14,20),rc(bookColors),1,3,'Epic in scale, War and Peace delineates in graphic detail events leading up to Napoleon\'s invasion of Russia, and the impact of the Napoleonic era on Tsarist society.',rating(4.3,4.7)],
  ['Anna Karenina','Leo Tolstoy',price(13,19),rc(bookColors),1,3,'Acclaimed by many as the world\'s greatest novel, Anna Karenina provides a complete tableau of contemporary life in Russia and of humanity in general.',rating(4.2,4.6)],
  ['The Trial','Franz Kafka',price(11,16),rc(bookColors),1,3,'Someone must have slandered Josef K., for one morning, without having done anything wrong, he was arrested.',rating(4.0,4.4)],
  ['The Metamorphosis','Franz Kafka',price(10,14),rc(bookColors),1,3,'One morning, Gregor Samsa woke from troubled dreams and found himself transformed in his bed into a horrible vermin.',rating(4.0,4.4)],
  ['The Stranger','Albert Camus',price(10,14),rc(bookColors),1,3,'Through the story of an ordinary man unwittingly drawn into a senseless murder on an Algerian beach, Camus explored what he termed "the nakedness of man faced with the absurd."',rating(4.0,4.4)],
  ['The Plague','Albert Camus',price(11,16),rc(bookColors),1,3,'The Plague is a fascinating novel about a bubonic plague epidemic in Oran, Algeria, during the 1940s.',rating(4.1,4.5)],
  ['Beloved','Toni Morrison',price(13,19),rc(bookColors),1,3,'Sethe was born a slave and escaped to Ohio, but eighteen years later she is still not free. She has too many memories of Sweet Home, the beautiful farm where so many hideous things happened.',rating(4.2,4.6)],
  ['Song of Solomon','Toni Morrison',price(12,18),rc(bookColors),1,3,'A powerful story of self-discovery, Morrison traces the voyage of Macon Dead—from his birthplace in the deep South to a Northern ghetto, from his name to his identity.',rating(4.1,4.5)],
  ['One Hundred Years of Solitude','Gabriel García Márquez',price(13,19),rc(bookColors),1,3,'The brilliant, bestselling, landmark novel that tells the story of the Buendía family, and chronicles the irreconcilable conflict between the desire for solitude and the need for love.',rating(4.2,4.6)],
  ['Love in the Time of Cholera','Gabriel García Márquez',price(13,19),rc(bookColors),1,3,'In their youth, Florentino Ariza and Fermina Daza fall passionately in love. When Fermina eventually chooses to marry a wealthy, well-born doctor, Florentino is devastated.',rating(4.0,4.4)],
  ['Norwegian Wood','Haruki Murakami',price(13,19),rc(bookColors),1,3,'Toru Watanabe looks back to the Tokyo of the 1960s and his memories of Naoko, the beautiful and fragile young woman with whom he shared a past.',rating(4.1,4.5)],
  ['Kafka on the Shore','Haruki Murakami',price(14,20),rc(bookColors),1,3,'Kafka on the Shore is powered by two remarkable characters: a teenage boy, Kafka Tamura, who runs away from home either to escape a gruesome oedipal prophecy or to search for his long-lost mother and sister.',rating(4.1,4.5)],
  ['The Wind-Up Bird Chronicle','Haruki Murakami',price(14,20),rc(bookColors),1,3,'Japan\'s most highly regarded novelist now vaults into the first ranks of international fiction with this heroic, fantastic tale of a man\'s search for his missing wife.',rating(4.1,4.5)],
  ['The Master and Margarita','Mikhail Bulgakov',price(12,18),rc(bookColors),1,3,'The devil arrives in 1930s Moscow, accompanied by a retinue that includes a beautiful naked witch and an enormous talking black cat with a fondness for chess and vodka.',rating(4.4,4.8)],
  ['In the Penal Colony','Franz Kafka',price(10,14),rc(bookColors),1,3,'A collection of Kafka\'s most essential short fiction, including The Metamorphosis and In the Penal Colony.',rating(3.9,4.3)],
  ['The Road','Cormac McCarthy',price(12,18),rc(bookColors),1,3,'A father and his son walk alone through burned America. Nothing moves in the ravaged landscape save the ash on the wind.',rating(4.2,4.6)],
  ['Blood Meridian','Cormac McCarthy',price(12,18),rc(bookColors),1,3,'An epic novel of the violence and depravity that attended America\'s westward expansion, Blood Meridian is an apocalyptic vision of an 1850s borderland as Texas fights to take land from Mexico.',rating(4.3,4.7)],
  ['Invisible Man','Ralph Ellison',price(12,18),rc(bookColors),1,3,'A masterpiece of American fiction, this is the story of a man who describes himself as invisible—a Black man in 1950s America.',rating(4.2,4.6)],
  ['Siddhartha','Hermann Hesse',price(10,14),rc(bookColors),1,3,'In the novel, Siddhartha, a young man, leaves his family for a contemplative life, then, restless, discards it for one of the flesh.',rating(4.2,4.6)],
  ['Steppenwolf','Hermann Hesse',price(11,16),rc(bookColors),1,3,'Harry Haller is a sad and lonely figure, a reclusive intellectual for whom life holds no joy. He struggles to reconcile a bourgeois side with the wild, instinctual "steppenwolf" within.',rating(4.0,4.4)],

  // ── BOOKS / Horror (cat 1, genre 4) ───────────────────────────
  ['The Shining','Stephen King',price(14,20),rc(bookColors),1,4,'Jack Torrance\'s new job at the Overlook Hotel is the perfect chance for a fresh start. As the off-season caretaker at the atmospheric old hotel, he\'ll have plenty of time to spend reconnecting with his family and working on his writing.',rating(4.3,4.7)],
  ['It','Stephen King',price(16,24),rc(bookColors),1,4,'Welcome to Derry, Maine. It\'s a small city, a nice place to raise a family. But every twenty-seven years, or so, a terrible evil awakens.',rating(4.3,4.7)],
  ['Pet Sematary','Stephen King',price(13,19),rc(bookColors),1,4,'The house looked right, felt right to Louis Creed. Rambling, old, unsmart—but with acres of yard, a lively stream, a homey, settled feeling. And then there was the barn.',rating(4.2,4.6)],
  ['Misery','Stephen King',price(13,19),rc(bookColors),1,4,'Paul Sheldon. He\'s a bestselling novelist who has finally met his number one fan. Her name is Annie Wilkes and she is more than a rabid reader—she is Paul\'s nurse, jailer, judge, and, if he doesn\'t say the right words, his executioner.',rating(4.3,4.7)],
  ['The Haunting of Hill House','Shirley Jackson',price(11,16),rc(bookColors),1,4,'An excellent ghost story involving a group of paranormal investigators who spend the summer in the haunted mansion Hill House.',rating(4.0,4.4)],
  ['We Have Always Lived in the Castle','Shirley Jackson',price(10,14),rc(bookColors),1,4,'Taking readers deep into a labyrinth of dark neurosis, We Have Always Lived in the Castle is a deliciously unsettling novel about a perverse, isolated, and possibly murderous family.',rating(4.2,4.6)],
  ['Dracula','Bram Stoker',price(10,14),rc(bookColors),1,4,'When Jonathan Harker visits Transylvania to help Count Dracula with a real estate transaction, he realizes that the count is a vampire and that he is Dracula\'s prisoner.',rating(4.0,4.4)],
  ['Frankenstein','Mary Shelley',price(10,14),rc(bookColors),1,4,'Mary Shelley\'s timeless gothic novel presents the epic battle between man and monster at its greatest literary pitch.',rating(3.9,4.3)],
  ['Mexican Gothic','Silvia Moreno-Garcia',price(13,19),rc(bookColors),1,4,'After receiving a frantic letter from her newly-wed cousin begging for someone to save her from a mysterious doom, Noemí Taboada heads to High Place.',rating(4.0,4.4)],
  ['The Troop','Nick Cutter',price(13,19),rc(bookColors),1,4,'Once a year, scoutmaster Tim Riggs leads a troop of boys to a small island off the coast of Prince Edward Island for a week of camping.',rating(3.9,4.3)],
  ['Bird Box','Josh Malerman',price(12,18),rc(bookColors),1,4,'Written with the narrative tension of No Country for Old Men and the exquisite terror of The Shining, this bestselling debut novel comes with one postulation: if you see it, you die.',rating(3.9,4.3)],
  ['The Silent Patient','Alex Michaelides',price(13,19),rc(bookColors),1,5,'Alicia Berenson\'s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London\'s most desirable areas.',rating(4.1,4.5)],
  ['Gone Girl','Gillian Flynn',price(12,18),rc(bookColors),1,5,'On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne\'s fifth wedding anniversary.',rating(4.0,4.4)],
  ['The Girl with the Dragon Tattoo','Stieg Larsson',price(14,20),rc(bookColors),1,5,'Harriet Vanger, a scion of one of Sweden\'s wealthiest families disappeared over forty years ago. All these years later, her aged uncle continues to seek the truth.',rating(4.2,4.6)],
  ['Gone Girl','Gillian Flynn',price(12,18),rc(bookColors),1,5,'On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne\'s fifth wedding anniversary.',rating(4.0,4.4)],
  ['The Da Vinci Code','Dan Brown',price(12,18),rc(bookColors),1,5,'While in Paris on business, Harvard symbologist Robert Langdon receives an urgent late-night phone call: the elderly curator of the Louvre has been murdered inside the museum.',rating(3.6,4.0)],
  ['The Pelican Brief','John Grisham',price(12,18),rc(bookColors),1,5,'Two Supreme Court Justices have been assassinated. There is no apparent connection between the two men—one was liberal, one conservative.',rating(3.9,4.3)],
  ['The Bourne Identity','Robert Ludlum',price(12,18),rc(bookColors),1,5,'He was found floating in the Mediterranean, his body riddled with bullets. With a miniature projector surgically implanted in his hip.',rating(4.0,4.4)],

  // ── MANGA / Action (cat 2, genre 6) ───────────────────────────
  ['Berserk Vol. 1','Kentaro Miura',price(13,19),rc(mangaColors),2,6,'Guts, the powerful warrior known as the Black Swordsman, carries a sword as massive as he is and cuts a bloody swath through a fantasy world of monsters and demons.',rating(4.6,4.9)],
  ['Berserk Vol. 2','Kentaro Miura',price(13,19),rc(mangaColors),2,6,'The Band of the Hawk is introduced, and we see the legendary mercenary group that Guts once belonged to before his fateful encounter.',rating(4.6,4.9)],
  ['Vinland Saga Vol. 1','Makoto Yukimura',price(16,24),rc(mangaColors),2,6,'Young Thorfinn grew up listening to the tales of old sailors that had travelled to a mysterious and wonderful land called Vinland.',rating(4.5,4.9)],
  ['Vinland Saga Vol. 2','Makoto Yukimura',price(16,24),rc(mangaColors),2,6,'Thorfinn continues his quest for vengeance against the man who killed his father, serving under him as a mercenary.',rating(4.5,4.9)],
  ['Kingdom Vol. 1','Yasuhisa Hara',price(12,18),rc(mangaColors),2,6,'Set in the Warring States period of ancient China, Kingdom follows the orphan Xin as he dreams of becoming a Great General.',rating(4.5,4.9)],
  ['Vagabond Vol. 1','Takehiko Inoue',price(15,22),rc(mangaColors),2,6,'Miyamoto Musashi is the strongest man in Japan in this manga, created by the author of Slam Dunk. Based on the real historical swordsman.',rating(4.5,4.9)],
  ['Vagabond Vol. 2','Takehiko Inoue',price(15,22),rc(mangaColors),2,6,'Musashi continues his journey to become the world\'s greatest swordsman, facing increasingly powerful opponents.',rating(4.5,4.9)],
  ['Fullmetal Alchemist Vol. 1','Hiromu Arakawa',price(11,17),rc(mangaColors),2,6,'In an alchemical ritual gone wrong, Edward Elric lost his arm and his leg, and his brother Alphonse became nothing but a soul in a suit of armor.',rating(4.6,4.9)],
  ['Fullmetal Alchemist Vol. 2','Hiromu Arakawa',price(11,17),rc(mangaColors),2,6,'Edward and Alphonse continue their search for the Philosopher\'s Stone, unraveling dark secrets about alchemy and their world.',rating(4.6,4.9)],
  ['Attack on Titan Vol. 1','Hajime Isayama',price(11,17),rc(mangaColors),2,6,'In this post-apocalyptic sci-fi story, humanity has been devastated by the bizarre, giant humanoids known as the Titans.',rating(4.4,4.8)],
  ['Attack on Titan Vol. 2','Hajime Isayama',price(11,17),rc(mangaColors),2,6,'Eren joins the military to fight the Titans, but a shocking transformation changes everything.',rating(4.4,4.8)],
  ['Chainsaw Man Vol. 1','Tatsuki Fujimoto',price(11,17),rc(mangaColors),2,6,'Denji was a small-time devil hunter just trying to survive, with his pet devil-dog Pochita. Then suddenly he is killed and turned into the Chainsaw Man.',rating(4.5,4.9)],
  ['Chainsaw Man Vol. 2','Tatsuki Fujimoto',price(11,17),rc(mangaColors),2,6,'Denji continues working for the devil hunter organization, facing increasingly powerful devil enemies.',rating(4.4,4.8)],
  ['Jujutsu Kaisen Vol. 1','Gege Akutami',price(11,17),rc(mangaColors),2,6,'Yuji Itadori is a boy with tremendous physical strength, though he lives a completely ordinary high school life. One day, he finds a finger of the Demon King Ryomen Sukuna.',rating(4.4,4.8)],
  ['Hunter x Hunter Vol. 1','Yoshihiro Togashi',price(11,17),rc(mangaColors),2,6,'Determined to become a Hunter—a member of humanity\'s elite—12-year-old Gon Freecss wants to follow in his missing father\'s footsteps.',rating(4.5,4.9)],
  ['Naruto Vol. 1','Masashi Kishimoto',price(10,15),rc(mangaColors),2,6,'Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition and dreams of becoming the leader of his village.',rating(4.3,4.7)],
  ['Bleach Vol. 1','Tite Kubo',price(10,15),rc(mangaColors),2,6,'Ichigo Kurosaki has always been able to see ghosts, but this ability doesn\'t change his life nearly as much as his close encounter with Rukia Kuchiki.',rating(4.2,4.6)],
  ['Dragon Ball Vol. 1','Akira Toriyama',price(10,15),rc(mangaColors),2,6,'As a young boy, Goku was strange enough—he had a monkey tail and superhuman strength. But when a beautiful girl named Bulma crashes into him on her motorbike, it sets off a chain of events that changes his life forever.',rating(4.3,4.7)],
  ['One Piece Vol. 1','Eiichiro Oda',price(10,15),rc(mangaColors),2,6,'As a child, Monkey D. Luffy was inspired by his hero, the pirate "Red-Haired" Shanks, to set sail for the Grand Line in search of the legendary treasure One Piece.',rating(4.5,4.9)],
  ['One Piece Vol. 2','Eiichiro Oda',price(10,15),rc(mangaColors),2,6,'Monkey D. Luffy\'s crew grows as he recruits the world\'s greatest swordsman on his way to find the One Piece.',rating(4.5,4.9)],
  ['Tokyo Revengers Vol. 1','Ken Wakui',price(11,17),rc(mangaColors),2,6,'Takemichi Hanagaki learns that his only girlfriend from middle school, Hinata Tachibana, has been killed by the Tokyo Manji Gang.',rating(4.1,4.5)],
  ['Blue Lock Vol. 1','Muneyuki Kaneshiro',price(11,17),rc(mangaColors),2,6,'After yet another crushing defeat, Japan has a new plan to win the World Cup: gather 300 of the world\'s top high school strikers and pit them against each other.',rating(4.3,4.7)],

  // ── MANGA / Romance (cat 2, genre 8) ─────────────────────────
  ['Fruits Basket Vol. 1','Natsuki Takaya',price(11,17),rc(mangaColors),2,8,'Tohru Honda discovered a secret: some members of the mysterious Soma family are possessed by spirits of the Chinese zodiac. When they are hugged by the opposite sex, they turn into their animal forms!',rating(4.3,4.7)],
  ['Kaguya-sama Vol. 1','Aka Akasaka',price(11,17),rc(mangaColors),2,8,'Two brilliant minds at one of Japan\'s most prestigious schools refuse to confess their love for each other, as it would mean admitting defeat.',rating(4.4,4.8)],
  ['Horimiya Vol. 1','HERO',price(11,17),rc(mangaColors),2,8,'Kyouko Hori and Izumi Miyamura seem to be very different people at school. But when they both discover each other\'s secret lives outside of school, they\'re both surprised.',rating(4.3,4.7)],
  ['Ao Haru Ride Vol. 1','Io Sakisaka',price(11,17),rc(mangaColors),2,8,'Futaba Yoshioka used to be an attractive and popular middle schooler—and then everything changed when the boy she liked, Kou Tanaka, moved away.',rating(4.2,4.6)],
  ['My Love Story!! Vol. 1','Kazune Kawahara',price(10,15),rc(mangaColors),2,8,'Takeo Goda is a giant guy with a giant heart. Too bad the girls don\'t want him! (They all go for his good-looking best friend, Sunakawa.)',rating(4.4,4.8)],
  ['Ouran High School Host Club Vol. 1','Bisco Hatori',price(10,15),rc(mangaColors),2,8,'One day, the scholarship student Haruhi stumbles across the eccentric Host Club: a group of boys who entertain girls in the school\'s music room.',rating(4.3,4.7)],
  ['Nana Vol. 1','Ai Yazawa',price(11,17),rc(mangaColors),2,8,'Two young women—both named Nana—meet on a train to Tokyo, becoming best friends as they both try to achieve their dreams in the big city.',rating(4.4,4.8)],

  // ── MANGA / Fantasy (cat 2, genre 9) ─────────────────────────
  ['Made in Abyss Vol. 1','Akihito Tsukushi',price(13,19),rc(mangaColors),2,9,'The world-famous Abyss is a bottomless pit whose depths are lined with countless mysterious relics and ancient mysteries.',rating(4.5,4.9)],
  ['Dungeon Meshi Vol. 1','Ryoko Kui',price(12,18),rc(mangaColors),2,9,'After falling in battle against a dragon and barely escaping, adventurer Laios Touden and his party must return to the dungeon to save his sister.',rating(4.6,4.9)],
  ['Dungeon Meshi Vol. 2','Ryoko Kui',price(12,18),rc(mangaColors),2,9,'The party continues deeper into the dungeon, cooking and eating monsters along the way in this unique culinary fantasy adventure.',rating(4.6,4.9)],
  ['The Ancient Magus\' Bride Vol. 1','Kore Yamazaki',price(12,18),rc(mangaColors),2,9,'Chise Hatori has lived a life full of neglect and abuse, devoid of anything resembling love. But when she is sold at an auction to a tall masked gentleman, she finds herself thrust into a world of magic and monsters.',rating(4.3,4.7)],
  ['Witch Hat Atelier Vol. 1','Kamome Shirahama',price(12,18),rc(mangaColors),2,9,'The witch Qifrey takes young Coco under his wing at his Atelier so that she may learn the art of magic that she secretly witnessed.',rating(4.5,4.9)],
  ['That Time I Got Reincarnated as a Slime Vol. 1','Fuse',price(11,17),rc(mangaColors),2,9,'A regular salaryman is killed protecting a colleague and wakes up as a slime in a dungeon. This is the manga adaptation.',rating(4.1,4.5)],

  // ── MANGA / Horror (cat 2, genre 10) ─────────────────────────
  ['Uzumaki Vol. 1','Junji Ito',price(20,28),rc(mangaColors),2,10,'Kurozu-cho is a small fogbound town on the coast of Japan, cursed by the spiraling form of the uzumaki—the hypnotic secret pattern of the spiral.',rating(4.6,4.9)],
  ['Gyo Vol. 1','Junji Ito',price(15,22),rc(mangaColors),2,10,'Something is coming ashore in Okinawa—dead fish, walking on mechanical legs, emitting a horrible odor. When marine biologist Kaori sees the first of the invaders, she screams.',rating(4.2,4.6)],
  ['Parasyte Vol. 1','Hitoshi Iwaaki',price(12,18),rc(mangaColors),2,10,'One night, Shinichi Izumi is invaded by a creature called a Parasite that burrows into his hand. Unable to complete its metamorphosis, the Parasite makes his hand its home.',rating(4.5,4.9)],
  ['Claymore Vol. 1','Norihiro Yagi',price(11,17),rc(mangaColors),2,10,'In a world plagued by flesh-eating monsters, beautiful human-monster hybrids called Claymores act as mercenaries for hire.',rating(4.1,4.5)],
  ['Biomega Vol. 1','Tsutomu Nihei',price(12,18),rc(mangaColors),2,10,'Zoichi Kanoe is a synthetic human traveling a post-pandemic Earth, searching for a single human who can be infected with the "N5S" virus.',rating(3.9,4.3)],

  // ── MANGA / Comedy (cat 2, genre 7) ──────────────────────────
  ['One Punch Man Vol. 1','ONE',price(11,17),rc(mangaColors),2,7,'Saitama is a hero who only became a hero for fun. After three years of "special" training, he\'s become so strong that he\'s practically invincible.',rating(4.5,4.9)],
  ['One Punch Man Vol. 2','ONE',price(11,17),rc(mangaColors),2,7,'Saitama and Genos continue their hero work while new threats emerge that test even the overpowered hero\'s limited patience.',rating(4.4,4.8)],
  ['Gintama Vol. 1','Hideaki Sorachi',price(10,15),rc(mangaColors),2,7,'Japan is now known as Edo, and samurai have been reduced to odd-jobs workers after alien invaders banned swords.',rating(4.3,4.7)],
  ['Nichijou Vol. 1','Keiichi Arawi',price(11,17),rc(mangaColors),2,7,'The most mundane aspects of everyday life are given a comedic makeover in this absurdist manga that takes ordinary situations to extraordinary extremes.',rating(4.3,4.7)],

  // ── MANGA / Sci-Fi (cat 2, genre 11) ─────────────────────────
  ['Blame! Vol. 1','Tsutomu Nihei',price(25,35),rc(mangaColors),2,11,'In the distant future, humanity has lost control of its automated city. The city grows endlessly, devouring all in its path. A figure known as Killy wanders through it, searching for Net Terminal Genes.',rating(4.3,4.7)],
  ['Planetes Vol. 1','Makoto Yukimura',price(13,19),rc(mangaColors),2,11,'In the near future, mankind has reached the stars. But the vacuum of space is littered with debris—the remains of rockets, satellites and shuttles.',rating(4.3,4.7)],
  ['20th Century Boys Vol. 1','Naoki Urasawa',price(13,19),rc(mangaColors),2,11,'When one of Kenji\'s childhood friends turns up dead, it seems like just another suicide—until the symbol they made up as kids shows up at the scene.',rating(4.5,4.9)],
  ['Monster Vol. 1','Naoki Urasawa',price(13,19),rc(mangaColors),2,11,'Dr. Kenzo Tenma is a brilliant neurosurgeon on the rise in his career and romance—until he makes a fateful choice to save the life of a critically wounded child.',rating(4.7,5.0)],

  // ── MANGA / Thriller (cat 2, genre 13) ───────────────────────
  ['Death Note Vol. 1','Tsugumi Ohba',price(11,17),rc(mangaColors),2,13,'Light Yagami is an ace student with great prospects—and he\'s bored out of his mind. But all that changes when he finds the Death Note, a notebook dropped by a rogue Shinigami death god.',rating(4.6,4.9)],
  ['Death Note Vol. 2','Tsugumi Ohba',price(11,17),rc(mangaColors),2,13,'Light continues to use the Death Note to kill criminals while the mysterious detective L closes in on his identity.',rating(4.6,4.9)],
  ['Liar Game Vol. 1','Shinobu Kaitani',price(12,18),rc(mangaColors),2,13,'Kanzaki Nao is an extremely naive college student who one day receives a hundred million yen, along with a note that she has been enrolled in the "Liar Game."',rating(4.3,4.7)],

  // ── LIGHT NOVELS / Isekai (cat 3, genre 14) ──────────────────
  ['Sword Art Online Vol. 1','Reki Kawahara',price(13,19),rc(lnColors),3,14,'In the year 2022, virtual reality has progressed by leaps and bounds, and a massive online role-playing game called Sword Art Online (SAO) is launched.',rating(3.9,4.3)],
  ['No Game No Life Vol. 1','Yuu Kamiya',price(14,20),rc(lnColors),3,14,'Sora and Shiro are gamer siblings who have never lost a game. One day, they are challenged to a game of chess by God—and win.',rating(4.1,4.5)],
  ['Overlord Vol. 1','Kugane Maruyama',price(14,20),rc(lnColors),3,14,'The servers of the popular virtual reality game Yggdrasil are shutting down, but one player—Momonga—refuses to log out and wakes up as his in-game character.',rating(4.2,4.6)],
  ['KonoSuba Vol. 1','Natsume Akatsuki',price(13,19),rc(lnColors),3,14,'After a pathetic death, Kazuma Sato is given a second chance at life in a fantasy world. He\'s allowed to bring one item of his choosing—and he picks the goddess Aqua.',rating(4.2,4.6)],
  ['Re:Zero Vol. 1','Tappei Nagatsuki',price(14,20),rc(lnColors),3,14,'Subaru Natsuki was just a regular high school student when he was suddenly summoned to another world—and immediately killed. But instead of game over, he wakes up to find himself back at the point where he was first summoned.',rating(4.3,4.7)],
  ['Mushoku Tensei Vol. 1','Rifujin na Magonote',price(14,20),rc(lnColors),3,14,'A 34-year-old shut-in is reborn as a baby with his memories intact in a world of magic and adventure. Determined not to repeat his past mistakes, he sets out to live life to the fullest.',rating(4.1,4.5)],
  ['The Rising of the Shield Hero Vol. 1','Aneko Yusagi',price(13,19),rc(lnColors),3,14,'Naofumi Iwatani is summoned to a parallel world to become one of four Cardinal Heroes. However, he is betrayed and falsely accused of a crime.',rating(3.9,4.3)],
  ['Slime Taoshite 300-nen Vol. 1','Kisetsu Morita',price(13,19),rc(lnColors),3,14,'Azusa died from overwork, and upon reincarnating as an immortal witch in a different world, she decided to live a leisurely life—only farming and defeating slimes.',rating(3.8,4.2)],
  ['So I\'m a Spider, So What? Vol. 1','Okina Baba',price(13,19),rc(lnColors),3,14,'I used to be a normal high school girl, but in the blink of an eye, I woke up in a place I\'ve never seen before and—and I\'ve become a spider?!',rating(4.0,4.4)],
  ['Tensura Diary Vol. 1','Fuse',price(13,19),rc(lnColors),3,14,'A spin-off light novel of That Time I Got Reincarnated as a Slime, focusing on the daily life in Tempest.',rating(3.8,4.2)],

  // ── LIGHT NOVELS / Fantasy (cat 3, genre 15) ─────────────────
  ['Spice and Wolf Vol. 1','Isuna Hasekura',price(14,20),rc(lnColors),3,15,'Craft Lawrence, a traveling peddler, encounters the wisewolf Holo, who is seeking a way back to her northern homeland.',rating(4.4,4.8)],
  ['Spice and Wolf Vol. 2','Isuna Hasekura',price(14,20),rc(lnColors),3,15,'Lawrence and Holo navigate the complexities of medieval trade economics while their bond deepens on the road north.',rating(4.3,4.7)],
  ['The Ancient Magus\' Bride Vol. 1','Kore Yamazaki',price(13,19),rc(lnColors),3,15,'Before becoming a manga, this was a light novel series about a girl sold at auction to a mysterious mage.',rating(4.0,4.4)],
  ['Grimgar of Fantasy and Ash Vol. 1','Ao Jyumonji',price(13,19),rc(lnColors),3,15,'Why are we here? Why are we doing this? Before Haruhiro had realized what happened, he was surrounded by darkness. When he came to his senses, he was in a world he didn\'t know.',rating(4.0,4.4)],
  ['Is It Wrong to Try to Pick Up Girls in a Dungeon? Vol. 1','Fujino Omori',price(13,19),rc(lnColors),3,15,'Bell Cranel is a young adventurer who meets the goddess Hestia and explores the labyrinthine dungeon beneath the city of Orario.',rating(3.9,4.3)],

  // ── LIGHT NOVELS / Action (cat 3, genre 16) ──────────────────
  ['Sword Art Online Progressive Vol. 1','Reki Kawahara',price(13,19),rc(lnColors),3,16,'The original story told by floor of Aincrad—a floor-by-floor, moment-by-moment retelling of the SAO experience.',rating(4.0,4.4)],
  ['Full Metal Panic! Vol. 1','Shouji Gatou',price(13,19),rc(lnColors),3,16,'Sousuke Sagara is a sergeant in a secret paramilitary organization called Mithril. His mission: protect a high school girl named Kaname Chidori.',rating(4.0,4.4)],
  ['The Saga of Tanya the Evil Vol. 1','Carlo Zen',price(14,20),rc(lnColors),3,16,'An elite Japanese salaryman is reincarnated as a young girl named Tanya Degurechaff in a world like World War I Europe, with magic.',rating(4.1,4.5)],
  ['Goblin Slayer Vol. 1','Kumo Kagyu',price(14,20),rc(lnColors),3,16,'A young priestess joins a party of adventurers to raid a goblin lair. Only she survives—saved by a man who dedicates his life to hunting goblins.',rating(3.9,4.3)],

  // ── LIGHT NOVELS / Sci-Fi (cat 3, genre 17) ──────────────────
  ['All You Need Is Kill','Hiroshi Sakurazaka',price(12,18),rc(lnColors),3,17,'When the alien Mimics invade, Keiji Kiriya is just one of many recruits shoved into a suit of battle armor and sent out to kill.',rating(4.1,4.5)],
  ['Clockwork Planet Vol. 1','Yuu Kamiya',price(13,19),rc(lnColors),3,17,'One day, a black box fell into Naoto Miura\'s room. Inside was a female automaton. The engravings on her read: RyuZU.',rating(3.8,4.2)],

  // ── LIGHT NOVELS / Mystery (cat 3, genre 18) ─────────────────
  ['Hyouka Vol. 1','Honobu Yonezawa',price(13,19),rc(lnColors),3,18,'Houtarou Oreki gets more than he bargained for when he joins the Classics Club at his sister\'s request. He immediately becomes involved in a 45-year-old mystery.',rating(4.2,4.6)],
  ['The Melancholy of Haruhi Suzumiya Vol. 1','Nagaru Tanigawa',price(13,19),rc(lnColors),3,18,'Kyon thought high school would be boring—until he sat down next to the peculiar Haruhi Suzumiya. She dragged him into the SOS Brigade, a club for supernatural phenomena.',rating(4.1,4.5)],

  // ── GRAPHIC NOVELS / Superhero (cat 4, genre 19) ─────────────
  ['Batman: Year One','Frank Miller',price(16,22),rc(gnColors),4,19,'In Year One, Frank Miller and David Mazzucchelli re-created the origin of Batman—how Gotham police lieutenant James Gordon struggled with a corrupt police force.',rating(4.3,4.7)],
  ['Batman: The Dark Knight Returns','Frank Miller',price(18,25),rc(gnColors),4,19,'Ten years have passed since Bruce Wayne hung up the cowl. Gotham City has sunk further into crime and anarchy.',rating(4.4,4.8)],
  ['Batman: Court of Owls','Scott Snyder',price(16,24),rc(gnColors),4,19,'Gotham City\'s infrastructure is being attacked, and Batman\'s investigation leads him deep into the conspiracy of an ancient secret society.',rating(4.3,4.7)],
  ['X-Men: Days of Future Past','Chris Claremont',price(15,22),rc(gnColors),4,19,'In a future where the X-Men have been hunted to near extinction, a lone mutant must travel back in time to prevent the assassination that started it all.',rating(4.2,4.6)],
  ['Civil War','Mark Millar',price(18,25),rc(gnColors),4,19,'A conflict that has been brewing for years is finally unleashed when the government enacts a Superhero Registration Act.',rating(4.0,4.4)],
  ['Avengers: Infinity Gauntlet','Jim Starlin',price(18,25),rc(gnColors),4,19,'To prove his love for Death, Thanos assembles the Infinity Gauntlet and wipes out half of all living things in the universe.',rating(4.1,4.5)],
  ['Superman: Red Son','Mark Millar',price(15,22),rc(gnColors),4,19,'What if Superman\'s rocket had landed in the Soviet Union instead of rural Kansas? Set in an alternate history, Superman becomes a communist hero.',rating(4.1,4.5)],
  ['Thor: God of Thunder','Jason Aaron',price(16,24),rc(gnColors),4,19,'A mortal, a young god, and an old king Thor must fight the God Butcher—a villain who has been killing gods throughout time.',rating(4.2,4.6)],
  ['Black Panther: A Nation Under Our Feet','Ta-Nehisi Coates',price(16,24),rc(gnColors),4,19,'T\'Challa must quell a violent revolution and rebuild a country as the Black Panther. A landmark run by acclaimed author Ta-Nehisi Coates.',rating(4.0,4.4)],
  ['All-Star Superman','Grant Morrison',price(16,24),rc(gnColors),4,19,'Grant Morrison and Frank Quitely present the Man of Steel in exciting adventures that capture the full range of Superman\'s powers.',rating(4.3,4.7)],

  // ── GRAPHIC NOVELS / Horror (cat 4, genre 20) ────────────────
  ['Locke & Key Vol. 1','Joe Hill',price(18,25),rc(gnColors),4,20,'After their father is murdered under mysterious circumstances, the Locke family moves into their ancestral home, Keyhouse, a strange old mansion.',rating(4.4,4.8)],
  ['Locke & Key Vol. 2','Joe Hill',price(18,25),rc(gnColors),4,20,'The Locke children continue to discover magical keys that can do wonderful and terrible things—but a demonic force is also searching for them.',rating(4.4,4.8)],
  ['Wytches Vol. 1','Scott Snyder',price(14,20),rc(gnColors),4,20,'Sailor Rook is not the troubled, nervous girl she appears to be—in fact, she and her father are running from a terrifying secret.',rating(4.0,4.4)],
  ['The Walking Dead Vol. 1','Robert Kirkman',price(15,22),rc(gnColors),4,20,'An epidemic of apocalyptic proportions has swept the globe, causing the dead to rise and feed on the living.',rating(4.4,4.8)],
  ['Abe Sapien Vol. 1','Mike Mignola',price(15,22),rc(gnColors),4,20,'The aquatic paranormal investigator Abe Sapien goes solo, investigating mysterious events while the world is beset by catastrophe.',rating(4.0,4.4)],

  // ── GRAPHIC NOVELS / Historical (cat 4, genre 21) ────────────
  ['Berlin Book One','Jason Lutes',price(20,28),rc(gnColors),4,21,'A sweeping epic of political, social, and artistic life in the Weimar Republic during the tumultuous years 1928-1933.',rating(4.1,4.5)],
  ['Persepolis','Marjane Satrapi',price(13,19),rc(gnColors),4,21,'Persepolis is the story of Satrapi\'s unforgettable childhood and coming of age within a large and loving family in Tehran during the Islamic Revolution.',rating(4.4,4.8)],
  ['Persepolis 2','Marjane Satrapi',price(13,19),rc(gnColors),4,21,'The continuation of Marjane Satrapi\'s story as she navigates life in Europe after leaving Iran.',rating(4.3,4.7)],
  ['The Arab of the Future','Riad Sattouf',price(18,25),rc(gnColors),4,21,'A graphic memoir of a childhood spent in France, Libya, and Syria in the 1980s.',rating(4.2,4.6)],
  ['Palestine','Joe Sacco',price(16,24),rc(gnColors),4,21,'A defining work of comics journalism—Sacco spent two months in the occupied territories of Israel and Palestine in the early 1990s.',rating(4.1,4.5)],
  ['Pedro & Me','Judd Winick',price(12,18),rc(gnColors),4,21,'A moving tribute to Pedro Zamora, an AIDS activist who appeared on The Real World, told by his friend and roommate.',rating(4.2,4.6)],

  // ── GRAPHIC NOVELS / Sci-Fi (cat 4, genre 22) ────────────────
  ['Saga Vol. 1','Brian K. Vaughan',price(15,22),rc(gnColors),4,22,'When two soldiers from opposite sides of a never-ending galactic war fall in love, they risk everything to bring a fragile new life into a dangerous old universe.',rating(4.5,4.9)],
  ['Saga Vol. 2','Brian K. Vaughan',price(15,22),rc(gnColors),4,22,'Hazel\'s parents continue their desperate flight from the many factions hunting them across the galaxy while we learn more about their war-torn universe.',rating(4.5,4.9)],
  ['Saga Vol. 3','Brian K. Vaughan',price(15,22),rc(gnColors),4,22,'Alana and Marko must risk everything to find a new home for their family while the war rages on and old enemies and new allies complicate their journey.',rating(4.5,4.9)],
  ['East of West Vol. 1','Jonathan Hickman',price(16,24),rc(gnColors),4,22,'This is the world. It is not the one we were promised, but it is the one we deserved. America is shattered, split into multiple nations.',rating(4.1,4.5)],
  ['Prophet Vol. 1','Brandon Graham',price(16,24),rc(gnColors),4,22,'An ancient superhero awakens in a far future ruled by aliens—the Earth itself has become alien, and the hero must rediscover what it means to be human.',rating(4.0,4.4)],
  ['Descender Vol. 1','Jeff Lemire',price(15,22),rc(gnColors),4,22,'When giant Harvester robots suddenly appear and begin attacking everything in sight, the universe is thrown into a panic—and the robot boy TIM-21 may hold the key to the mystery.',rating(4.0,4.4)],

  // ── GRAPHIC NOVELS / Fantasy (cat 4, genre 23) ───────────────
  ['Saga of the Swamp Thing','Alan Moore',price(18,25),rc(gnColors),4,23,'Alan Moore\'s groundbreaking run on Saga of the Swamp Thing, widely considered one of the greatest comics of all time.',rating(4.3,4.7)],
  ['The Sandman Vol. 1','Neil Gaiman',price(18,25),rc(gnColors),4,23,'A rich blend of modern myth and dark fantasy, the Sandman tells the story of Morpheus, the Dream King.',rating(4.6,4.9)],
  ['The Sandman Vol. 2','Neil Gaiman',price(18,25),rc(gnColors),4,23,'Dream, now free and in possession of his objects of power, turns his attention to a past sin—his imprisonment of a mortal who asked for immortality.',rating(4.6,4.9)],
  ['The Sandman Vol. 3','Neil Gaiman',price(18,25),rc(gnColors),4,23,'A collection of self-contained stories about Dream and his family, the Endless, woven together by a single theme: the nature of dreams.',rating(4.5,4.9)],
  ['Mouse Guard Vol. 1','David Petersen',price(14,20),rc(gnColors),4,23,'In the world of Mouse Guard, mice struggle to live safely and prosper amongst harsh conditions and a host of predators.',rating(4.3,4.7)],
  ['East of the Sun and West of the Moon','P. Craig Russell',price(16,22),rc(gnColors),4,23,'Gorgeous adaptations of Norse and fairy tale myths rendered in Russell\'s signature lyrical style.',rating(4.1,4.5)],

  // ── GRAPHIC NOVELS / Crime (cat 4, genre 24) ─────────────────
  ['Sin City Vol. 1','Frank Miller',price(16,22),rc(gnColors),4,24,'The Hard Goodbye introduces Marv, a brutal and scarred man who seeks revenge on the mysterious figure who killed the only woman who was ever kind to him.',rating(4.4,4.8)],
  ['Sin City Vol. 2','Frank Miller',price(16,22),rc(gnColors),4,24,'A Dame to Kill For—Dwight McCarthy hunts the seductive Ava Lord, a dangerous woman who will do anything to get what she wants.',rating(4.3,4.7)],
  ['Criminal Vol. 1','Ed Brubaker',price(15,22),rc(gnColors),4,24,'Coward—Leo Patterson is the best wheelman in the city, and he\'s smart enough to know when to say no. But this time he can\'t say no.',rating(4.3,4.7)],
  ['Gotham Central Vol. 1','Ed Brubaker',price(16,24),rc(gnColors),4,24,'Meet the men and women of the Gotham City Major Crimes Unit—ordinary cops working in the shadow of an extraordinary hero.',rating(4.2,4.6)],
  ['Parker: The Hunter','Richard Stark',price(15,22),rc(gnColors),4,24,'The first Parker graphic novel adaptation. Parker is a thief who does everything professionally—and now someone has betrayed him.',rating(4.3,4.7)],

  // ── MANGA / Sports (cat 2, genre 12) ─────────────────────────
  ['Haikyuu!! Vol. 1','Haruichi Furudate',price(11,17),rc(mangaColors),2,12,'Hinata Shouyou has always been fascinated by the legendary "Little Giant" volleyball player. He joins his school\'s volleyball club to become a great player himself.',rating(4.6,4.9)],
  ['Haikyuu!! Vol. 2','Haruichi Furudate',price(11,17),rc(mangaColors),2,12,'Karasuno High School prepares for their first practice match against their rivals—and Hinata and Kageyama must learn to work together.',rating(4.6,4.9)],
  ['Slam Dunk Vol. 1','Takehiko Inoue',price(10,15),rc(mangaColors),2,12,'Hanamichi Sakuragi is a first-year student at Shohoku High School with a violent reputation and a long track record of being rejected by girls.',rating(4.5,4.9)],
  ['Yowamushi Pedal Vol. 1','Wataru Watanabe',price(11,17),rc(mangaColors),2,12,'Sakamichi Onoda is a cheerful high school student who loves anime. He wants to join the anime club, but ends up in the bicycle racing club instead.',rating(4.2,4.6)],
  ['Kuroko\'s Basketball Vol. 1','Tadatoshi Fujimaki',price(10,15),rc(mangaColors),2,12,'In middle school, Kuroko Tetsuya was the phantom sixth man of Teiko\'s legendary basketball team. Now in high school, he joins the Seirin team and aims for the top.',rating(4.3,4.7)],
  ['Eyeshield 21 Vol. 1','Riichiro Inagaki',price(10,15),rc(mangaColors),2,12,'Sena is a weak, timid boy who has always been bullied. One day, to protect him, he\'s inadvertently recruited into the school\'s American football team.',rating(4.2,4.6)],
];

async function seedBooks() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inkbound',
  });

  console.log('✅ Connected');

  let inserted = 0, skipped = 0;
  for (const [title, author, bprice, cover_color, category_id, genre_id, description, goodreads_rating] of books) {
    try {
      const [exists] = await conn.query(
        'SELECT id FROM products WHERE title = ? AND author = ?',
        [title, author]
      );
      if (exists.length > 0) { skipped++; continue; }
      await conn.query(
        `INSERT INTO products (title, author, price, image_url, cover_color, category_id, genre_id, description, goodreads_rating, stock)
         VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, 50)`,
        [title, author, bprice, cover_color, category_id, genre_id, description, goodreads_rating]
      );
      inserted++;
    } catch (err) {
      console.error(`  ✗ ${title}: ${err.message}`);
    }
  }

  const [[{ count }]] = await conn.query('SELECT COUNT(*) as count FROM products');
  console.log(`\n✅ Done! Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  console.log(`📚 Total products in database: ${count}`);
  await conn.end();
}

seedBooks();
