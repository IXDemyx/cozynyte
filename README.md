# Games

Multiplayer-Partyspiele im Browser, im Stil des Portfolios (Orange, Schwarz/Weiß).
Erstes Spiel: **Guess the Song** – jeder wählt eigene Songs, alle raten um die Wette.

## Starten

```bash
cd games
npm install
npm run dev
```

Danach <http://localhost:5174> öffnen. Zum Testen allein: zweiten Tab öffnen und mit dem
Raumcode beitreten (jeder Tab zählt als eigener Spieler).

### Zusammen mit dem Portfolio

Im Portfolio-Ordner (eine Ebene höher) startet `npm run dev` beides auf einmal:
Portfolio auf <http://localhost:5173>, Games auf <http://localhost:5174>.
Nur das Portfolio: `npm run dev:portfolio`.

Mit Docker (ebenfalls im Portfolio-Ordner): `docker compose up --build` –
Portfolio auf <http://localhost:5173>, Games auf <http://localhost:3001>.

## Aufbau

| Ordner    | Inhalt                                                        |
| --------- | ------------------------------------------------------------- |
| `client/` | React + TypeScript + Vite + Tailwind (Oberfläche)             |
| `server/` | Node + Express + Socket.IO (Räume, Spiellogik, Songsuche)     |
| `shared/` | Typen, die Client und Server gemeinsam nutzen                 |

Die Songs kommen über die iTunes Search API (30-Sekunden-Ausschnitte, kein Konto nötig).
Der Server fragt sie ab, damit Titel und Interpret während der Runde nie beim Client landen.

## Produktivbetrieb

```bash
npm run build   # baut client/dist
npm start       # Server liefert API, WebSockets und das Frontend auf PORT (Standard 3001)
```

Dafür gibt es auch ein `Dockerfile` in diesem Ordner. Der Server braucht dauerhafte WebSocket-Verbindungen – also einen normalen Node-Host
(VPS, Render, Railway, Fly.io …), kein reines Static-/Serverless-Hosting wie Vercel.

## Punkte

- Titel: 50–100 Punkte, Interpret: 25–50 Punkte – je schneller, desto mehr.
- Wer den Song ausgewählt hat, setzt aus und bekommt 15 Punkte pro Spieler, der den Titel errät.
