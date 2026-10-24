/**
 * Texte für Suchmaschinen und die Startseite: Überschrift, „So funktioniert's“ und FAQ.
 * Eine Quelle für beides – die Startseite zeigt sie an, und beim Build landen sie (deutsch) als
 * fertiges HTML und strukturierte Daten in der index.html (siehe vite.config.ts).
 * Bewusst ohne Imports, damit auch die Vite-Konfiguration die Datei laden kann.
 */

export const SITE_URL = "https://cozynyte.com/";

export type SeoLanguage = "de" | "en";

/**
 * Jede Sprache hat ihre eigene Startseite – so kann Google beide getrennt anzeigen.
 * Englisch ist die Hauptseite (`/`), Deutsch liegt unter `/de`.
 */
export const HOME_PATH: Record<SeoLanguage, string> = { en: "/", de: "/de" };

import { GAME_PATH, GAME_SEO, type GamePageId } from "./seoGames";

export { GAME_PATH, GAME_SEO, type GamePageId };

export const GAME_PAGES = Object.keys(GAME_PATH) as GamePageId[];

/** Jede Seite mit eigenem vorgerendertem HTML: die Startseite und die Spielseiten. */
export type SeoPage = "home" | GamePageId;

const LANGUAGES: SeoLanguage[] = ["en", "de"];

export function pathOf(page: SeoPage, lang: SeoLanguage): string {
  return page === "home" ? HOME_PATH[lang] : GAME_PATH[page][lang];
}

/** Seite und Sprache zu einer Adresse (Startseiten und Spielseiten), sonst null. */
export function pageOfPath(pathname: string): { page: SeoPage; lang: SeoLanguage } | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  for (const page of ["home", ...GAME_PAGES] as SeoPage[]) {
    for (const lang of LANGUAGES) if (pathOf(page, lang) === path) return { page, lang };
  }
  return null;
}

/** Sprache, die eine Adresse festlegt (Startseiten und Spielseiten), sonst null. */
export function languageOfPath(pathname: string): SeoLanguage | null {
  return pageOfPath(pathname)?.lang ?? null;
}

const urlOf = (lang: SeoLanguage, page: SeoPage = "home") =>
  new URL(pathOf(page, lang), SITE_URL).href;

interface SeoText {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogLocale: string;
  /** Hinweis auf die andere Sprachversion (für Besucher mit passender Browsersprache). */
  otherLanguage: string;
  title: string;
  intro: string;
  howTitle: string;
  steps: string[];
  /** `page`: Spiel hat eine eigene Spielseite – im Vorab-HTML wird der Name dorthin verlinkt. */
  games: { name: string; text: string; page?: GamePageId }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  noscript: string;
}

export const SEO: Record<SeoLanguage, SeoText> = {
  de: {
    metaTitle:
      "Partyspiele online mit Freunden – Stadt Land Fluss, Montagsmaler, Musikquiz | Cozynyte",
    metaDescription:
      "Kostenlose Partyspiele im Browser: Stadt Land Fluss, Montagsmaler, Song erraten, Musikquiz, Flaggen-Quiz und Kniffel. Raum erstellen, Link teilen, losspielen – ohne Anmeldung, auch per Videocall.",
    ogTitle: "Partyspiele im Browser – Cozynyte",
    ogDescription:
      "Stadt Land Fluss, Montagsmaler, Song erraten, Kniffel und mehr – Raum erstellen, Link teilen, losspielen.",
    ogLocale: "de_DE",
    otherLanguage: "Auch auf Deutsch verfügbar",
    title: "Partyspiele online mit Freunden",
    intro:
      "Kostenlos im Browser, ohne Anmeldung und ohne App: Raum erstellen, Link teilen und gemeinsam spielen – am selben Tisch oder per Videocall.",
    howTitle: "So funktioniert's",
    steps: [
      "Spiel auswählen und auf seiner Seite einen Raum erstellen.",
      "Den Einladungslink oder den vierstelligen Raumcode an deine Freunde schicken.",
      "Jeder spielt am eigenen Handy, Tablet oder Rechner – der Host startet, wenn alle da sind.",
    ],
    games: [
      {
        name: "Song erraten",
        page: "song",
        text: "Musikquiz: Jeder wählt Songs aus, alle raten Titel und Interpret der kurzen Hörprobe.",
      },
      {
        name: "Jahr schätzen",
        page: "year",
        text: "Aus welchem Jahr ist der Song? Wer am nächsten dran liegt, bekommt die meisten Punkte.",
      },
      {
        name: "Song-Zeitleiste",
        page: "timeline",
        text: "Ordnet Songs zeitlich in eure Zeitleiste ein – wer zuerst genug Karten richtig liegen hat, gewinnt.",
      },
      {
        name: "Stadt Land Fluss",
        page: "slf",
        text: "Der Klassiker online: Buchstabe auslosen oder aufsagen, eigene Kategorien, Stopp rufen und gemeinsam abstimmen.",
      },
      {
        name: "Kniffel",
        page: "kniffel",
        text: "Der Kniffel-Block fürs Handy: digital würfeln oder echte Würfe eintragen, alles wird automatisch gezählt.",
      },
      {
        name: "Montagsmaler",
        page: "draw",
        text: "Einer zeichnet, alle anderen raten im Chat – mit großer Begriffsliste oder eigenen Begriffen zu einem Motto.",
      },
      {
        name: "Länder-Quiz",
        page: "geo",
        text: "Flaggen, Landesumrisse und Hauptstädte aller Länder der Welt erraten – getippt oder per Auswahl, nach Kontinent filterbar.",
      },
      {
        name: "Song-Schnipsel",
        page: "snippet",
        text: "Für eine Person: Erkenne den Song an 0,1 Sekunden. Nach jedem Fehlversuch hörst du mehr. Jeden Tag ein Song des Tages.",
      },
    ],
    faqTitle: "Häufige Fragen",
    faq: [
      {
        q: "Kostet das etwas?",
        a: "Nein. Alle Spiele sind kostenlos und ohne Werbung.",
      },
      {
        q: "Brauche ich eine Anmeldung oder eine App?",
        a: "Nein. Du gibst nur einen Namen ein, alles läuft direkt im Browser – auf dem Handy genauso wie am Rechner.",
      },
      {
        q: "Wie viele können mitspielen?",
        a: "Bis zu 16 Spieler pro Raum. Die meisten Spiele brauchen mindestens zwei, Kniffel geht auch allein und Song-Schnipsel ist für eine Person.",
      },
      {
        q: "Können wir auch über Discord oder Zoom spielen?",
        a: "Ja. Jeder spielt am eigenen Gerät, egal ob ihr zusammen am Tisch sitzt oder euch per Videocall trefft.",
      },
      {
        q: "Woher kommen die Songs bei den Musikspielen?",
        a: "Jeder sucht sich selbst Songs aus. Abgespielt werden kurze Hörproben über die Musiksuche von Apple (iTunes).",
      },
      {
        q: "Kann man bei Montagsmaler eigene Begriffe verwenden?",
        a: "Ja. In der „Eigenen Runde“ legt der Host ein Motto fest, jeder reicht Begriffe ein – gezeichnet wird nur, was ihr euch ausgedacht habt.",
      },
    ],
    noscript: "Für die Spiele wird JavaScript benötigt.",
  },
  en: {
    metaTitle:
      "Party games online with friends – Draw & Guess, music quiz, Name Place Animal | Cozynyte",
    metaDescription:
      "Free multiplayer party games in your browser: Draw & Guess, Guess the Song, music quiz, flag quiz, Name Place Animal Thing and Yahtzee. Create a room, share the link, play – no sign-up, works over video calls.",
    ogTitle: "Party games in your browser – Cozynyte",
    ogDescription:
      "Draw & Guess, Guess the Song, Yahtzee and more – create a room, share the link, play.",
    ogLocale: "en_GB",
    otherLanguage: "Also available in English",
    title: "Party games online with friends",
    intro:
      "Free in your browser, no sign-up and no app: create a room, share the link and play together – at the same table or over a video call.",
    howTitle: "How it works",
    steps: [
      "Pick a game and create a room on its page.",
      "Send the invite link or the four-letter room code to your friends.",
      "Everyone plays on their own phone, tablet or computer – the host starts once everyone is in.",
    ],
    games: [
      {
        name: "Guess the Song",
        page: "song",
        text: "Music quiz: everyone picks songs, everyone guesses title and artist from a short preview.",
      },
      {
        name: "Guess the Year",
        page: "year",
        text: "Which year is the song from? Whoever gets closest scores the most.",
      },
      {
        name: "Song Timeline",
        page: "timeline",
        text: "Place songs in your timeline in the right order – first to get enough cards right wins.",
      },
      {
        name: "Name, Place, Animal, Thing",
        page: "slf",
        text: "The German classic “Stadt Land Fluss”: random or recited letter, custom categories, call stop and vote together.",
      },
      {
        name: "Yahtzee",
        page: "kniffel",
        text: "The Yahtzee score sheet for your phone: roll digital dice or enter real ones, everything is added up.",
      },
      {
        name: "Draw & Guess",
        page: "draw",
        text: "One player draws, everyone else guesses in the chat – with a big word list or your own words for a theme.",
      },
      {
        name: "Country Quiz",
        page: "geo",
        text: "Guess flags, country shapes and capitals of every country in the world – type or multiple choice, filter by continent.",
      },
      {
        name: "Song Snippet",
        page: "snippet",
        text: "For one player: name the song from 0.1 seconds. Every wrong guess plays a little more. A new song of the day, every day.",
      },
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "Does it cost anything?", a: "No. All games are free and ad-free." },
      {
        q: "Do I need an account or an app?",
        a: "No. Just enter a name – everything runs in the browser, on phones as well as computers.",
      },
      {
        q: "How many people can play?",
        a: "Up to 16 players per room. Most games need at least two, Yahtzee also works solo and Song Snippet is for one player.",
      },
      {
        q: "Can we play over Discord or Zoom?",
        a: "Yes. Everyone plays on their own device, whether you're at the same table or on a video call.",
      },
      {
        q: "Where do the songs in the music games come from?",
        a: "Everyone picks their own songs. Short previews are played via Apple's music search (iTunes).",
      },
      {
        q: "Can we use our own words in Draw & Guess?",
        a: "Yes. In “Our own words” mode the host sets a theme, everyone submits words – only those get drawn.",
      },
    ],
    noscript: "These games need JavaScript.",
  },
};

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Startseite als schlichtes HTML für die index.html: Suchmaschinen sehen den Inhalt sofort,
 * Besucher nur kurz das Logo – dann übernimmt React und ersetzt alles.
 */
export function staticHomeHtml(lang: SeoLanguage): string {
  const s = SEO[lang];
  const list = (items: string[]) => items.map((item) => `<li>${escape(item)}</li>`).join("");
  return [
    `<div class="prerender">`,
    `<div class="prerender-splash" aria-hidden="true">cozy<span>nyte</span></div>`,
    `<main class="prerender-content">`,
    `<h1>${escape(s.title)}</h1>`,
    `<p>${escape(s.intro)}</p>`,
    `<noscript><p><strong>${escape(s.noscript)}</strong></p></noscript>`,
    `<h2>${lang === "de" ? "Spiele" : "Games"}</h2>`,
    `<ul>${s.games.map((g) => `<li><strong>${gameName(g, lang)}</strong> – ${escape(g.text)}</li>`).join("")}</ul>`,
    `<h2>${escape(s.howTitle)}</h2>`,
    `<ol>${list(s.steps)}</ol>`,
    `<h2>${escape(s.faqTitle)}</h2>`,
    s.faq.map((f) => `<h3>${escape(f.q)}</h3><p>${escape(f.a)}</p>`).join(""),
    `</main>`,
    `</div>`,
  ].join("");
}

/** Spielname im Vorab-HTML der Startseite – mit Link, wenn das Spiel eine eigene Seite hat. */
function gameName(game: SeoText["games"][number], lang: SeoLanguage): string {
  const name = escape(game.name);
  return game.page ? `<a href="${pathOf(game.page, lang)}">${name}</a>` : name;
}

/** Spielseite als schlichtes HTML – wie bei der Startseite ersetzt React es beim Start. */
export function staticGameHtml(lang: SeoLanguage, page: GamePageId): string {
  const s = GAME_SEO[page][lang];
  const items = (list: { title: string; text: string }[]) =>
    list.map((item) => `<h3>${escape(item.title)}</h3><p>${escape(item.text)}</p>`).join("");
  return [
    `<div class="prerender">`,
    `<div class="prerender-splash" aria-hidden="true">cozy<span>nyte</span></div>`,
    `<main class="prerender-content">`,
    `<nav><a href="${pathOf("home", lang)}">${escape(s.breadcrumb)}</a> › ${escape(s.name)}</nav>`,
    `<h1>${escape(s.title)}</h1>`,
    `<p>${escape(s.intro)}</p>`,
    `<noscript><p><strong>${escape(SEO[lang].noscript)}</strong></p></noscript>`,
    `<ul>${s.facts.map((fact) => `<li>${escape(fact)}</li>`).join("")}</ul>`,
    `<h2>${escape(s.howTitle)}</h2>`,
    items(s.steps),
    `<h2>${escape(s.rulesTitle)}</h2>`,
    items(s.rules),
    `<h2>${escape(s.scoreTitle)}</h2>`,
    `<ul>${s.scores.map((row) => `<li>${escape(row.label)}: ${escape(row.value)}</li>`).join("")}</ul>`,
    `<h2>${escape(s.faqTitle)}</h2>`,
    s.faq.map((f) => `<h3>${escape(f.q)}</h3><p>${escape(f.a)}</p>`).join(""),
    `<p><a href="${pathOf("home", lang)}">${escape(s.allGames)}</a></p>`,
    `</main>`,
    `</div>`,
  ].join("");
}

/** Titel, Beschreibung, Sprachversionen (hreflang) und Link-Vorschau für den <head>. */
export function headHtml(lang: SeoLanguage, page: SeoPage = "home"): string {
  const s = page === "home" ? SEO[lang] : GAME_SEO[page][lang];
  // Vorschaubild für geteilte Links – je Sprache eigenes Bild mit übersetztem Text.
  const image = new URL(lang === "en" ? "og-image-en.png" : "og-image.png", SITE_URL).href;
  return [
    `<title>${escape(s.metaTitle)}</title>`,
    `<meta name="description" content="${escape(s.metaDescription)}" />`,
    `<link rel="canonical" href="${urlOf(lang, page)}" />`,
    `<link rel="alternate" hreflang="de" href="${urlOf("de", page)}" />`,
    `<link rel="alternate" hreflang="en" href="${urlOf("en", page)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${urlOf("en", page)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Cozynyte" />`,
    `<meta property="og:locale" content="${SEO[lang].ogLocale}" />`,
    `<meta property="og:url" content="${urlOf(lang, page)}" />`,
    `<meta property="og:title" content="${escape(s.ogTitle)}" />`,
    `<meta property="og:description" content="${escape(s.ogDescription)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escape(s.ogTitle)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${page === "home" ? jsonLd(lang) : gameJsonLd(lang, page)}</script>`,
  ].join("\n    ");
}

/** Strukturierte Daten einer Spielseite: Spiel, Brotkrumen und FAQ. */
export function gameJsonLd(lang: SeoLanguage, page: GamePageId): string {
  const s = GAME_SEO[page][lang];
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: s.name,
        url: urlOf(lang, page),
        description: s.intro,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        inLanguage: lang,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: s.breadcrumb, item: urlOf(lang) },
          { "@type": "ListItem", position: 2, name: s.name, item: urlOf(lang, page) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: s.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Strukturierte Daten (schema.org) für Suchmaschinen. */
export function jsonLd(lang: SeoLanguage): string {
  const s = SEO[lang];
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Cozynyte",
        url: urlOf(lang),
        inLanguage: lang,
      },
      {
        "@type": "WebApplication",
        name: s.ogTitle,
        url: urlOf(lang),
        description: s.intro,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        inLanguage: lang,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        author: { "@type": "Person", name: "Daniel Keller", url: "https://daniel-keller.dev" },
        featureList: s.games.map((g) => g.name),
      },
      {
        "@type": "FAQPage",
        mainEntity: s.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  // „</script>“ im Text darf das Script-Tag nicht beenden.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
