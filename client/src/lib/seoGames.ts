/**
 * Texte und Adressen der Spielseiten (eine Seite pro Spiel und Sprache). Gehört zu seo.ts und ist
 * nur wegen der Textmenge ausgelagert – ebenfalls ohne Imports zur Laufzeit.
 */

import type { SeoLanguage } from "./seo";

/**
 * Spielseiten: je Spiel eine eigene Seite pro Sprache, damit Google sie für die Suche nach dem
 * Spiel findet (z. B. „Stadt Land Fluss online“). Die IDs sind dieselben wie die Spiel-IDs.
 * Englisch ohne Präfix, Deutsch unter `/de` – wie bei den Startseiten.
 */
export type GamePageId =
  | "song"
  | "year"
  | "timeline"
  | "slf"
  | "kniffel"
  | "draw"
  | "geo"
  | "snippet"
  | "flag"
  | "outline";

export const GAME_PATH: Record<GamePageId, Record<SeoLanguage, string>> = {
  song: { en: "/guess-the-song", de: "/de/song-erraten" },
  year: { en: "/guess-the-year", de: "/de/jahr-schaetzen" },
  timeline: { en: "/song-timeline", de: "/de/song-zeitleiste" },
  slf: { en: "/name-place-animal-thing", de: "/de/stadt-land-fluss" },
  kniffel: { en: "/yahtzee", de: "/de/kniffel" },
  draw: { en: "/draw-and-guess", de: "/de/montagsmaler" },
  geo: { en: "/country-quiz", de: "/de/laender-quiz" },
  snippet: { en: "/song-snippet", de: "/de/song-schnipsel" },
  flag: { en: "/flag-of-the-day", de: "/de/flagge-des-tages" },
  outline: { en: "/shape-of-the-day", de: "/de/umriss-des-tages" },
};

export interface GamePageText {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  /** Erster Teil der Brotkrumen (führt zur Startseite). */
  breadcrumb: string;
  /** Name des Spiels – zweiter Teil der Brotkrumen und Name in den strukturierten Daten. */
  name: string;
  title: string;
  /** Teil der Überschrift in Akzentfarbe (muss in `title` vorkommen). */
  titleAccent: string;
  intro: string;
  facts: string[];
  /** Beispielrunde als Karte neben der Überschrift. `badge`: kurzer Text statt Spiel-Symbol. */
  example: {
    title: string;
    badge?: string;
    round: string;
    rows: { label: string; value: string; points?: number }[];
    note: string;
  };
  howTitle: string;
  steps: { title: string; text: string }[];
  rulesTitle: string;
  rules: { title: string; text: string }[];
  scoreTitle: string;
  scores: { label: string; value: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  allGames: string;
}

/** Was auf allen Spielseiten einer Sprache gleich ist. */
const COMMON: Record<
  SeoLanguage,
  Pick<GamePageText, "breadcrumb" | "howTitle" | "rulesTitle" | "faqTitle" | "allGames">
> = {
  de: {
    breadcrumb: "Spiele",
    howTitle: "So funktioniert's",
    rulesTitle: "Regeln und Einstellungen",
    faqTitle: "Häufige Fragen",
    allGames: "Alle Spiele",
  },
  en: {
    breadcrumb: "Games",
    howTitle: "How it works",
    rulesTitle: "Rules and settings",
    faqTitle: "FAQ",
    allGames: "All games",
  },
};

/** Schritt 2 ist bei allen Spielen gleich. */
const INVITE: Record<SeoLanguage, { title: string; text: string }> = {
  de: {
    title: "Freunde einladen",
    text: "Link oder vierstelligen Raumcode schicken. Jeder spielt am eigenen Handy oder Rechner.",
  },
  en: {
    title: "Invite friends",
    text: "Send the link or the four-letter room code. Everyone plays on their own phone or computer.",
  },
};

/** Frage zum Videocall – passt zu jedem Spiel. */
const VIDEO_CALL: Record<SeoLanguage, { q: string; a: string }> = {
  de: {
    q: "Geht das auch per Videocall?",
    a: "Ja. Jeder spielt am eigenen Gerät, egal ob ihr am selben Tisch sitzt oder über Discord oder Zoom verbunden seid.",
  },
  en: {
    q: "Does it work over a video call?",
    a: "Yes. Everyone plays on their own device, whether you're at the same table or on Discord or Zoom.",
  },
};

const FREE: Record<SeoLanguage, { q: string; a: string }> = {
  de: {
    q: "Kostet das etwas?",
    a: "Nein. Alle Spiele auf Cozynyte sind kostenlos und ohne Werbung.",
  },
  en: { q: "Does it cost anything?", a: "No. Every game on Cozynyte is free and ad-free." },
};

type PageText = Omit<GamePageText, keyof (typeof COMMON)["de"]>;

/**
 * Texte der Spielseiten. Zahlen (Spieler, Zeiten, Punkte) wie in shared/ und server/src/games/ –
 * bei Regeländerungen hier mitpflegen.
 */
const TEXTS: Record<GamePageId, Record<SeoLanguage, PageText>> = {
  song: {
    de: {
      metaTitle: "Song erraten: Musikquiz online mit Freunden | Cozynyte",
      metaDescription:
        "Musikquiz im Browser: Jeder wählt Songs aus, alle raten Titel und Interpret der Hörprobe. Kostenlos, ohne Anmeldung, auch per Videocall.",
      ogTitle: "Song erraten – Musikquiz online",
      ogDescription: "Jeder wählt Songs aus, alle raten Titel und Interpret. Kostenlos im Browser.",
      name: "Song erraten",
      title: "Song erraten: Musikquiz mit Freunden",
      titleAccent: "Song erraten",
      intro:
        "Jeder sucht sich Songs aus, die anderen raten Titel und Interpret der kurzen Hörprobe. Kostenlos im Browser, ohne Anmeldung.",
      facts: [
        "2–16 Spieler",
        "1–10 Songs pro Spieler",
        "15, 20 oder 30 Sek. pro Song",
        "Hörproben über iTunes",
      ],
      example: {
        title: "Beispielrunde",
        round: "Song 3 von 12",
        rows: [
          { label: "Lea", value: "Titel", points: 88 },
          { label: "Lea", value: "Interpret", points: 41 },
          { label: "Ben", value: "Titel", points: 63 },
          { label: "Mia", value: "Fast richtig" },
          { label: "Tom", value: "hat den Song gewählt", points: 30 },
        ],
        note: "Je schneller, desto mehr Punkte. Wer den Song gewählt hat, bekommt für jeden erratenen Titel Punkte.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Songs pro Spieler, Zeit und ein Motto stellt der Host ein.",
        },
        INVITE.de,
        {
          title: "Songs wählen und raten",
          text: "Jeder sucht seine Songs aus, die anderen sehen sie nicht. Dann laufen die Hörproben, alle tippen im Chat.",
        },
      ],
      rules: [
        {
          title: "Raten",
          text: "Titel und Interpret werden getrennt gewertet. Kleine Tippfehler zählen trotzdem, knapp daneben zeigt das Spiel als „fast richtig“ an.",
        },
        {
          title: "Hinweise",
          text: "Im Lauf der Runde werden nach und nach Buchstaben von Titel und Interpret aufgedeckt.",
        },
        {
          title: "Eigene Songs",
          text: "Wer einen Song gewählt hat, rät dabei nicht mit, darf aber chatten. Zu schwere Songs lohnen sich nicht.",
        },
        {
          title: "Motto",
          text: "Optional, etwa „Nur 2000er“. Für Unentschlossene gibt es Vorschläge nach Genre und Jahrzehnt.",
        },
      ],
      scoreTitle: "Punkte",
      scores: [
        { label: "Titel erraten", value: "50 + bis zu 50" },
        { label: "Interpret erraten", value: "25 + bis zu 25" },
        { label: "Eigener Song wird erraten (pro Titel)", value: "15" },
        { label: "Zusatzpunkte", value: "je schneller, desto mehr" },
      ],
      faq: [
        {
          q: "Woher kommen die Songs?",
          a: "Jeder sucht sich selbst Songs aus. Abgespielt werden kurze Hörproben über die Musiksuche von Apple (iTunes).",
        },
        {
          q: "Braucht man ein Spotify- oder Apple-Konto?",
          a: "Nein. Die Hörproben sind frei verfügbar, es braucht weder Konto noch App.",
        },
        { q: "Wie viele Spieler können mitmachen?", a: "Zwei bis 16 Spieler pro Raum." },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Guess the Song: music quiz with friends | Cozynyte",
      metaDescription:
        "Music quiz in your browser: everyone picks songs, everyone guesses title and artist from a short preview. Free, no sign-up, works over video calls.",
      ogTitle: "Guess the Song – online music quiz",
      ogDescription:
        "Everyone picks songs, everyone guesses title and artist. Free in your browser.",
      name: "Guess the Song",
      title: "Guess the Song: music quiz with friends",
      titleAccent: "Guess the Song",
      intro:
        "Everyone picks songs, the others guess title and artist from a short preview. Free in your browser, no sign-up.",
      facts: [
        "2–16 players",
        "1–10 songs per player",
        "15, 20 or 30 s per song",
        "Previews via iTunes",
      ],
      example: {
        title: "Example round",
        round: "Song 3 of 12",
        rows: [
          { label: "Lea", value: "Title", points: 88 },
          { label: "Lea", value: "Artist", points: 41 },
          { label: "Ben", value: "Title", points: 63 },
          { label: "Mia", value: "Close" },
          { label: "Tom", value: "picked the song", points: 30 },
        ],
        note: "The faster, the more points. Whoever picked the song scores with every correct title.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. The host sets songs per player, time and an optional theme.",
        },
        INVITE.en,
        {
          title: "Pick songs and guess",
          text: "Everyone picks their songs in secret. Then the previews play and everyone guesses in the chat.",
        },
      ],
      rules: [
        {
          title: "Guessing",
          text: "Title and artist score separately. Small typos still count, near misses show up as “close”.",
        },
        {
          title: "Hints",
          text: "Letters of title and artist are revealed bit by bit as the round goes on.",
        },
        {
          title: "Your own songs",
          text: "Whoever picked a song doesn't guess it but can chat. Songs that are too obscure don't pay off.",
        },
        {
          title: "Theme",
          text: "Optional, for example “2000s only”. If you're stuck, there are suggestions by genre and decade.",
        },
      ],
      scoreTitle: "Points",
      scores: [
        { label: "Title guessed", value: "50 + up to 50" },
        { label: "Artist guessed", value: "25 + up to 25" },
        { label: "Your song is guessed (per title)", value: "15" },
        { label: "Extra points", value: "the faster, the more" },
      ],
      faq: [
        {
          q: "Where do the songs come from?",
          a: "Everyone picks their own songs. Short previews are played via Apple's music search (iTunes).",
        },
        {
          q: "Do we need a Spotify or Apple account?",
          a: "No. The previews are freely available, no account or app needed.",
        },
        { q: "How many people can play?", a: "Two to 16 players per room." },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  year: {
    de: {
      metaTitle: "Jahr schätzen: Musikquiz mit Freunden | Cozynyte",
      metaDescription:
        "Aus welchem Jahr ist der Song? Musikquiz im Browser: Jeder wählt Songs, alle schätzen das Erscheinungsjahr. Kostenlos und ohne Anmeldung.",
      ogTitle: "Jahr schätzen – Musikquiz online",
      ogDescription:
        "Aus welchem Jahr ist der Song? Wer am nächsten dran liegt, bekommt die meisten Punkte.",
      name: "Jahr schätzen",
      title: "Jahr schätzen: Aus welchem Jahr ist der Song?",
      titleAccent: "Jahr schätzen",
      intro:
        "Jeder wählt Songs aus, alle hören die Hörprobe und schätzen das Erscheinungsjahr. Wer am nächsten dran liegt, bekommt die meisten Punkte.",
      facts: [
        "2–16 Spieler",
        "1–10 Songs pro Spieler",
        "15, 20 oder 30 Sek. pro Song",
        "Ein Tipp pro Song",
      ],
      example: {
        title: "Beispielrunde",
        badge: "1987",
        round: "Song 5 von 10",
        rows: [
          { label: "Lea", value: "1987", points: 100 },
          { label: "Ben", value: "1985", points: 70 },
          { label: "Mia", value: "1990", points: 60 },
          { label: "Tom", value: "1979", points: 10 },
          { label: "Ali", value: "hat den Song gewählt", points: 20 },
        ],
        note: "Genau getroffen: 100 Punkte. Wer den Song gewählt hat, bekommt 10 pro Tipp mit höchstens 2 Jahren Abstand.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Songs pro Spieler, Zeit und ein Motto stellt der Host ein.",
        },
        INVITE.de,
        {
          title: "Hören und schätzen",
          text: "Die Hörprobe läuft, jeder gibt einen Tipp ab. In der Auflösung seht ihr, wer am nächsten lag.",
        },
      ],
      rules: [
        {
          title: "Ein Tipp",
          text: "Jeder schätzt einmal pro Song, danach ist der Tipp gesperrt.",
        },
        {
          title: "Titel anzeigen",
          text: "Der Host entscheidet, ob Titel und Interpret während der Runde zu sehen sind oder ob ihr nur hört.",
        },
        {
          title: "Eigene Songs",
          text: "Gut schätzbare Songs lohnen sich: Liegen die anderen nah dran, bekommt auch der Wähler Punkte.",
        },
        {
          title: "Jahr",
          text: "Es zählt das Jahr, das iTunes angibt. Bei Neuauflagen ist das manchmal später als das Original.",
        },
      ],
      scoreTitle: "Punkte",
      scores: [
        { label: "Genau das Jahr", value: "100" },
        { label: "1 Jahr daneben", value: "80" },
        { label: "Jedes weitere Jahr", value: "−10" },
        { label: "Eigener Song, Tipp höchstens 2 Jahre daneben", value: "10" },
      ],
      faq: [
        {
          q: "Woher kommen die Songs?",
          a: "Jeder sucht sich selbst Songs aus. Abgespielt werden kurze Hörproben über die Musiksuche von Apple (iTunes).",
        },
        {
          q: "Was ist der Unterschied zu Song erraten?",
          a: "Hier geht es nur um das Erscheinungsjahr. Titel und Interpret müsst ihr nicht kennen.",
        },
        { q: "Wie viele Spieler können mitmachen?", a: "Zwei bis 16 Spieler pro Raum." },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Guess the Year: music quiz with friends | Cozynyte",
      metaDescription:
        "Which year is the song from? Music quiz in your browser: everyone picks songs, everyone guesses the release year. Free and no sign-up.",
      ogTitle: "Guess the Year – online music quiz",
      ogDescription: "Which year is the song from? Whoever gets closest scores the most.",
      name: "Guess the Year",
      title: "Guess the Year: when was the song released?",
      titleAccent: "Guess the Year",
      intro:
        "Everyone picks songs, everyone listens to the preview and guesses the release year. Whoever gets closest scores the most.",
      facts: [
        "2–16 players",
        "1–10 songs per player",
        "15, 20 or 30 s per song",
        "One guess per song",
      ],
      example: {
        title: "Example round",
        badge: "1987",
        round: "Song 5 of 10",
        rows: [
          { label: "Lea", value: "1987", points: 100 },
          { label: "Ben", value: "1985", points: 70 },
          { label: "Mia", value: "1990", points: 60 },
          { label: "Tom", value: "1979", points: 10 },
          { label: "Ali", value: "picked the song", points: 20 },
        ],
        note: "Spot on: 100 points. Whoever picked the song gets 10 for every guess within 2 years.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. The host sets songs per player, time and an optional theme.",
        },
        INVITE.en,
        {
          title: "Listen and guess",
          text: "The preview plays, everyone locks in a year. The reveal shows who was closest.",
        },
      ],
      rules: [
        {
          title: "One guess",
          text: "Everyone guesses once per song, then the guess is locked.",
        },
        {
          title: "Show title",
          text: "The host decides whether title and artist are visible during the round or you just listen.",
        },
        {
          title: "Your own songs",
          text: "Songs that are easy to date pay off: if the others get close, the picker scores too.",
        },
        {
          title: "Year",
          text: "The year from iTunes counts. For re-releases it's sometimes later than the original.",
        },
      ],
      scoreTitle: "Points",
      scores: [
        { label: "Exact year", value: "100" },
        { label: "1 year off", value: "80" },
        { label: "Each further year", value: "−10" },
        { label: "Your song, guess within 2 years", value: "10" },
      ],
      faq: [
        {
          q: "Where do the songs come from?",
          a: "Everyone picks their own songs. Short previews are played via Apple's music search (iTunes).",
        },
        {
          q: "How is this different from Guess the Song?",
          a: "Here it's only about the release year. You don't need to know title or artist.",
        },
        { q: "How many people can play?", a: "Two to 16 players per room." },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  timeline: {
    de: {
      metaTitle: "Song-Zeitleiste: Musikspiel online mit Freunden | Cozynyte",
      metaDescription:
        "Songs zeitlich einordnen: Jeder baut seine eigene Zeitleiste, wer zuerst genug Karten richtig liegen hat, gewinnt. Kostenlos im Browser.",
      ogTitle: "Song-Zeitleiste – Musikspiel online",
      ogDescription: "Songs hören und in die eigene Zeitleiste einordnen. Kostenlos im Browser.",
      name: "Song-Zeitleiste",
      title: "Song-Zeitleiste online spielen",
      titleAccent: "Song-Zeitleiste",
      intro:
        "Song hören, Jahr schätzen und an die richtige Stelle der eigenen Zeitleiste legen. Wer zuerst genug Karten richtig liegen hat, gewinnt.",
      facts: [
        "2–16 Spieler",
        "4–10 Karten zum Sieg",
        "Alle gleichzeitig oder reihum",
        "1–10 Songs pro Spieler",
      ],
      example: {
        title: "Deine Zeitleiste",
        round: "Song 7 von 20",
        rows: [
          { label: "1979", value: "Startkarte" },
          { label: "1983", value: "Toto – Africa" },
          { label: "1995", value: "Oasis – Wonderwall", points: 1 },
          { label: "2003", value: "Beyoncé – Crazy in Love" },
        ],
        note: "Wonderwall liegt richtig zwischen 1983 und 2003 und bleibt als Karte liegen.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Modus, Karten zum Sieg und Songs pro Spieler stellt der Host ein.",
        },
        INVITE.de,
        {
          title: "Hören und einordnen",
          text: "Jeder startet mit einem Startjahr. Pro Song wählt ihr die Lücke, in die er gehört.",
        },
      ],
      rules: [
        {
          title: "Startkarte",
          text: "Alle bekommen dasselbe zufällige Startjahr aus dem Bereich der gewählten Songs.",
        },
        {
          title: "Modus",
          text: "Alle gleichzeitig: Jeder ordnet jeden Song in die eigene Zeitleiste ein. Reihum: Pro Song ist einer dran.",
        },
        {
          title: "Richtig oder falsch",
          text: "Liegt der Song richtig, bleibt er als Karte liegen. Gleiches Jahr wie ein Nachbar zählt als richtig.",
        },
        {
          title: "Sieg",
          text: "Wer zuerst 4, 6, 8 oder 10 Karten hat, gewinnt. Ohne Limit wird gespielt, bis alle Songs durch sind.",
        },
      ],
      scoreTitle: "Wertung",
      scores: [
        { label: "Song richtig eingeordnet", value: "+1 Karte" },
        { label: "Song falsch eingeordnet", value: "keine Karte" },
        { label: "Punktestand", value: "Karten in der Zeitleiste" },
      ],
      faq: [
        {
          q: "Woher kommen die Songs?",
          a: "Jeder wählt Songs für den gemeinsamen Stapel aus. Abgespielt werden Hörproben über die Musiksuche von Apple (iTunes).",
        },
        {
          q: "Braucht man Karten oder ein Brettspiel?",
          a: "Nein. Die Zeitleiste liegt auf dem Handy, alles läuft im Browser.",
        },
        { q: "Wie viele Spieler können mitmachen?", a: "Zwei bis 16 Spieler pro Raum." },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Song Timeline: music game with friends | Cozynyte",
      metaDescription:
        "Place songs in order: everyone builds their own timeline, first to get enough cards right wins. Free in your browser, no sign-up.",
      ogTitle: "Song Timeline – online music game",
      ogDescription: "Listen to songs and place them in your own timeline. Free in your browser.",
      name: "Song Timeline",
      title: "Play Song Timeline online",
      titleAccent: "Song Timeline",
      intro:
        "Listen, guess the year and place the song in the right spot of your own timeline. First to get enough cards right wins.",
      facts: [
        "2–16 players",
        "4–10 cards to win",
        "Everyone at once or in turns",
        "1–10 songs per player",
      ],
      example: {
        title: "Your timeline",
        round: "Song 7 of 20",
        rows: [
          { label: "1979", value: "Start card" },
          { label: "1983", value: "Toto – Africa" },
          { label: "1995", value: "Oasis – Wonderwall", points: 1 },
          { label: "2003", value: "Beyoncé – Crazy in Love" },
        ],
        note: "Wonderwall fits between 1983 and 2003 and stays in your timeline.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. The host sets mode, cards to win and songs per player.",
        },
        INVITE.en,
        {
          title: "Listen and place",
          text: "Everyone starts with a start year. For each song you pick the gap it belongs in.",
        },
      ],
      rules: [
        {
          title: "Start card",
          text: "Everyone gets the same random start year from the range of the picked songs.",
        },
        {
          title: "Mode",
          text: "Everyone at once: each player places every song in their own timeline. In turns: one player per song.",
        },
        {
          title: "Right or wrong",
          text: "If the song is in the right spot, it stays as a card. Same year as a neighbour counts as right.",
        },
        {
          title: "Winning",
          text: "First to 4, 6, 8 or 10 cards wins. Without a limit you play until all songs are done.",
        },
      ],
      scoreTitle: "Scoring",
      scores: [
        { label: "Song placed correctly", value: "+1 card" },
        { label: "Song placed wrong", value: "no card" },
        { label: "Score", value: "cards in your timeline" },
      ],
      faq: [
        {
          q: "Where do the songs come from?",
          a: "Everyone adds songs to the shared deck. Previews are played via Apple's music search (iTunes).",
        },
        {
          q: "Do we need cards or a board game?",
          a: "No. Your timeline is on your phone, everything runs in the browser.",
        },
        { q: "How many people can play?", a: "Two to 16 players per room." },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  slf: {
    de: {
      metaTitle: "Stadt Land Fluss online mit Freunden spielen | Cozynyte",
      metaDescription:
        "Stadt Land Fluss kostenlos im Browser: Raum erstellen, Link teilen, losspielen. Eigene Kategorien, Zufall oder Aufsagen, gemeinsam abstimmen.",
      ogTitle: "Stadt Land Fluss online – Cozynyte",
      ogDescription:
        "Raum erstellen, Link teilen, Buchstabe auslosen. Kostenlos und ohne Anmeldung.",
      name: "Stadt Land Fluss",
      title: "Stadt Land Fluss online spielen",
      titleAccent: "Stadt Land Fluss",
      intro:
        "Mit Freunden im Browser, kostenlos und ohne Anmeldung. Raum erstellen, Link teilen, Buchstabe auslosen.",
      facts: ["2–16 Spieler", "3–10 Kategorien", "60–180 Sek. pro Runde", "3, 5, 8 oder 10 Runden"],
      example: {
        title: "Beispielrunde",
        badge: "M",
        round: "Runde 2 von 5",
        rows: [
          { label: "Stadt", value: "München", points: 5 },
          { label: "Land", value: "Mexiko", points: 10 },
          { label: "Fluss", value: "Main", points: 5 },
          { label: "Name", value: "Mila", points: 10 },
          { label: "Beruf", value: "Maurer", points: 20 },
          { label: "Tier", value: "Murmelfisch", points: 0 },
        ],
        note: "5 Punkte: jemand hat dasselbe. 20 Punkte: als Einzige eine gültige Antwort. 0: abgelehnt.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Kategorien, Runden und Zeit stellt der Host in der Lobby ein.",
        },
        INVITE.de,
        {
          title: "Schreiben und abstimmen",
          text: "Alle füllen die Kategorien aus, wer fertig ist, ruft Stopp. Danach stimmt ihr über fragliche Antworten ab.",
        },
      ],
      rules: [
        {
          title: "Buchstabe",
          text: "Per Zufall oder wie am Tisch: Einer geht im Kopf das Alphabet durch, ein anderer sagt Stopp. Q, X und Y lassen sich weglassen.",
        },
        {
          title: "Kategorien",
          text: "Stadt, Land, Fluss, Name, Beruf und Tier sind voreingestellt. Dazu Marke, Promi, Film/Serie und mehr oder eigene Kategorien.",
        },
        {
          title: "Stopp",
          text: "Nach dem Stopp haben die anderen noch fünf Sekunden, um ihr Wort zu Ende zu schreiben.",
        },
        {
          title: "Abstimmung",
          text: "Lehnt die Mehrheit eine Antwort ab, zählt sie nicht. Falsche Anfangsbuchstaben werden automatisch aussortiert.",
        },
      ],
      scoreTitle: "Punkte",
      scores: [
        { label: "Einzige gültige Antwort in der Kategorie", value: "20" },
        { label: "Antwort, die sonst keiner hat", value: "10" },
        { label: "Gleiche Antwort wie jemand anderes", value: "5" },
        { label: "Leer, falscher Buchstabe oder abgelehnt", value: "0" },
      ],
      faq: [
        {
          q: "Kann man Stadt Land Fluss online mit Freunden spielen?",
          a: "Ja. Einer erstellt einen Raum und schickt den Link, alle anderen treten im Browser bei. Es braucht keine App und kein Konto.",
        },
        { q: "Wie viele Spieler können mitmachen?", a: "Zwei bis 16 Spieler pro Raum." },
        {
          q: "Kann man eigene Kategorien verwenden?",
          a: "Ja. Drei bis zehn Kategorien pro Spiel, eigene mit bis zu 24 Zeichen.",
        },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Name Place Animal Thing online with friends | Cozynyte",
      metaDescription:
        "Play Name Place Animal Thing (Stadt Land Fluss) free in your browser: create a room, share the link, pick a letter. Custom categories and voting, no sign-up.",
      ogTitle: "Name Place Animal Thing online – Cozynyte",
      ogDescription: "Create a room, share the link, pick a letter. Free and no sign-up.",
      name: "Name, Place, Animal, Thing",
      title: "Play Name, Place, Animal, Thing online",
      titleAccent: "Name, Place, Animal, Thing",
      intro:
        "The German classic “Stadt Land Fluss” in your browser. Free, no sign-up: create a room, share the link, pick a letter.",
      facts: ["2–16 players", "3–10 categories", "60–180 s per round", "3, 5, 8 or 10 rounds"],
      example: {
        title: "Example round",
        badge: "M",
        round: "Round 2 of 5",
        rows: [
          { label: "City", value: "Madrid", points: 5 },
          { label: "Country", value: "Mexico", points: 10 },
          { label: "River", value: "Mississippi", points: 5 },
          { label: "First name", value: "Mia", points: 10 },
          { label: "Job", value: "Mechanic", points: 20 },
          { label: "Animal", value: "Mooseshark", points: 0 },
        ],
        note: "5 points: someone else had the same. 20 points: the only valid answer. 0: rejected.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. The host sets categories, rounds and time in the lobby.",
        },
        INVITE.en,
        {
          title: "Write and vote",
          text: "Everyone fills in the categories, whoever is done calls stop. Then you vote on doubtful answers.",
        },
      ],
      rules: [
        {
          title: "Letter",
          text: "Random, or like at the table: one player runs through the alphabet in their head, another says stop. Q, X and Y can be left out.",
        },
        {
          title: "Categories",
          text: "City, country, river, first name, job and animal are preset. Add brand, celebrity, movie/TV show and more, or your own.",
        },
        {
          title: "Stop",
          text: "After someone calls stop, the others get five more seconds to finish their word.",
        },
        {
          title: "Voting",
          text: "If the majority rejects an answer, it doesn't count. Answers with the wrong first letter are sorted out automatically.",
        },
      ],
      scoreTitle: "Points",
      scores: [
        { label: "Only valid answer in the category", value: "20" },
        { label: "Answer nobody else has", value: "10" },
        { label: "Same answer as someone else", value: "5" },
        { label: "Empty, wrong letter or rejected", value: "0" },
      ],
      faq: [
        {
          q: "Can we play Name, Place, Animal, Thing online with friends?",
          a: "Yes. One person creates a room and shares the link, everyone else joins in the browser. No app or account needed.",
        },
        { q: "How many people can play?", a: "Two to 16 players per room." },
        {
          q: "Can we use our own categories?",
          a: "Yes. Three to ten categories per game, custom ones up to 24 characters.",
        },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  kniffel: {
    de: {
      metaTitle: "Kniffel online: Block und Würfel fürs Handy | Cozynyte",
      metaDescription:
        "Kniffel im Browser: digital würfeln oder mit echten Würfeln am Tisch spielen, alles wird automatisch gezählt. Bis zu 16 Spieler, kostenlos.",
      ogTitle: "Kniffel online – Block und Würfel",
      ogDescription: "Digital würfeln oder echte Würfel eintragen. Alles wird automatisch gezählt.",
      name: "Kniffel",
      title: "Kniffel online spielen",
      titleAccent: "Kniffel",
      intro:
        "Der Kniffelblock fürs Handy: digital würfeln oder mit echten Würfeln am Tisch spielen und eintragen. Summen und Bonus rechnet das Spiel.",
      facts: [
        "1–16 Spieler",
        "13 Felder pro Spieler",
        "Digital oder mit echten Würfeln",
        "Bonus ab 63 oben",
      ],
      example: {
        title: "Dein Block",
        round: "Runde 9 von 13",
        rows: [
          { label: "Sechser", value: "4 × 6", points: 24 },
          { label: "Full House", value: "3 × 2, 2 × 5", points: 25 },
          { label: "Gr. Straße", value: "1 2 3 4 5", points: 40 },
          { label: "Kniffel", value: "5 × 4", points: 50 },
          { label: "Bonus", value: "oben 65", points: 35 },
        ],
        note: "Feste Felder geben feste Punkte. Ab 63 Punkten im oberen Teil gibt es 35 Bonus.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Kniffel geht auch allein, zum Beispiel als Block für den Tisch.",
        },
        INVITE.de,
        {
          title: "Würfeln und eintragen",
          text: "Wer dran ist, würfelt bis zu dreimal und tippt dann im Block das Feld an. Danach ist der Nächste dran.",
        },
      ],
      rules: [
        {
          title: "Digital würfeln",
          text: "Becher gedrückt halten, schütteln, loslassen. Würfel antippen, um sie festzuhalten. Drei Würfe pro Zug.",
        },
        {
          title: "Echte Würfel",
          text: "In privaten Räumen könnt ihr am Tisch würfeln und die fünf Würfel antippen. Der Block zeigt, was der Wurf in jedem Feld bringt.",
        },
        {
          title: "Spieler ohne Handy",
          text: "Bekommen eine eigene Spalte. Eingetragen wird für sie von einem anderen Gerät aus.",
        },
        {
          title: "Öffentliche Räume",
          text: "Hier wird nur digital gewürfelt, jeder schreibt in die eigene Spalte und der Wert muss zum Wurf passen.",
        },
      ],
      scoreTitle: "Punkte",
      scores: [
        { label: "Einser bis Sechser", value: "Summe der Augenzahl" },
        { label: "Dreierpasch, Viererpasch, Chance", value: "alle Augen" },
        { label: "Full House", value: "25" },
        { label: "Kleine Straße / Große Straße", value: "30 / 40" },
        { label: "Kniffel", value: "50" },
        { label: "Bonus ab 63 im oberen Teil", value: "35" },
      ],
      faq: [
        {
          q: "Kann ich mit echten Würfeln spielen?",
          a: "Ja. In privaten Räumen auf „Mit echten Würfeln am Tisch spielen?“ tippen, dann tragt ihr eure Würfe ein.",
        },
        {
          q: "Kann man Kniffel allein spielen?",
          a: "Ja. Kniffel geht ab einem Spieler, mit bis zu 16 Spielern pro Raum.",
        },
        {
          q: "Muss jeder ein Handy haben?",
          a: "Nein. Spieler ohne Handy bekommen eine Spalte, in die ein anderer für sie einträgt.",
        },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Yahtzee online: score sheet and dice | Cozynyte",
      metaDescription:
        "Yahtzee in your browser: roll digital dice or play with real dice at the table, everything is added up. Up to 16 players, free.",
      ogTitle: "Yahtzee online – score sheet and dice",
      ogDescription: "Roll digital dice or enter real ones. Everything is added up for you.",
      name: "Yahtzee",
      title: "Play Yahtzee online",
      titleAccent: "Yahtzee",
      intro:
        "The Yahtzee score sheet for your phone: roll digital dice or play with real dice at the table. Totals and bonus are added up for you.",
      facts: [
        "1–16 players",
        "13 boxes per player",
        "Digital or real dice",
        "Bonus at 63 in the upper section",
      ],
      example: {
        title: "Your score sheet",
        round: "Turn 9 of 13",
        rows: [
          { label: "Sixes", value: "4 × 6", points: 24 },
          { label: "Full house", value: "3 × 2, 2 × 5", points: 25 },
          { label: "Lg. straight", value: "1 2 3 4 5", points: 40 },
          { label: "Yahtzee", value: "5 × 4", points: 50 },
          { label: "Bonus", value: "upper 65", points: 35 },
        ],
        note: "Fixed boxes give fixed points. 63 or more in the upper section adds a 35-point bonus.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. Yahtzee works solo too, for example as a score sheet for the table.",
        },
        INVITE.en,
        {
          title: "Roll and score",
          text: "On your turn, roll up to three times, then tap a box on the sheet. Then it's the next player's turn.",
        },
      ],
      rules: [
        {
          title: "Digital dice",
          text: "Hold the cup, shake, let go. Tap dice to keep them. Three rolls per turn.",
        },
        {
          title: "Real dice",
          text: "In private rooms you can roll at the table and tap in the five dice. The sheet shows what the roll is worth in every box.",
        },
        {
          title: "Players without a phone",
          text: "Get their own column. Someone else enters their scores from another device.",
        },
        {
          title: "Public rooms",
          text: "Digital dice only, everyone writes in their own column and the value has to match the roll.",
        },
      ],
      scoreTitle: "Points",
      scores: [
        { label: "Aces to sixes", value: "sum of that number" },
        { label: "Three/four of a kind, chance", value: "all dice" },
        { label: "Full house", value: "25" },
        { label: "Small / large straight", value: "30 / 40" },
        { label: "Yahtzee", value: "50" },
        { label: "Bonus at 63 in the upper section", value: "35" },
      ],
      faq: [
        {
          q: "Can I play with real dice?",
          a: "Yes. In private rooms, tap “Playing with real dice at the table?” and enter your rolls.",
        },
        {
          q: "Can I play Yahtzee solo?",
          a: "Yes. Yahtzee works from one player, with up to 16 players per room.",
        },
        {
          q: "Does everyone need a phone?",
          a: "No. Players without a phone get a column that someone else fills in for them.",
        },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  draw: {
    de: {
      metaTitle: "Montagsmaler online mit Freunden spielen | Cozynyte",
      metaDescription:
        "Montagsmaler im Browser: Einer zeichnet, alle anderen raten im Chat. Über 600 Begriffe oder eigene Begriffe zu einem Motto. Kostenlos, ohne Anmeldung.",
      ogTitle: "Montagsmaler online – Cozynyte",
      ogDescription: "Einer zeichnet, alle raten. Mit großer Begriffsliste oder eigenen Begriffen.",
      name: "Montagsmaler",
      title: "Montagsmaler online spielen",
      titleAccent: "Montagsmaler",
      intro:
        "Einer zeichnet, alle anderen raten im Chat. Mit über 600 Begriffen oder euren eigenen zu einem Motto. Kostenlos im Browser.",
      facts: [
        "2–16 Spieler",
        "2–5 Runden",
        "60, 80 oder 120 Sek. pro Zeichnung",
        "Über 600 Begriffe",
      ],
      example: {
        title: "Beispielzug",
        round: "Runde 1 von 3 · Leuchtturm",
        rows: [
          { label: "Ben", value: "Turm" },
          { label: "Lea", value: "Leuchtturm", points: 150 },
          { label: "Ben", value: "Leuchtturm", points: 115 },
          { label: "Mia", value: "zeichnet", points: 50 },
        ],
        note: "Schnelle Rater bekommen mehr, die ersten drei einen Platzbonus. Die Zeichnerin bekommt 25 pro Treffer.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Runden, Zeit, Sprache und Begriffe stellt der Host ein.",
        },
        INVITE.de,
        {
          title: "Zeichnen und raten",
          text: "Reihum wählt einer aus drei Begriffen und zeichnet. Die anderen tippen ihre Tipps in den Chat.",
        },
      ],
      rules: [
        {
          title: "Begriff wählen",
          text: "Der Zeichner hat 15 Sekunden für die Wahl aus drei Begriffen, sonst wird einer ausgesucht.",
        },
        {
          title: "Raten",
          text: "Richtige Tipps sieht niemand. Hat einer den Begriff, bleiben den anderen höchstens noch 20 Sekunden.",
        },
        {
          title: "Eigene Runde",
          text: "Jeder reicht 3, 5 oder 8 Begriffe zum Motto ein. Wer einen Begriff eingereicht hat, rät bei ihm nicht mit.",
        },
        {
          title: "Werkzeuge",
          text: "Stift in zwölf Farben und vier Stärken, Radierer, Füllen, Rückgängig und Alles löschen.",
        },
      ],
      scoreTitle: "Punkte",
      scores: [
        { label: "Begriff erraten", value: "50 + bis zu 100" },
        { label: "Platzbonus für die ersten drei", value: "30 / 20 / 10" },
        { label: "Zeichner, pro Treffer", value: "25" },
        { label: "Begriff eingereicht, pro Treffer", value: "15" },
      ],
      faq: [
        {
          q: "Kann man eigene Begriffe verwenden?",
          a: "Ja. In der „Eigenen Runde“ legt der Host ein Motto fest, jeder reicht Begriffe ein. Gezeichnet wird nur, was ihr euch ausgedacht habt.",
        },
        {
          q: "Gibt es die Begriffe auch auf Englisch?",
          a: "Ja. Die Standardliste gibt es auf Deutsch und Englisch, der Host wählt die Sprache.",
        },
        {
          q: "Kann man am Handy zeichnen?",
          a: "Ja. Gezeichnet wird mit dem Finger oder der Maus, die Fläche passt sich dem Gerät an.",
        },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Draw & Guess online with friends | Cozynyte",
      metaDescription:
        "Draw & Guess in your browser: one player draws, everyone else guesses in the chat. Over 600 words or your own for a theme. Free, no sign-up.",
      ogTitle: "Draw & Guess online – Cozynyte",
      ogDescription: "One draws, everyone guesses. With a big word list or your own words.",
      name: "Draw & Guess",
      title: "Play Draw & Guess online",
      titleAccent: "Draw & Guess",
      intro:
        "One player draws, everyone else guesses in the chat. With over 600 words or your own for a theme. Free in your browser.",
      facts: ["2–16 players", "2–5 rounds", "60, 80 or 120 s per drawing", "Over 600 words"],
      example: {
        title: "Example turn",
        round: "Round 1 of 3 · Lighthouse",
        rows: [
          { label: "Ben", value: "Tower" },
          { label: "Lea", value: "Lighthouse", points: 150 },
          { label: "Ben", value: "Lighthouse", points: 115 },
          { label: "Mia", value: "drawing", points: 50 },
        ],
        note: "Fast guessers score more, the first three get a place bonus. The drawer gets 25 per correct guess.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. The host sets rounds, time, language and words.",
        },
        INVITE.en,
        {
          title: "Draw and guess",
          text: "In turns, one player picks one of three words and draws it. The others type their guesses in the chat.",
        },
      ],
      rules: [
        {
          title: "Picking a word",
          text: "The drawer has 15 seconds to pick one of three words, otherwise one is picked for them.",
        },
        {
          title: "Guessing",
          text: "Correct guesses stay hidden. Once someone has it, the others have at most 20 seconds left.",
        },
        {
          title: "Our own words",
          text: "Everyone submits 3, 5 or 8 words for the theme. Whoever submitted a word doesn't guess it.",
        },
        {
          title: "Tools",
          text: "Pen in twelve colours and four sizes, eraser, fill, undo and clear all.",
        },
      ],
      scoreTitle: "Points",
      scores: [
        { label: "Word guessed", value: "50 + up to 100" },
        { label: "Place bonus for the first three", value: "30 / 20 / 10" },
        { label: "Drawer, per correct guess", value: "25" },
        { label: "Word submitted, per correct guess", value: "15" },
      ],
      faq: [
        {
          q: "Can we use our own words?",
          a: "Yes. In “Our own words” mode the host sets a theme and everyone submits words. Only those get drawn.",
        },
        {
          q: "Are the words available in German too?",
          a: "Yes. The standard list comes in English and German, the host picks the language.",
        },
        {
          q: "Can I draw on my phone?",
          a: "Yes. Draw with your finger or a mouse, the canvas adapts to your device.",
        },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  geo: {
    de: {
      metaTitle: "Länder-Quiz: Flaggen, Umrisse, Hauptstädte | Cozynyte",
      metaDescription:
        "Flaggen-Quiz, Umrisse und Hauptstädte aller 195 Länder: gegeneinander raten, getippt oder per Auswahl, nach Kontinent filterbar. Kostenlos im Browser.",
      ogTitle: "Länder-Quiz – Flaggen, Umrisse, Hauptstädte",
      ogDescription: "Flaggen, Landesumrisse und Hauptstädte erraten. Kostenlos im Browser.",
      name: "Länder-Quiz",
      title: "Länder-Quiz: Flaggen, Umrisse und Hauptstädte",
      titleAccent: "Länder-Quiz",
      intro:
        "Flaggen, Landesumrisse und Hauptstädte aller Länder der Welt erraten, gegeneinander und auf Zeit. Getippt oder per Auswahl, nach Kontinent filterbar.",
      facts: ["2–16 Spieler", "195 Länder", "10–30 Fragen", "10, 15 oder 20 Sek. pro Frage"],
      example: {
        title: "Hauptstadt von Australien",
        round: "Frage 4 von 15",
        rows: [
          { label: "Lea", value: "Canberra", points: 160 },
          { label: "Ben", value: "Canberra", points: 128 },
          { label: "Mia", value: "Sydney", points: 0 },
        ],
        note: "Je schneller richtig, desto mehr Punkte. Gutgeschrieben wird erst in der Auflösung.",
      },
      steps: [
        {
          title: "Raum erstellen",
          text: "Namen eingeben und Raum erstellen. Fragen, Region, Antwortart und Zeit stellt der Host ein.",
        },
        INVITE.de,
        {
          title: "Raten",
          text: "Alle bekommen dieselbe Frage gleichzeitig. Nach jeder Frage kommt die Auflösung mit Punkten.",
        },
      ],
      rules: [
        {
          title: "Fragen",
          text: "Flaggen, Umrisse, Hauptstädte oder gemischt. Nur bekannte Länder oder alle.",
        },
        {
          title: "Region",
          text: "Ganze Welt oder nur Europa, Asien, Afrika, Amerika oder Ozeanien.",
        },
        {
          title: "Tippen oder Auswahl",
          text: "Beim Tippen zählen Deutsch und Englisch, kleine Tippfehler sind okay. Bei der Auswahl zählt die erste Antwort.",
        },
        {
          title: "Hilfen",
          text: "Beim Tippen auf Wunsch Hinweise: Kontinent und Anfangsbuchstabe, bei Hauptstädten die ersten Buchstaben. Bei der Auswahl bis zu drei 50:50-Joker.",
        },
      ],
      scoreTitle: "Punkte",
      scores: [
        { label: "Richtige Antwort", value: "50 + bis zu 100" },
        { label: "Platzbonus für die ersten drei", value: "30 / 20 / 10" },
        { label: "Falsch oder keine Antwort", value: "0" },
      ],
      faq: [
        {
          q: "Welche Länder sind dabei?",
          a: "Alle 195 Länder der Welt. Für den Einstieg lässt sich das Quiz auf bekannte Länder beschränken.",
        },
        {
          q: "Kann man nur Flaggen raten?",
          a: "Ja. Der Host wählt Flaggen, Umrisse, Hauptstädte oder eine Mischung.",
        },
        {
          q: "Muss ich die Namen auf Deutsch eintippen?",
          a: "Nein. Deutsch und Englisch werden erkannt, kleine Tippfehler sind okay.",
        },
        VIDEO_CALL.de,
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Country quiz: flags, shapes and capitals | Cozynyte",
      metaDescription:
        "Flag quiz, country shapes and capitals of all 195 countries: play against friends, type or multiple choice, filter by continent. Free in your browser.",
      ogTitle: "Country Quiz – flags, shapes and capitals",
      ogDescription: "Guess flags, country shapes and capitals. Free in your browser.",
      name: "Country Quiz",
      title: "Country Quiz: flags, shapes and capitals",
      titleAccent: "Country Quiz",
      intro:
        "Guess flags, country shapes and capitals of every country in the world, against each other and against the clock. Type or multiple choice, filter by continent.",
      facts: ["2–16 players", "195 countries", "10–30 questions", "10, 15 or 20 s per question"],
      example: {
        title: "Capital of Australia",
        round: "Question 4 of 15",
        rows: [
          { label: "Lea", value: "Canberra", points: 160 },
          { label: "Ben", value: "Canberra", points: 128 },
          { label: "Mia", value: "Sydney", points: 0 },
        ],
        note: "The faster you're right, the more points. Points are added at the reveal.",
      },
      steps: [
        {
          title: "Create a room",
          text: "Enter your name and create a room. The host sets questions, region, answer type and time.",
        },
        INVITE.en,
        {
          title: "Guess",
          text: "Everyone gets the same question at the same time. Each question ends with a reveal and points.",
        },
      ],
      rules: [
        {
          title: "Questions",
          text: "Flags, shapes, capitals or mixed. Well-known countries only or all of them.",
        },
        {
          title: "Region",
          text: "The whole world or just Europe, Asia, Africa, the Americas or Oceania.",
        },
        {
          title: "Type or choose",
          text: "When typing, English and German both count and small typos are fine. In multiple choice your first answer counts.",
        },
        {
          title: "Help",
          text: "When typing, optional hints: continent and first letter, for capitals the first letters. In multiple choice up to three 50:50 jokers.",
        },
      ],
      scoreTitle: "Points",
      scores: [
        { label: "Correct answer", value: "50 + up to 100" },
        { label: "Place bonus for the first three", value: "30 / 20 / 10" },
        { label: "Wrong or no answer", value: "0" },
      ],
      faq: [
        {
          q: "Which countries are included?",
          a: "All 195 countries in the world. To start, you can limit the quiz to well-known countries.",
        },
        {
          q: "Can we guess only flags?",
          a: "Yes. The host picks flags, shapes, capitals or a mix.",
        },
        {
          q: "Do I have to type names in English?",
          a: "No. English and German are both recognised, small typos are fine.",
        },
        VIDEO_CALL.en,
        FREE.en,
      ],
    },
  },
  snippet: {
    de: {
      metaTitle: "Song-Schnipsel: Song erraten aus 0,1 Sekunden | Cozynyte",
      metaDescription:
        "Musikrätsel für eine Person: Erkenne den Song an 0,1 Sekunden. Nach jedem Fehlversuch hörst du mehr. Kostenlos im Browser, ohne Anmeldung.",
      ogTitle: "Song-Schnipsel – Song erraten aus 0,1 Sekunden",
      ogDescription: "Ein Song, sieben Versuche, zuerst 0,1 Sekunden. Kostenlos im Browser.",
      name: "Song-Schnipsel",
      title: "Song-Schnipsel: Erkennst du den Song?",
      titleAccent: "Song-Schnipsel",
      intro:
        "Du hörst zuerst 0,1 Sekunden eines bekannten Songs. Nach jedem Fehlversuch oder Überspringen wird der Ausschnitt länger. Jeden Tag ein neuer Song, für alle derselbe. Für eine Person, ohne Anmeldung.",
      facts: [
        "1 Spieler",
        "7 Versuche",
        "0,1 bis 12 Sek.",
        "Song des Tages",
        "Hörproben über iTunes",
      ],
      example: {
        title: "Beispielrunde",
        round: "Song 4",
        rows: [
          { label: "0,1 s", value: "Übersprungen" },
          { label: "0,5 s", value: "Somebody Told Me – The Killers" },
          { label: "1 s", value: "Mr. Brightside – The Killers" },
        ],
        note: "Gelb heißt: richtiger Interpret, anderer Song.",
      },
      steps: [
        {
          title: "Anhören",
          text: "Spiel den Ausschnitt ab, so oft du willst. Am Anfang sind es 0,1 Sekunden.",
        },
        {
          title: "Raten oder überspringen",
          text: "Such den Song und wähl ihn aus der Liste. Falsch oder übersprungen: Der Ausschnitt wird länger.",
        },
        {
          title: "Auflösung",
          text: "Nach dem Treffer oder dem siebten Versuch siehst du den Song und kannst die ganze Hörprobe hören.",
        },
      ],
      rules: [
        {
          title: "Stufen",
          text: "0,1 · 0,5 · 1 · 2 · 4 · 7 · 12 Sekunden. Jeder Ausschnitt beginnt an derselben Stelle.",
        },
        {
          title: "Raten",
          text: "Nur Songs aus der Suche. Andere Versionen desselben Songs (Remaster, Album, Single) zählen als richtig.",
        },
        {
          title: "Interpret stimmt",
          text: "Gelb heißt: richtiger Interpret, anderer Song. Der Versuch ist trotzdem verbraucht.",
        },
        {
          title: "Song des Tages",
          text: "Jeden Tag ein bekannter Song, für alle derselbe, ein Versuch pro Tag. Neuer Song um 0 Uhr MEZ (im Sommer MESZ). Die Tagesserie zählt Tage am Stück, an denen du ihn erraten hast.",
        },
        {
          title: "Archiv und Vergleich",
          text: "Frühere Songs des Tages kannst du im Archiv nachspielen (zählt nicht für die Tagesserie). Nach der Auflösung siehst du, bei welcher Stufe alle anderen den Song erkannt haben.",
        },
        {
          title: "Tastatur",
          text: "Leertaste spielt ab, Enter rät, Tab im leeren Suchfeld überspringt.",
        },
      ],
      scoreTitle: "Ergebnis und Serie",
      scores: [
        { label: "Ergebnis", value: "Versuche, z. B. 3/7" },
        { label: "Nicht erraten", value: "X/7" },
        { label: "Tagesserie", value: "Tage am Stück erraten" },
        { label: "Vergleich", value: "Anteil aller Spieler je Stufe" },
        { label: "Archiv", value: "zählt nicht für die Serie" },
      ],
      faq: [
        {
          q: "Woher kommen die Songs?",
          a: "Aus einer festen Liste bekannter Hits aus mehreren Jahrzehnten, international und deutsch. Abgespielt werden Hörproben über die Musiksuche von Apple (iTunes).",
        },
        {
          q: "Wann gibt es den nächsten Song des Tages?",
          a: "Um 0 Uhr MEZ, im Sommer MESZ. Bis dahin kannst du im Archiv frühere Tage nachspielen.",
        },
        {
          q: "Warum beginnt der Ausschnitt nicht am Anfang des Songs?",
          a: "Apple stellt 30 Sekunden lange Hörproben bereit, meist aus der Mitte oder dem Refrain. Daraus stammen die Ausschnitte.",
        },
        {
          q: "Braucht man ein Konto?",
          a: "Nein. Die Statistik wird nur in deinem Browser gespeichert.",
        },
        {
          q: "Kann man das auch zusammen spielen?",
          a: "Song-Schnipsel ist für eine Person. Für mehrere gibt es Song erraten, Jahr schätzen und die Song-Zeitleiste.",
        },
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Song Snippet: guess the song from 0.1 seconds | Cozynyte",
      metaDescription:
        "Music puzzle for one: name the song from 0.1 seconds. Every wrong guess or skip plays a little more. Free in your browser, no sign-up.",
      ogTitle: "Song Snippet – guess the song from 0.1 seconds",
      ogDescription: "One song, seven attempts, starting at 0.1 seconds. Free in your browser.",
      name: "Song Snippet",
      title: "Song Snippet: can you name the song?",
      titleAccent: "Song Snippet",
      intro:
        "You hear just 0.1 seconds of a well-known song. Every wrong guess or skip makes the snippet longer. A new song every day, the same for everyone. For one player, no sign-up.",
      facts: ["1 player", "7 attempts", "0.1 to 12 s", "Song of the day", "Previews via iTunes"],
      example: {
        title: "Example round",
        round: "Song 4",
        rows: [
          { label: "0.1 s", value: "Skipped" },
          { label: "0.5 s", value: "Somebody Told Me – The Killers" },
          { label: "1 s", value: "Mr. Brightside – The Killers" },
        ],
        note: "Yellow means right artist, different song.",
      },
      steps: [
        {
          title: "Listen",
          text: "Play the snippet as often as you like. It starts at 0.1 seconds.",
        },
        {
          title: "Guess or skip",
          text: "Search for the song and pick it from the list. Wrong or skipped: the snippet gets longer.",
        },
        {
          title: "The answer",
          text: "After a correct guess or the seventh attempt you see the song and can play the full preview.",
        },
      ],
      rules: [
        {
          title: "Stages",
          text: "0.1 · 0.5 · 1 · 2 · 4 · 7 · 12 seconds. Every snippet starts at the same point.",
        },
        {
          title: "Guessing",
          text: "Only songs from the search. Other versions of the same song (remaster, album, single) count as correct.",
        },
        {
          title: "Right artist",
          text: "Yellow means right artist, different song. The attempt still counts.",
        },
        {
          title: "Song of the day",
          text: "A well-known song every day, the same for everyone, one go per day. A new song at midnight CET (CEST in summer). The daily streak counts the days in a row you got it.",
        },
        {
          title: "Archive and comparison",
          text: "Replay earlier songs of the day in the archive (doesn't count towards your daily streak). After the answer you see at which stage everyone else recognised the song.",
        },
        {
          title: "Keyboard",
          text: "Space plays, Enter guesses, Tab in the empty search skips.",
        },
      ],
      scoreTitle: "Result and streak",
      scores: [
        { label: "Result", value: "attempts, e.g. 3/7" },
        { label: "Not guessed", value: "X/7" },
        { label: "Daily streak", value: "days in a row guessed" },
        { label: "Comparison", value: "share of all players per stage" },
        { label: "Archive", value: "doesn't count for the streak" },
      ],
      faq: [
        {
          q: "Where do the songs come from?",
          a: "From a fixed list of well-known hits from several decades, international and German. They play as previews via Apple's music search (iTunes).",
        },
        {
          q: "When is the next song of the day?",
          a: "At midnight CET, CEST in summer (11 pm UK time). Until then you can replay earlier days in the archive.",
        },
        {
          q: "Why doesn't the snippet start at the beginning of the song?",
          a: "Apple provides 30-second previews, usually from the middle or the chorus. The snippets come from those.",
        },
        {
          q: "Do I need an account?",
          a: "No. Your stats are only stored in your browser.",
        },
        {
          q: "Can we play it together?",
          a: "Song Snippet is for one player. For groups there's Guess the Song, Guess the Year and Song Timeline.",
        },
        FREE.en,
      ],
    },
  },
  flag: {
    de: {
      metaTitle: "Flagge des Tages: Flaggenrätsel mit Farben | Cozynyte",
      metaDescription:
        "Tägliches Flaggenrätsel für eine Person: Jeder Tipp deckt auf, wo die Farben passen. Dazu Entfernung und Richtung zum gesuchten Land. Kostenlos im Browser, ohne Anmeldung.",
      ogTitle: "Flagge des Tages – das tägliche Flaggenrätsel",
      ogDescription: "Eine verdeckte Flagge, sieben Tipps. Kostenlos im Browser.",
      name: "Flagge des Tages",
      title: "Flagge des Tages: Welches Land ist es?",
      titleAccent: "Flagge des Tages",
      intro:
        "Die Flagge ist verdeckt. Jeder Tipp legt die Flagge des getippten Landes darüber: Wo an derselben Stelle dieselbe Farbe ist, wird die gesuchte sichtbar. Dazu siehst du Entfernung und Richtung. Jeden Tag eine neue Flagge, für alle dieselbe.",
      facts: ["1 Spieler", "7 Versuche", "195 Länder", "Flagge des Tages", "Archiv"],
      example: {
        title: "Beispielrunde",
        round: "Tipp 3",
        rows: [
          { label: "Portugal", value: "7.300 km ↙ · 64 %" },
          { label: "Kolumbien", value: "2.800 km ↘ · 86 %" },
          { label: "Brasilien", value: "Richtig" },
        ],
        note: "Die Prozent zeigen, wie nah das getippte Land am gesuchten liegt.",
      },
      steps: [
        {
          title: "Land tippen",
          text: "Such ein Land und wähl es aus der Liste. Am Anfang ist die Flagge ganz verdeckt.",
        },
        {
          title: "Farben aufdecken",
          text: "Wo die Flagge deines Tipps dieselbe Farbe hat wie die gesuchte, wird diese sichtbar. Pfeil und Entfernung zeigen, wo das Land liegt.",
        },
        {
          title: "Auflösung",
          text: "Nach dem Treffer, dem siebten Tipp oder dem Aufgeben siehst du die Flagge, das Land und wie alle anderen abgeschnitten haben.",
        },
      ],
      rules: [
        {
          title: "Farbvergleich",
          text: "Verglichen wird Stelle für Stelle auf einem feinen Raster. Ähnliche Töne (z. B. zwei Rot) zählen als dieselbe Farbe.",
        },
        {
          title: "Entfernung und Richtung",
          text: "Gemessen zwischen den Mittelpunkten der Länder. 100 % wäre das gesuchte Land, 0 % die andere Seite der Erde.",
        },
        {
          title: "Sieben Tipps",
          text: "Jedes Land nur einmal, Überspringen gibt es nicht. Aufgeben zeigt die Lösung sofort.",
        },
        {
          title: "Flagge des Tages",
          text: "Jeden Tag ein Land, für alle dasselbe. Neue Flagge um 0 Uhr MEZ (im Sommer MESZ). Die Tagesserie zählt Tage am Stück, an denen du sie erraten hast.",
        },
        {
          title: "Archiv und Vergleich",
          text: "Frühere Flaggen kannst du im Archiv nachspielen (zählt nicht für die Tagesserie). Nach der Auflösung siehst du, beim wievielten Tipp alle anderen sie erkannt haben.",
        },
        {
          title: "Hauptstadt-Bonus",
          text: "Nach der Auflösung gibt es eine Bonusfrage: die Hauptstadt des Landes, vier zur Auswahl, ein Versuch.",
        },
      ],
      scoreTitle: "Ergebnis und Serie",
      scores: [
        { label: "Ergebnis", value: "Versuche, z. B. 3/7" },
        { label: "Nicht erraten", value: "X/7" },
        { label: "Tagesserie", value: "Tage am Stück erraten" },
        { label: "Vergleich", value: "Anteil aller Spieler je Versuch" },
        { label: "Archiv", value: "zählt nicht für die Serie" },
      ],
      faq: [
        {
          q: "Welche Länder kommen vor?",
          a: "Alle 193 UN-Mitglieder, dazu Vatikanstadt und Palästina – bekannte und weniger bekannte im Wechsel.",
        },
        {
          q: "Wann gibt es die nächste Flagge des Tages?",
          a: "Um 0 Uhr MEZ, im Sommer MESZ. Bis dahin kannst du im Archiv frühere Tage nachspielen.",
        },
        {
          q: "Kann ich auf Englisch tippen?",
          a: "Ja. Die Suche kennt deutsche und englische Ländernamen.",
        },
        {
          q: "Braucht man ein Konto?",
          a: "Nein. Die Statistik wird nur in deinem Browser gespeichert.",
        },
        {
          q: "Kann man das auch zusammen spielen?",
          a: "Die Flagge des Tages ist für eine Person. Für mehrere gibt es das Länder-Quiz mit Flaggen, Umrissen und Hauptstädten.",
        },
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Flag of the Day: daily flag puzzle with colours | Cozynyte",
      metaDescription:
        "Daily flag puzzle for one: every guess reveals where the colours match, plus distance and direction to the hidden country. Free in your browser, no sign-up.",
      ogTitle: "Flag of the Day – the daily flag puzzle",
      ogDescription: "One hidden flag, seven guesses. Free in your browser.",
      name: "Flag of the Day",
      title: "Flag of the Day: which country is it?",
      titleAccent: "Flag of the Day",
      intro:
        "The flag is hidden. Every guess lays the flag of your country over it: wherever the colour matches in the same spot, the hidden flag shows. You also see distance and direction. A new flag every day, the same for everyone.",
      facts: ["1 player", "7 attempts", "195 countries", "Flag of the day", "Archive"],
      example: {
        title: "Example round",
        round: "Guess 3",
        rows: [
          { label: "Portugal", value: "7,300 km ↙ · 64 %" },
          { label: "Colombia", value: "2,800 km ↘ · 86 %" },
          { label: "Brazil", value: "Correct" },
        ],
        note: "The percentage shows how close your guess is to the hidden country.",
      },
      steps: [
        {
          title: "Guess a country",
          text: "Search for a country and pick it from the list. At the start the flag is completely hidden.",
        },
        {
          title: "Uncover colours",
          text: "Wherever your guess has the same colour as the hidden flag, that part shows. Arrow and distance point to the country.",
        },
        {
          title: "The answer",
          text: "After a correct guess, the seventh guess or giving up you see the flag, the country and how everyone else did.",
        },
      ],
      rules: [
        {
          title: "Colour match",
          text: "Compared spot by spot on a fine grid. Similar shades (two reds, say) count as the same colour.",
        },
        {
          title: "Distance and direction",
          text: "Measured between the centres of the countries. 100 % would be the hidden country, 0 % the other side of the earth.",
        },
        {
          title: "Seven guesses",
          text: "Each country only once, no skipping. Giving up shows the answer straight away.",
        },
        {
          title: "Flag of the day",
          text: "One country a day, the same for everyone. A new flag at midnight CET (CEST in summer). The daily streak counts the days in a row you got it.",
        },
        {
          title: "Archive and comparison",
          text: "Replay earlier flags in the archive (doesn't count towards your daily streak). After the answer you see on which guess everyone else got it.",
        },
        {
          title: "Capital bonus",
          text: "After the answer there's a bonus question: the country's capital, four to choose from, one try.",
        },
      ],
      scoreTitle: "Result and streak",
      scores: [
        { label: "Result", value: "attempts, e.g. 3/7" },
        { label: "Not guessed", value: "X/7" },
        { label: "Daily streak", value: "days in a row guessed" },
        { label: "Comparison", value: "share of all players per attempt" },
        { label: "Archive", value: "doesn't count for the streak" },
      ],
      faq: [
        {
          q: "Which countries are included?",
          a: "All 193 UN members plus Vatican City and Palestine – well-known and lesser-known ones taking turns.",
        },
        {
          q: "When is the next flag of the day?",
          a: "At midnight CET, CEST in summer (11 pm UK time). Until then you can replay earlier days in the archive.",
        },
        {
          q: "Can I type country names in German?",
          a: "Yes. The search knows English and German names.",
        },
        {
          q: "Do I need an account?",
          a: "No. Your stats are only stored in your browser.",
        },
        {
          q: "Can we play it together?",
          a: "Flag of the Day is for one player. For groups there's the Country Quiz with flags, shapes and capitals.",
        },
        FREE.en,
      ],
    },
  },
  outline: {
    de: {
      metaTitle: "Umriss des Tages: Welches Land ist das? | Cozynyte",
      metaDescription:
        "Tägliches Länderrätsel für eine Person: Erkenne das Land an seinem Umriss. Jeder Tipp zeigt Entfernung und Richtung. Kostenlos im Browser, ohne Anmeldung.",
      ogTitle: "Umriss des Tages – das tägliche Länderrätsel",
      ogDescription: "Ein Landesumriss, sieben Tipps. Kostenlos im Browser.",
      name: "Umriss des Tages",
      title: "Umriss des Tages: Welches Land ist es?",
      titleAccent: "Umriss des Tages",
      intro:
        "Du siehst den Umriss eines Landes. Tipp, welches es ist: Zu jedem falschen Tipp siehst du, wie weit und in welcher Richtung das gesuchte Land liegt. Jeden Tag ein neuer Umriss, für alle derselbe.",
      facts: ["1 Spieler", "7 Versuche", "165 Länder", "Umriss des Tages", "Archiv"],
      example: {
        title: "Beispielrunde",
        round: "Tipp 3",
        rows: [
          { label: "Italien", value: "1.500 km ← · 93 %" },
          { label: "Frankreich", value: "900 km ↙ · 96 %" },
          { label: "Spanien", value: "Richtig" },
        ],
        note: "Die Prozent zeigen, wie nah das getippte Land am gesuchten liegt.",
      },
      steps: [
        {
          title: "Umriss ansehen",
          text: "Der Umriss ist von Anfang an ganz zu sehen, ohne Nachbarländer und ohne Maßstab.",
        },
        {
          title: "Land tippen",
          text: "Such ein Land und wähl es aus der Liste. Pfeil und Entfernung zeigen, wo das gesuchte Land liegt.",
        },
        {
          title: "Auflösung",
          text: "Nach dem Treffer, dem siebten Tipp oder dem Aufgeben siehst du das Land, wie alle anderen abgeschnitten haben und die Bonusfrage zur Hauptstadt.",
        },
      ],
      rules: [
        {
          title: "Entfernung und Richtung",
          text: "Gemessen zwischen den Mittelpunkten der Länder. 100 % wäre das gesuchte Land, 0 % die andere Seite der Erde.",
        },
        {
          title: "Sieben Tipps",
          text: "Jedes Land nur einmal, Überspringen gibt es nicht. Aufgeben zeigt die Lösung sofort.",
        },
        {
          title: "Umriss des Tages",
          text: "Jeden Tag ein Land, für alle dasselbe. Neuer Umriss um 0 Uhr MEZ (im Sommer MESZ). Die Tagesserie zählt Tage am Stück, an denen du es erraten hast.",
        },
        {
          title: "Archiv und Vergleich",
          text: "Frühere Umrisse kannst du im Archiv nachspielen (zählt nicht für die Tagesserie). Nach der Auflösung siehst du, beim wievielten Tipp alle anderen das Land erkannt haben.",
        },
        {
          title: "Hauptstadt-Bonus",
          text: "Nach der Auflösung gibt es eine Bonusfrage: die Hauptstadt des Landes, vier zur Auswahl, ein Versuch.",
        },
      ],
      scoreTitle: "Ergebnis und Serie",
      scores: [
        { label: "Ergebnis", value: "Versuche, z. B. 3/7" },
        { label: "Nicht erraten", value: "X/7" },
        { label: "Tagesserie", value: "Tage am Stück erraten" },
        { label: "Vergleich", value: "Anteil aller Spieler je Versuch" },
        { label: "Archiv", value: "zählt nicht für die Serie" },
      ],
      faq: [
        {
          q: "Welche Länder kommen vor?",
          a: "Alle Länder, deren Umriss man erkennen kann – sehr kleine Inselstaaten und Stadtstaaten nicht. Tippen kannst du jedes Land.",
        },
        {
          q: "Wann gibt es den nächsten Umriss des Tages?",
          a: "Um 0 Uhr MEZ, im Sommer MESZ. Bis dahin kannst du im Archiv frühere Tage nachspielen.",
        },
        {
          q: "Kann ich auf Englisch tippen?",
          a: "Ja. Die Suche kennt deutsche und englische Ländernamen.",
        },
        {
          q: "Braucht man ein Konto?",
          a: "Nein. Die Statistik wird nur in deinem Browser gespeichert.",
        },
        {
          q: "Kann man das auch zusammen spielen?",
          a: "Der Umriss des Tages ist für eine Person. Für mehrere gibt es das Länder-Quiz mit Flaggen, Umrissen und Hauptstädten.",
        },
        FREE.de,
      ],
    },
    en: {
      metaTitle: "Shape of the Day: which country is it? | Cozynyte",
      metaDescription:
        "Daily country puzzle for one: name the country from its shape. Every guess shows distance and direction. Free in your browser, no sign-up.",
      ogTitle: "Shape of the Day – the daily country puzzle",
      ogDescription: "One country shape, seven guesses. Free in your browser.",
      name: "Shape of the Day",
      title: "Shape of the Day: which country is it?",
      titleAccent: "Shape of the Day",
      intro:
        "You see the outline of a country. Guess which one it is: every wrong guess shows how far away the country is and in which direction. A new shape every day, the same for everyone.",
      facts: ["1 player", "7 attempts", "165 countries", "Shape of the day", "Archive"],
      example: {
        title: "Example round",
        round: "Guess 3",
        rows: [
          { label: "Italy", value: "1,500 km ← · 93 %" },
          { label: "France", value: "900 km ↙ · 96 %" },
          { label: "Spain", value: "Correct" },
        ],
        note: "The percentage shows how close your guess is to the hidden country.",
      },
      steps: [
        {
          title: "Look at the shape",
          text: "The whole outline is visible from the start, without neighbours and without scale.",
        },
        {
          title: "Guess a country",
          text: "Search for a country and pick it from the list. Arrow and distance point to the hidden country.",
        },
        {
          title: "The answer",
          text: "After a correct guess, the seventh guess or giving up you see the country, how everyone else did and the capital bonus question.",
        },
      ],
      rules: [
        {
          title: "Distance and direction",
          text: "Measured between the centres of the countries. 100 % would be the hidden country, 0 % the other side of the earth.",
        },
        {
          title: "Seven guesses",
          text: "Each country only once, no skipping. Giving up shows the answer straight away.",
        },
        {
          title: "Shape of the day",
          text: "One country a day, the same for everyone. A new shape at midnight CET (CEST in summer). The daily streak counts the days in a row you got it.",
        },
        {
          title: "Archive and comparison",
          text: "Replay earlier shapes in the archive (doesn't count towards your daily streak). After the answer you see on which guess everyone else got it.",
        },
        {
          title: "Capital bonus",
          text: "After the answer there's a bonus question: the country's capital, four to choose from, one try.",
        },
      ],
      scoreTitle: "Result and streak",
      scores: [
        { label: "Result", value: "attempts, e.g. 3/7" },
        { label: "Not guessed", value: "X/7" },
        { label: "Daily streak", value: "days in a row guessed" },
        { label: "Comparison", value: "share of all players per attempt" },
        { label: "Archive", value: "doesn't count for the streak" },
      ],
      faq: [
        {
          q: "Which countries are included?",
          a: "Every country with a recognisable shape – very small island and city states are left out. You can guess any country.",
        },
        {
          q: "When is the next shape of the day?",
          a: "At midnight CET, CEST in summer (11 pm UK time). Until then you can replay earlier days in the archive.",
        },
        {
          q: "Can I type country names in German?",
          a: "Yes. The search knows English and German names.",
        },
        {
          q: "Do I need an account?",
          a: "No. Your stats are only stored in your browser.",
        },
        {
          q: "Can we play it together?",
          a: "Shape of the Day is for one player. For groups there's the Country Quiz with flags, shapes and capitals.",
        },
        FREE.en,
      ],
    },
  },
};

export const GAME_SEO = Object.fromEntries(
  Object.entries(TEXTS).map(([page, texts]) => [
    page,
    { de: { ...COMMON.de, ...texts.de }, en: { ...COMMON.en, ...texts.en } },
  ]),
) as Record<GamePageId, Record<SeoLanguage, GamePageText>>;
