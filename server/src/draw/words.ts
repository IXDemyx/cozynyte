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
  // Misc
  "fire", "smoke", "bomb", "treasure", "treasure map", "anchor", "flag", "medal", "trophy", "hourglass",
  "bell", "arrow", "bow", "sword", "shield", "magic wand", "crystal ball", "rocket ship", "robot dog", "snow globe",
];

/** Doppelte (gleiche Begriffe in verschiedenen Kategorien) nur einmal. */
export const WORDS = {
  de: [...new Set(DE)],
  en: [...new Set(EN)],
};
