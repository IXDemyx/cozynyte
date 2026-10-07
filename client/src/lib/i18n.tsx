import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "de" | "en";

const de = {
  you: "(du)",
  players: "Spieler",
  points: "Punkte",
  kick: (name: string) => `${name} entfernen`,
  kickConfirm: "Entfernen?",
  nav: {
    light: "Helles Design",
    dark: "Dunkles Design",
    switchLanguage: "Switch to English",
  },
  home: {
    meta: "2–16 Spieler",
    songText: "Jeder wählt Songs aus, alle raten Titel und Interpret.",
    yearText: "Jeder wählt Songs aus, alle schätzen das Erscheinungsjahr.",
    joinTitle: "Raum beitreten",
    drawText: "Einer zeichnet, alle anderen raten.",
    name: "Dein Name",
    namePlaceholder: "z. B. Daniel",
    create: "Raum erstellen",
    or: "oder",
    code: "Raumcode",
    join: "Beitreten",
    soon: "bald",
  },
  room: {
    room: "Raum",
    askName: "Wie heißt du?",
    failed: "Das hat nicht geklappt",
    toHome: "Zur Startseite",
    connecting: (code: string) => `Verbinde mit Raum ${code} …`,
  },
  lobby: {
    game: "Spiel",
    showSong: "Titel und Interpret während der Runde",
    showSongOn: "Anzeigen",
    showSongOff: "Nur hören",
    copy: "Einladungslink kopieren",
    copied: "Kopiert",
    songsPerPlayer: "Songs pro Spieler",
    timePerSong: "Zeit pro Song",
    theme: "Motto",
    themePlaceholder: "z. B. Nur 2000er (optional)",
    noTheme: "Kein Motto festgelegt",
    start: "Spiel starten",
    waitingPlayers: "Warte auf mindestens einen weiteren Spieler …",
    waitingHost: "Der Host startet das Spiel gleich …",
  },
  picking: {
    eyebrow: "Songauswahl",
    title: (n: number) => (n === 1 ? "Wähle deinen Song" : `Wähle deine ${n} Songs`),
    hint: "Die anderen sehen deine Auswahl nicht. Du bekommst Punkte, wenn deine Songs erraten werden – zu schwer lohnt sich also nicht.",
    hintYear: "Die anderen sehen deine Auswahl nicht. Du bekommst Punkte, wenn sie höchstens 2 Jahre danebenliegen. Schau aufs angezeigte Jahr: Bei Neuauflagen nennt iTunes manchmal ein späteres.",
    done: "Fertig! Warte auf die anderen …",
    search: "Song suchen",
    searchPlaceholder: "Titel oder Interpret suchen …",
    pick: "Wählen",
    remove: (title: string) => `${title} entfernen`,
    listen: (title: string) => `${title} anhören`,
    nothing: "Nichts gefunden.",
    suggestions: "Keine Idee? Vorschläge:",
    categories: {
      surprise: "Überrasch mich",
      current: "Aktuell",
      pop: "Pop",
      rock: "Rock",
      hiphop: "Hip-Hop",
      german: "Deutsch",
      "80s": "80er",
      "90s": "90er",
      "2000s": "2000er",
      electronic: "Elektro",
    } as Record<string, string>,
    ready: "bereit",
    go: "Los geht's",
    force: "Trotzdem starten",
    forceHint: "Startet mit den bisher gewählten Songs.",
  },
  round: {
    song: (i: number, n: number) => `Song ${i} / ${n}`,
    mask: "Länge des Titels",
    yourSong: "Das ist dein Song.",
    yourSongRest: "Lehn dich zurück – du bekommst Punkte für jeden, der ihn errät.",
    title: "Titel",
    artist: "Interpret",
    input: "Dein Tipp",
    placeholderGuess: "Titel oder Interpret eintippen …",
    placeholderArtist: "Und wer singt das?",
    placeholderChat: "Alles erraten – jetzt kannst du chatten …",
    placeholderPicker: "Mit den anderen chatten …",
    guess: "Raten",
    send: "Senden",
    empty: "Noch keine Tipps …",
    skip: "Song überspringen",
    gotTitle: (name: string, me: boolean) =>
      me ? "Du hast den Titel erraten!" : `${name} hat den Titel erraten!`,
    gotArtist: (name: string, me: boolean) =>
      me ? "Du hast den Interpreten erraten!" : `${name} hat den Interpreten erraten!`,
    close: (name: string, me: boolean) =>
      me ? "Du bist ganz nah dran …" : `${name} ist ganz nah dran …`,
  },
  year: {
    question: "Aus welchem Jahr ist der Song?",
    hidden: "Titel und Interpret sind verdeckt",
    input: "Jahr",
    submit: "Tipp abgeben",
    yourGuess: "Dein Tipp",
    waiting: "Warte auf die anderen …",
    yourSongRest: (year: number | undefined) =>
      `Erschienen ${year ?? "?"}. Du bekommst Punkte für jeden, der höchstens 2 Jahre danebenliegt.`,
    locked: (name: string, me: boolean) => (me ? "Du hast getippt." : `${name} hat getippt.`),
    chat: "Nachricht schreiben …",
  },
  reveal: {
    eyebrow: (i: number, n: number) => `Auflösung · Song ${i} / ${n}`,
    cover: (name: string) => `Cover von ${name}`,
    pickedBy: "Ausgewählt von",
    someone: "jemandem",
    next: "Nächster Song",
    toFinal: "Zum Endstand",
    auto: (s: number) => `automatisch in ${s}s`,
    countdown: (label: string, s: number) => `${label} in ${s}s`,
  },
  final: {
    eyebrow: "Endstand",
    tie: "Unentschieden: ",
    wins: (count: number): string => (count > 1 ? " gewinnen!" : " gewinnt!"),
    again: "Nochmal spielen",
    lobby: "Zurück zur Lobby",
    waitingHost: "Der Host entscheidet, wie es weitergeht …",
  },
  audio: {
    enable: "Ton aktivieren",
    volume: "Lautstärke",
    pause: "Pause",
  },
  errors: {
    name_required: "Bitte gib zuerst einen Namen ein.",
    code_length: "Der Raumcode hat 4 Buchstaben.",
    server_unreachable: "Der Server ist nicht erreichbar.",
    room_not_found: "Diesen Raum gibt es nicht (mehr).",
    room_full: "Der Raum ist voll.",
    game_running: "Das Spiel läuft bereits. Warte auf die nächste Partie.",
    need_two_players: "Ihr braucht mindestens 2 Spieler.",
    need_two_pickers: "Mindestens 2 Spieler müssen einen Song gewählt haben.",
    search_unavailable: "Die Songsuche ist gerade nicht erreichbar.",
    track_not_found: "Song nicht gefunden – bitte neu suchen.",
    picks_full: "Du hast schon alle Songs gewählt.",
    track_taken: "Dieser Song wurde schon gewählt.",
    search_rate_limited: "Zu viele Suchanfragen – warte kurz und versuch es dann noch einmal.",
    kicked: "Der Host hat dich aus dem Raum entfernt.",
    track_no_year: "Für diesen Song ist kein Erscheinungsjahr bekannt.",
  } as Record<string, string>,
};

const en: typeof de = {
  you: "(you)",
  players: "Players",
  points: "Points",
  kick: (name) => `Remove ${name}`,
  kickConfirm: "Remove?",
  nav: {
    light: "Light theme",
    dark: "Dark theme",
    switchLanguage: "Auf Deutsch wechseln",
  },
  home: {
    meta: "2–16 players",
    songText: "Everyone picks songs, everyone guesses the title and artist.",
    yearText: "Everyone picks songs, everyone guesses the release year.",
    joinTitle: "Join a room",
    drawText: "One player draws, everyone else guesses.",
    name: "Your name",
    namePlaceholder: "e.g. Daniel",
    create: "Create room",
    or: "or",
    code: "Room code",
    join: "Join",
    soon: "soon",
  },
  room: {
    room: "Room",
    askName: "What's your name?",
    failed: "That didn't work",
    toHome: "Back to home",
    connecting: (code) => `Connecting to room ${code} …`,
  },
  lobby: {
    game: "Game",
    showSong: "Title and artist during the round",
    showSongOn: "Show",
    showSongOff: "Audio only",
    copy: "Copy invite link",
    copied: "Copied",
    songsPerPlayer: "Songs per player",
    timePerSong: "Time per song",
    theme: "Theme",
    themePlaceholder: "e.g. 2000s only (optional)",
    noTheme: "No theme set",
    start: "Start game",
    waitingPlayers: "Waiting for at least one more player …",
    waitingHost: "The host will start the game shortly …",
  },
  picking: {
    eyebrow: "Song selection",
    title: (n) => (n === 1 ? "Pick your song" : `Pick your ${n} songs`),
    hint: "The others can't see your picks. You earn points when your songs are guessed – so don't make them too hard.",
    hintYear: "The others can't see your picks. You earn points when they are at most 2 years off. Check the year shown: for re-releases iTunes sometimes gives a later one.",
    done: "Done! Waiting for the others …",
    search: "Search for a song",
    searchPlaceholder: "Search by title or artist …",
    pick: "Pick",
    remove: (title) => `Remove ${title}`,
    listen: (title) => `Listen to ${title}`,
    nothing: "Nothing found.",
    suggestions: "No idea? Suggestions:",
    categories: {
      surprise: "Surprise me",
      current: "Current",
      pop: "Pop",
      rock: "Rock",
      hiphop: "Hip-hop",
      german: "German",
      "80s": "80s",
      "90s": "90s",
      "2000s": "2000s",
      electronic: "Electronic",
    },
    ready: "ready",
    go: "Let's go",
    force: "Start anyway",
    forceHint: "Starts with the songs picked so far.",
  },
  round: {
    song: (i, n) => `Song ${i} / ${n}`,
    mask: "Length of the title",
    yourSong: "This is your song.",
    yourSongRest: "Sit back – you earn points for everyone who guesses it.",
    title: "Title",
    artist: "Artist",
    input: "Your guess",
    placeholderGuess: "Type the title or artist …",
    placeholderArtist: "And who's the artist?",
    placeholderChat: "All guessed – now you can chat …",
    placeholderPicker: "Chat with the others …",
    guess: "Guess",
    send: "Send",
    empty: "No guesses yet …",
    skip: "Skip song",
    gotTitle: (name, me) => (me ? "You guessed the title!" : `${name} guessed the title!`),
    gotArtist: (name, me) => (me ? "You guessed the artist!" : `${name} guessed the artist!`),
    close: (name, me) => (me ? "You're really close …" : `${name} is really close …`),
  },
  year: {
    question: "What year is this song from?",
    hidden: "Title and artist are hidden",
    input: "Year",
    submit: "Lock in guess",
    yourGuess: "Your guess",
    waiting: "Waiting for the others …",
    yourSongRest: (year) =>
      `Released ${year ?? "?"}. You earn points for everyone who is at most 2 years off.`,
    locked: (name, me) => (me ? "You locked in a guess." : `${name} locked in a guess.`),
    chat: "Write a message …",
  },
  reveal: {
    eyebrow: (i, n) => `Reveal · Song ${i} / ${n}`,
    cover: (name) => `Cover of ${name}`,
    pickedBy: "Picked by",
    someone: "someone",
    next: "Next song",
    toFinal: "Final scores",
    auto: (s) => `automatically in ${s}s`,
    countdown: (label, s) => `${label} in ${s}s`,
  },
  final: {
    eyebrow: "Final scores",
    tie: "It's a tie: ",
    wins: (count) => (count > 1 ? " win!" : " wins!"),
    again: "Play again",
    lobby: "Back to lobby",
    waitingHost: "The host decides what happens next …",
  },
  audio: {
    enable: "Enable sound",
    volume: "Volume",
    pause: "Pause",
  },
  errors: {
    name_required: "Please enter a name first.",
    code_length: "The room code has 4 letters.",
    server_unreachable: "The server can't be reached.",
    room_not_found: "This room doesn't exist (anymore).",
    room_full: "The room is full.",
    game_running: "The game is already running. Wait for the next one.",
    need_two_players: "You need at least 2 players.",
    need_two_pickers: "At least 2 players must have picked a song.",
    search_unavailable: "Song search is unavailable right now.",
    track_not_found: "Song not found – please search again.",
    picks_full: "You've already picked all your songs.",
    track_taken: "This song has already been picked.",
    search_rate_limited: "Too many searches – wait a moment and try again.",
    kicked: "The host removed you from the room.",
    track_no_year: "No release year is known for this song.",
  },
};

const dictionaries = { de, en };

function getInitialLanguage(): Language {
  const saved = localStorage.getItem("language");
  if (saved === "de" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

interface LanguageValue {
  language: Language;
  toggleLanguage: () => void;
  t: typeof de;
  /** Übersetzt einen Fehlercode vom Server. */
  err: (code: string) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
  }, [language]);

  const t = dictionaries[language];
  const value: LanguageValue = {
    language,
    toggleLanguage: () => setLanguage((l) => (l === "de" ? "en" : "de")),
    t,
    err: (code) => (code ? (t.errors[code] ?? code) : ""),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider fehlt");
  return value;
}
