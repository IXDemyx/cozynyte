/**
 * Begriffe für Montagsmaler – gut zeichenbar, eher leicht bis mittel. Aus dieser Liste bekommt
 * der Zeichner drei zur Wahl.
 */

// prettier-ignore
const DE = [
  // Tiere
  "Hund", "Katze", "Maus", "Pferd", "Kuh", "Schwein", "Schaf", "Ziege", "Huhn", "Ente",
  "Gans", "Hase", "Igel", "Fuchs", "Wolf", "Bär", "Eisbär", "Pinguin", "Löwe", "Tiger",
  "Elefant", "Giraffe", "Zebra", "Nashorn", "Nilpferd", "Affe", "Krokodil", "Schlange", "Schildkröte", "Frosch",
  "Fisch", "Hai", "Wal", "Delfin", "Krake", "Krebs", "Seestern", "Qualle", "Biene", "Schmetterling",
  "Spinne", "Schnecke", "Marienkäfer", "Ameise", "Eule", "Adler", "Papagei", "Flamingo", "Pfau", "Fledermaus",
  "Känguru", "Koala", "Kamel", "Einhorn", "Drache", "Dinosaurier", "Eichhörnchen", "Hamster", "Regenwurm", "Mücke",
  // Essen und Trinken
  "Apfel", "Banane", "Birne", "Kirsche", "Erdbeere", "Ananas", "Wassermelone", "Zitrone", "Traube", "Karotte",
  "Tomate", "Gurke", "Kartoffel", "Brokkoli", "Pilz", "Mais", "Paprika", "Zwiebel", "Knoblauch", "Brot",
  "Brezel", "Croissant", "Pizza", "Burger", "Pommes", "Hotdog", "Döner", "Spaghetti", "Sushi", "Taco",
  "Ei", "Käse", "Wurst", "Kuchen", "Torte", "Donut", "Keks", "Eis", "Lutscher", "Schokolade",
  "Popcorn", "Honig", "Kaffee", "Tee", "Milch", "Saft", "Limonade", "Bier", "Wein", "Kakao",
  // Haushalt und Gegenstände
  "Tisch", "Stuhl", "Sofa", "Bett", "Lampe", "Kerze", "Uhr", "Wecker", "Spiegel", "Fenster",
  "Tür", "Schlüssel", "Schloss", "Treppe", "Leiter", "Badewanne", "Dusche", "Toilette", "Zahnbürste", "Seife",
  "Handtuch", "Kamm", "Schere", "Messer", "Gabel", "Löffel", "Teller", "Tasse", "Glas", "Flasche",
  "Topf", "Pfanne", "Kühlschrank", "Herd", "Toaster", "Mikrowelle", "Waschmaschine", "Staubsauger", "Besen", "Eimer",
  "Regenschirm", "Brille", "Sonnenbrille", "Hut", "Mütze", "Schal", "Handschuh", "Socke", "Schuh", "Stiefel",
  "Hose", "Kleid", "Krawatte", "T-Shirt", "Jacke", "Rucksack", "Koffer", "Geldbeutel", "Ring", "Krone",
  "Buch", "Zeitung", "Brief", "Stift", "Bleistift", "Pinsel", "Radiergummi", "Lineal", "Kleber", "Papierflieger",
  "Handy", "Laptop", "Tastatur", "Maus", "Fernseher", "Kamera", "Kopfhörer", "Mikrofon", "Radio", "Batterie",
  "Glühbirne", "Steckdose", "Hammer", "Nagel", "Schraube", "Säge", "Zange", "Magnet", "Kompass", "Lupe",
  "Ballon", "Geschenk", "Kalender", "Puzzle", "Würfel", "Teddybär", "Puppe", "Drachen", "Murmel", "Kreisel",
  // Fahrzeuge
  "Auto", "Bus", "Lkw", "Fahrrad", "Motorrad", "Roller", "Zug", "Straßenbahn", "Flugzeug", "Hubschrauber",
  "Rakete", "Ufo", "Schiff", "Boot", "U-Boot", "Traktor", "Bagger", "Feuerwehrauto", "Krankenwagen", "Polizeiauto",
  "Taxi", "Skateboard", "Kinderwagen", "Heißluftballon", "Segelboot",
  // Natur und Orte
  "Sonne", "Mond", "Stern", "Wolke", "Regen", "Regenbogen", "Blitz", "Schneemann", "Schneeflocke", "Tornado",
  "Berg", "Vulkan", "Insel", "Strand", "Welle", "Fluss", "Wasserfall", "Wüste", "Kaktus", "Palme",
  "Baum", "Blume", "Rose", "Sonnenblume", "Tulpe", "Blatt", "Pilz", "Gras", "Wald", "Höhle",
  "Haus", "Schloss", "Burg", "Kirche", "Leuchtturm", "Brücke", "Turm", "Zelt", "Iglu", "Windmühle",
  "Ampel", "Zaun", "Briefkasten", "Bank", "Spielplatz", "Rutsche", "Schaukel", "Brunnen", "Pyramide", "Erde",
  // Menschen und Berufe
  "Baby", "Oma", "Pirat", "Ritter", "Prinzessin", "König", "Hexe", "Zauberer", "Geist", "Vampir",
  "Zombie", "Roboter", "Astronaut", "Feuerwehrmann", "Polizist", "Arzt", "Koch", "Bäcker", "Maler", "Clown",
  "Cowboy", "Ninja", "Superheld", "Taucher", "Detektiv", "Engel", "Meerjungfrau", "Weihnachtsmann", "Osterhase", "Schneewittchen",
  // Körper
  "Auge", "Nase", "Mund", "Ohr", "Zahn", "Zunge", "Hand", "Fuß", "Herz", "Gehirn",
  "Knochen", "Skelett", "Bart", "Haare", "Daumen",
  // Sport und Freizeit
  "Fußball", "Basketball", "Tennis", "Golf", "Bowling", "Schwimmen", "Skifahren", "Surfen", "Boxen", "Angeln",
  "Gitarre", "Klavier", "Trommel", "Geige", "Trompete", "Zirkus", "Kino", "Konzert", "Lagerfeuer", "Picknick",
  "Tanzen", "Schlafen", "Lachen", "Weinen", "Niesen", "Kochen", "Lesen", "Joggen", "Klettern", "Zaubern",
  // Videospiele
  "Minecraft", "Tetris", "Pac-Man", "Super Mario", "Mario Kart", "Zelda", "Pokémon", "Pikachu", "Sonic", "Donkey Kong",
  "Fortnite", "Among Us", "Angry Birds", "Flappy Bird", "Candy Crush", "Fruit Ninja", "Subway Surfers", "Snake", "Space Invaders", "Pong",
  "Die Sims", "Animal Crossing", "Rocket League", "FIFA", "GTA", "Call of Duty", "Counter-Strike", "Roblox", "Street Fighter", "Wii Sports",
  "Gameboy", "Controller", "Joystick", "Spielkonsole", "Spielautomat", "Virtual Reality",
  // Brett-, Karten- und Kinderspiele
  "Schach", "Dame", "Mensch ärgere dich nicht", "Monopoly", "UNO", "Jenga", "Twister", "Kniffel", "Memory", "Domino",
  "Mikado", "Scrabble", "Catan", "Cluedo", "Risiko", "Schiffe versenken", "Vier gewinnt", "Tic-Tac-Toe", "Galgenmännchen", "Stadt Land Fluss",
  "Poker", "Bingo", "Sudoku", "Kreuzworträtsel", "Zauberwürfel", "Billard", "Tischkicker", "Dart", "Flipper", "Tischtennis",
  "Verstecken", "Fangen", "Seilspringen", "Himmel und Hölle", "Sackhüpfen", "Eierlaufen", "Topfschlagen", "Reise nach Jerusalem", "Kartenhaus", "Schere Stein Papier",
  // Filme, Serien und Figuren
  "Titanic", "Star Wars", "Harry Potter", "Herr der Ringe", "Shrek", "Findet Nemo", "König der Löwen", "Die Eiskönigin", "Jurassic Park", "Toy Story",
  "Spongebob", "Die Simpsons", "Minions", "Batman", "Spider-Man", "Superman", "Hulk", "Darth Vader", "Yoda", "Gollum",
  "Pinocchio", "Peter Pan", "Dracula", "Frankenstein", "King Kong", "Godzilla", "Biene Maja", "Sandmännchen", "Die Maus", "Pippi Langstrumpf",
  // Märchen und Sagen
  "Rotkäppchen", "Hänsel und Gretel", "Aschenputtel", "Rapunzel", "Froschkönig", "Dornröschen", "Rumpelstilzchen", "Der gestiefelte Kater", "Die drei kleinen Schweinchen", "Bremer Stadtmusikanten",
  "Aladdin", "Wunderlampe", "fliegender Teppich", "Zwerg", "Riese", "Troll", "Kobold", "Fee", "Phönix", "Trojanisches Pferd",
  // Sehenswürdigkeiten
  "Eiffelturm", "Freiheitsstatue", "Brandenburger Tor", "Big Ben", "Kolosseum", "Schiefer Turm von Pisa", "Chinesische Mauer", "Stonehenge", "Kölner Dom", "Neuschwanstein",
  "Golden Gate Bridge", "Sphinx", "Taj Mahal", "Oper von Sydney", "Mount Everest", "Niagarafälle", "Hollywood", "Atomium", "Christusstatue", "Fernsehturm",
  // Feste und Feiertage
  "Weihnachtsbaum", "Adventskranz", "Nikolaus", "Rentier", "Silvester", "Feuerwerk", "Osterei", "Halloween", "Kürbis", "Karneval",
  "Oktoberfest", "Hochzeit", "Geburtstag", "Valentinstag", "Schultüte", "Konfetti", "Party", "Weihnachtsmarkt", "Lebkuchenhaus", "Martinslaterne",
  // Musik
  "Saxofon", "Harfe", "Flöte", "Xylofon", "Akkordeon", "Dudelsack", "Tuba", "Ukulele", "E-Gitarre", "Schlagzeug",
  "Mundharmonika", "Triangel", "Dirigent", "Band", "Karaoke", "DJ", "Plattenspieler", "Noten", "Rockstar", "Chor",
  // Technik und Internet
  "WLAN", "Emoji", "Selfie", "Hashtag", "QR-Code", "Drohne", "leerer Akku", "Smartwatch", "Computervirus", "Like",
  "Passwort", "Ladekabel", "USB-Stick", "Drucker", "Satellit", "Solaranlage", "Windrad", "E-Mail", "Influencer", "Livestream",
  // Länder
  "Deutschland", "Österreich", "Schweiz", "Frankreich", "Italien", "Spanien", "Portugal", "England", "Irland", "Niederlande",
  "Belgien", "Dänemark", "Schweden", "Norwegen", "Finnland", "Polen", "Griechenland", "Türkei", "Russland", "Ukraine",
  "USA", "Kanada", "Mexiko", "Brasilien", "Argentinien", "Ägypten", "Südafrika", "Kenia", "Indien", "China",
  "Japan", "Südkorea", "Thailand", "Australien", "Neuseeland", "Island", "Jamaika", "Hawaii", "Schottland", "Peru",
  // Sonstiges
  "Herzschlag", "Feuer", "Rauch", "Bombe", "Schatz", "Schatzkarte", "Anker", "Fahne", "Medaille", "Pokal",
  "Ampel", "Sanduhr", "Glocke", "Pfeil", "Bogen", "Schwert", "Schild", "Zauberstab", "Kristallkugel", "Wunschbrunnen",
];

// prettier-ignore
const EN = [
  // Animals
  "dog", "cat", "mouse", "horse", "cow", "pig", "sheep", "goat", "chicken", "duck",
  "rabbit", "hedgehog", "fox", "wolf", "bear", "polar bear", "penguin", "lion", "tiger", "elephant",
  "giraffe", "zebra", "rhino", "hippo", "monkey", "crocodile", "snake", "turtle", "frog", "fish",
  "shark", "whale", "dolphin", "octopus", "crab", "starfish", "jellyfish", "bee", "butterfly", "spider",
  "snail", "ladybug", "ant", "owl", "eagle", "parrot", "flamingo", "peacock", "bat", "kangaroo",
  "koala", "camel", "unicorn", "dragon", "dinosaur", "squirrel", "hamster", "worm", "mosquito", "bird",
  // Food and drink
  "apple", "banana", "pear", "cherry", "strawberry", "pineapple", "watermelon", "lemon", "grapes", "carrot",
  "tomato", "cucumber", "potato", "broccoli", "mushroom", "corn", "pepper", "onion", "garlic", "bread",
  "pretzel", "croissant", "pizza", "burger", "fries", "hot dog", "sandwich", "spaghetti", "sushi", "taco",
  "egg", "cheese", "sausage", "cake", "birthday cake", "donut", "cookie", "ice cream", "lollipop", "chocolate",
  "popcorn", "honey", "coffee", "tea", "milk", "juice", "lemonade", "beer", "wine", "pancake",
  // Household and objects
  "table", "chair", "sofa", "bed", "lamp", "candle", "clock", "alarm clock", "mirror", "window",
  "door", "key", "lock", "stairs", "ladder", "bathtub", "shower", "toilet", "toothbrush", "soap",
  "towel", "comb", "scissors", "knife", "fork", "spoon", "plate", "cup", "glass", "bottle",
  "pot", "pan", "fridge", "stove", "toaster", "microwave", "washing machine", "vacuum cleaner", "broom", "bucket",
  "umbrella", "glasses", "sunglasses", "hat", "beanie", "scarf", "glove", "sock", "shoe", "boot",
  "trousers", "dress", "tie", "t-shirt", "jacket", "backpack", "suitcase", "wallet", "ring", "crown",
  "book", "newspaper", "letter", "pen", "pencil", "paintbrush", "eraser", "ruler", "glue", "paper plane",
  "phone", "laptop", "keyboard", "computer mouse", "tv", "camera", "headphones", "microphone", "radio", "battery",
  "light bulb", "plug", "hammer", "nail", "screw", "saw", "pliers", "magnet", "compass", "magnifying glass",
  "balloon", "present", "calendar", "puzzle", "dice", "teddy bear", "doll", "kite", "marble", "yo-yo",
  // Vehicles
  "car", "bus", "truck", "bicycle", "motorcycle", "scooter", "train", "tram", "airplane", "helicopter",
  "rocket", "ufo", "ship", "boat", "submarine", "tractor", "excavator", "fire truck", "ambulance", "police car",
  "taxi", "skateboard", "stroller", "hot air balloon", "sailboat",
  // Nature and places
  "sun", "moon", "star", "cloud", "rain", "rainbow", "lightning", "snowman", "snowflake", "tornado",
  "mountain", "volcano", "island", "beach", "wave", "river", "waterfall", "desert", "cactus", "palm tree",
  "tree", "flower", "rose", "sunflower", "tulip", "leaf", "grass", "forest", "cave", "house",
  "castle", "church", "lighthouse", "bridge", "tower", "tent", "igloo", "windmill", "traffic light", "fence",
  "mailbox", "bench", "playground", "slide", "swing", "fountain", "pyramid", "earth", "skyscraper", "farm",
  // People and jobs
  "baby", "grandma", "pirate", "knight", "princess", "king", "witch", "wizard", "ghost", "vampire",
  "zombie", "robot", "astronaut", "firefighter", "police officer", "doctor", "chef", "baker", "painter", "clown",
  "cowboy", "ninja", "superhero", "diver", "detective", "angel", "mermaid", "santa claus", "easter bunny", "alien",
  // Body
  "eye", "nose", "mouth", "ear", "tooth", "tongue", "hand", "foot", "heart", "brain",
  "bone", "skeleton", "beard", "hair", "thumb",
  // Sports and hobbies
  "football", "basketball", "tennis", "golf", "bowling", "swimming", "skiing", "surfing", "boxing", "fishing",
  "guitar", "piano", "drum", "violin", "trumpet", "circus", "cinema", "concert", "campfire", "picnic",
  "dancing", "sleeping", "laughing", "crying", "sneezing", "cooking", "reading", "jogging", "climbing", "magic trick",
  // Video games
  "Minecraft", "Tetris", "Pac-Man", "Super Mario", "Mario Kart", "Zelda", "Pokémon", "Pikachu", "Sonic", "Donkey Kong",
  "Fortnite", "Among Us", "Angry Birds", "Flappy Bird", "Candy Crush", "Fruit Ninja", "Subway Surfers", "Snake", "Space Invaders", "Pong",
  "The Sims", "Animal Crossing", "Rocket League", "FIFA", "GTA", "Call of Duty", "Counter-Strike", "Roblox", "Street Fighter", "Wii Sports",
  "Game Boy", "controller", "joystick", "game console", "arcade machine", "virtual reality",
  // Board, card and playground games
  "chess", "checkers", "ludo", "Monopoly", "UNO", "Jenga", "Twister", "Yahtzee", "memory", "dominoes",
  "pick-up sticks", "Scrabble", "Catan", "Cluedo", "Risk", "Battleship", "Connect Four", "tic-tac-toe", "hangman", "poker",
  "bingo", "sudoku", "crossword", "Rubik's cube", "billiards", "table football", "darts", "pinball", "table tennis", "hide and seek",
  "tag", "jump rope", "hopscotch", "sack race", "egg and spoon race", "musical chairs", "house of cards", "rock paper scissors", "tug of war", "piñata",
  // Movies, shows and characters
  "Titanic", "Star Wars", "Harry Potter", "Lord of the Rings", "Shrek", "Finding Nemo", "The Lion King", "Frozen", "Jurassic Park", "Toy Story",
  "SpongeBob", "The Simpsons", "Minions", "Batman", "Spider-Man", "Superman", "Hulk", "Darth Vader", "Yoda", "Gollum",
  "Pinocchio", "Peter Pan", "Dracula", "Frankenstein", "King Kong", "Godzilla", "Winnie the Pooh", "Mickey Mouse", "Scooby-Doo", "Ghostbusters",
  // Fairy tales and legends
  "Little Red Riding Hood", "Hansel and Gretel", "Cinderella", "Rapunzel", "Frog Prince", "Sleeping Beauty", "Snow White", "Puss in Boots", "Three Little Pigs", "Jack and the Beanstalk",
  "Aladdin", "magic lamp", "flying carpet", "dwarf", "giant", "troll", "leprechaun", "fairy", "phoenix", "Trojan horse",
  // Landmarks
  "Eiffel Tower", "Statue of Liberty", "Brandenburg Gate", "Big Ben", "Colosseum", "Leaning Tower of Pisa", "Great Wall of China", "Stonehenge", "Tower Bridge", "Neuschwanstein",
  "Golden Gate Bridge", "Sphinx", "Taj Mahal", "Sydney Opera House", "Mount Everest", "Niagara Falls", "Hollywood", "Mount Rushmore", "Christ the Redeemer", "Space Needle",
  // Holidays and celebrations
  "Christmas tree", "advent wreath", "reindeer", "New Year's Eve", "fireworks", "Easter egg", "Halloween", "pumpkin", "carnival", "Oktoberfest",
  "wedding", "birthday", "Valentine's Day", "Thanksgiving", "confetti", "party", "gingerbread house", "stocking", "candy cane", "jack-o'-lantern",
  // Music
  "saxophone", "harp", "flute", "xylophone", "accordion", "bagpipes", "tuba", "ukulele", "electric guitar", "drum kit",
  "harmonica", "triangle", "conductor", "band", "karaoke", "DJ", "record player", "music notes", "rock star", "choir",
  // Tech and internet
  "wifi", "emoji", "selfie", "hashtag", "QR code", "drone", "low battery", "smartwatch", "computer virus", "like",
  "password", "charging cable", "USB stick", "printer", "satellite", "solar panel", "wind turbine", "email", "influencer", "livestream",
  // Countries
  "Germany", "Austria", "Switzerland", "France", "Italy", "Spain", "Portugal", "England", "Ireland", "Netherlands",
  "Belgium", "Denmark", "Sweden", "Norway", "Finland", "Poland", "Greece", "Turkey", "Russia", "Ukraine",
  "USA", "Canada", "Mexico", "Brazil", "Argentina", "Egypt", "South Africa", "Kenya", "India", "China",
  "Japan", "South Korea", "Thailand", "Australia", "New Zealand", "Iceland", "Jamaica", "Hawaii", "Scotland", "Peru",
  // Misc
  "fire", "smoke", "bomb", "treasure", "treasure map", "anchor", "flag", "medal", "trophy", "hourglass",
  "bell", "arrow", "bow", "sword", "shield", "magic wand", "crystal ball", "rocket ship", "robot dog", "snow globe",
];

/** Doppelte (gleiche Begriffe in verschiedenen Kategorien) nur einmal. */
export const WORDS = {
  de: [...new Set(DE)],
  en: [...new Set(EN)],
};
