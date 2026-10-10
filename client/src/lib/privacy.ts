/**
 * Datenschutzerklärung der Spiele (deutsch und englisch). Bewusst nicht im Wörterbuch, weil es
 * lange Rechtstexte sind, die sich selten ändern.
 */

export const IMPRINT_URL = "https://daniel-keller.dev/legal";
export const PORTFOLIO_URL = "https://daniel-keller.dev";

interface Section {
  title: string;
  paragraphs: string[];
}

interface PrivacyText {
  title: string;
  updated: string;
  controller: { title: string; text: string; link: string };
  sections: Section[];
}

export const privacy: Record<"de" | "en", PrivacyText> = {
  de: {
    title: "Datenschutzerklärung",
    updated: "Stand: Oktober 2026",
    controller: {
      title: "1. Verantwortlicher",
      text: "Verantwortlich für diese Website ist Daniel Keller. Anschrift und Kontaktdaten findest du im",
      link: "Impressum",
    },
    sections: [
      {
        title: "2. Allgemeines",
        paragraphs: [
          "Diese Website ist ein privates, nicht kommerzielles Hobbyprojekt. Es gibt keine Benutzerkonten, keine Werbung und kein Tracking. Personenbezogene Daten werden nur verarbeitet, soweit es für den Betrieb der Spiele nötig ist.",
        ],
      },
      {
        title: "3. Hosting und Cloudflare",
        paragraphs: [
          "Die Website läuft auf einem eigenen Server. Die Verbindung dorthin wird über Cloudflare bereitgestellt (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA). Cloudflare leitet die Anfragen weiter, schützt die Website vor Angriffen und verarbeitet dabei technische Daten wie deine IP-Adresse, Datum und Uhrzeit des Zugriffs sowie Informationen zu Browser und Betriebssystem.",
          "Rechtsgrundlage ist mein berechtigtes Interesse an einer sicheren und zuverlässigen Bereitstellung der Website (Art. 6 Abs. 1 lit. f DSGVO). Da Cloudflare seinen Sitz in den USA hat, können Daten auch außerhalb der EU verarbeitet werden. Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert.",
        ],
      },
      {
        title: "4. Spielräume und Chat",
        paragraphs: [
          "Wenn du einen Raum erstellst oder beitrittst, verarbeitet der Server den von dir gewählten Namen, deine Chatnachrichten sowie deine Eingaben im Spiel (z. B. Tipps, Antworten, Punktestände). Diese Daten sehen die anderen Spieler im selben Raum. Du kannst einen beliebigen Spitznamen verwenden.",
          "Die Daten liegen nur im Arbeitsspeicher des Servers und werden nicht dauerhaft gespeichert. Ein Raum wird spätestens etwa zehn Minuten, nachdem ihn alle verlassen haben, vollständig gelöscht, ebenso bei einem Neustart des Servers.",
          "Rechtsgrundlage ist die Bereitstellung der von dir genutzten Spiele (Art. 6 Abs. 1 lit. b DSGVO). Bitte gib im Chat keine sensiblen Daten preis.",
        ],
      },
      {
        title: "5. Songs, Hörproben und Cover (Apple)",
        paragraphs: [
          "Für die Musikspiele werden Songs über die iTunes-Suche von Apple gefunden. Die Suche läuft über meinen Server – dabei wird nur der Suchbegriff an Apple übermittelt, nicht deine IP-Adresse.",
          "Hörproben und Albumcover lädt dein Browser dagegen direkt von Servern von Apple (Apple Inc., One Apple Park Way, Cupertino, CA 95014, USA). Dabei erhält Apple deine IP-Adresse sowie technische Informationen zu deinem Browser. Das ist nötig, um die Musik abzuspielen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Weitere Informationen findest du in der Datenschutzrichtlinie von Apple.",
        ],
      },
      {
        title: "6. Speicherung im Browser",
        paragraphs: [
          "Damit du nicht alles neu einstellen musst, speichert die Website einige Einstellungen lokal in deinem Browser (Local Storage bzw. Session Storage): deinen Namen, Sprache, Design, Lautstärke und Soundeinstellungen sowie eine zufällige Spieler-ID für die aktuelle Sitzung. Diese Daten bleiben auf deinem Gerät; nur Name und Spieler-ID werden beim Beitreten an den Server geschickt. Du kannst sie jederzeit über die Einstellungen deines Browsers löschen.",
          "Es werden keine Cookies gesetzt und keine Analyse- oder Werbedienste verwendet. Schriftarten werden vom eigenen Server geladen.",
        ],
      },
      {
        title: "7. Deine Rechte",
        paragraphs: [
          "Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner personenbezogenen Daten, auf Datenübertragbarkeit sowie das Recht, einer Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zu widersprechen. Außerdem kannst du dich bei einer Datenschutzaufsichtsbehörde beschweren.",
          "Da die Spieldaten nicht dauerhaft gespeichert werden, sind sie nach dem Löschen eines Raums auch für mich nicht mehr abrufbar.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 2026",
    controller: {
      title: "1. Controller",
      text: "This website is operated by Daniel Keller. You can find the address and contact details in the",
      link: "legal notice",
    },
    sections: [
      {
        title: "2. General",
        paragraphs: [
          "This website is a private, non-commercial hobby project. There are no user accounts, no ads and no tracking. Personal data is only processed as far as necessary to run the games.",
        ],
      },
      {
        title: "3. Hosting and Cloudflare",
        paragraphs: [
          "The website runs on my own server. The connection to it is provided via Cloudflare (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA). Cloudflare forwards requests, protects the website against attacks and processes technical data such as your IP address, the date and time of access and information about your browser and operating system.",
          "The legal basis is my legitimate interest in providing the website securely and reliably (Art. 6(1)(f) GDPR). As Cloudflare is based in the USA, data may also be processed outside the EU. Cloudflare is certified under the EU-US Data Privacy Framework.",
        ],
      },
      {
        title: "4. Game rooms and chat",
        paragraphs: [
          "When you create or join a room, the server processes the name you choose, your chat messages and your in-game input (e.g. guesses, answers, scores). Other players in the same room can see this data. You may use any nickname.",
          "This data is only kept in the server's memory and is never stored permanently. A room is deleted completely about ten minutes after everyone has left at the latest, as well as whenever the server restarts.",
          "The legal basis is providing the games you use (Art. 6(1)(b) GDPR). Please do not share sensitive information in the chat.",
        ],
      },
      {
        title: "5. Songs, previews and artwork (Apple)",
        paragraphs: [
          "The music games find songs via Apple's iTunes search. The search runs through my server – only the search term is sent to Apple, not your IP address.",
          "Audio previews and album artwork, however, are loaded by your browser directly from Apple's servers (Apple Inc., One Apple Park Way, Cupertino, CA 95014, USA). Apple receives your IP address and technical information about your browser. This is necessary to play the music; the legal basis is Art. 6(1)(b) GDPR. See Apple's privacy policy for more information.",
        ],
      },
      {
        title: "6. Storage in your browser",
        paragraphs: [
          "So you don't have to set everything again, the website stores a few settings locally in your browser (local storage or session storage): your name, language, theme, volume and sound settings, and a random player ID for the current session. This data stays on your device; only your name and player ID are sent to the server when you join a room. You can delete it at any time in your browser settings.",
          "No cookies are set and no analytics or advertising services are used. Fonts are served from my own server.",
        ],
      },
      {
        title: "7. Your rights",
        paragraphs: [
          "You have the right to access, rectify, erase and restrict the processing of your personal data, to data portability and to object to processing based on Art. 6(1)(f) GDPR. You may also lodge a complaint with a data protection supervisory authority.",
          "As game data is never stored permanently, it can no longer be retrieved – not even by me – once a room has been deleted.",
        ],
      },
    ],
  },
};
