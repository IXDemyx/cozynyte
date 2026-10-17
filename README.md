# Games

Multiplayer party games in the browser, styled like the portfolio (orange, black/white).
No sign-up: create a room, share the four-letter code or the invite link, and play – at the
same table or over a video call. Live at <https://cozynyte.com>.

## Games

| Game                                              | What you do                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Guess the Song** (Song erraten)                 | A preview plays; everyone types title and artist into the chat as fast as possible.       |
| **Guess the Year** (Jahr schätzen)                | A preview plays; everyone guesses the release year.                                       |
| **Song Timeline** (Zeitleiste)                    | Place each song in your own timeline; the first with enough correct cards wins.           |
| **Name, Place, Animal, Thing** (Stadt Land Fluss) | A letter is drawn; fill in a word for every category before someone calls stop.           |
| **Yahtzee** (Kniffel)                             | A shared score sheet – roll real dice at the table or roll digitally.                     |
| **Draw & Guess** (Montagsmaler)                   | One player picks one of three words and draws it; everyone else guesses in the chat.      |
| **Country Quiz** (Länder-Quiz)                    | Guess the country from its flag or shape, or name its capital – typed or multiple choice. |

The start page groups them into **Music**, **Classics** and **Quiz**.

The three music games share the same flow: lobby → everyone picks their own songs → rounds →
reveal → final scores (podium with confetti). The host can switch between them in the lobby,
so a room can be reused without anyone leaving.

Stadt Land Fluss, Draw & Guess and the Country Quiz have their own lobbies (see [Scoring and rules](#scoring-and-rules)).
Yahtzee works differently: there are no rounds, just one shared sheet. Everyone who joins gets
their own column, players without a phone can be added by name, and every change shows up for
everyone right away.

## Features

**Rooms and players**

- Rooms for up to 16 players, joinable by code or invite link, also on phones
- Opening an invite link asks for your name first (prefilled with the last one you used)
- Coming back keeps your place: your player ID per room is stored in the browser, and if a tab
  was discarded or the link opened in another browser, joining with the same name takes over
  your disconnected seat – score, songs and Yahtzee column included
- Joining late is possible: mid-game joiners play along from then on (without songs of their own)
- Host tools: hand the host role to someone else, remove a player, skip the current song, and go
  **back to the lobby** mid-game (e.g. after wrong settings). The others then see a short notice.
- If the host leaves, the next connected player becomes host

**Layout and chat**

- Room layout like skribbl: players on the left, the game in the middle, chat on the right
  (on phones: game, chat, players)
- The chat is on every room screen and scrolls along automatically (unless you scrolled up to
  read). In Guess the Song and Draw & Guess you guess right in the chat; messages that would
  give away the answer are never passed on. It keeps the last 50 messages.

**Music games**

- Players pick their own songs via search, with preview playback and a volume slider
- Song suggestions by category ("Surprise me", Pop, Rock, 80s, …)
- Optional theme set by the host (e.g. "2000s only"), shown during song selection
- Letter hints for title and artist during a Guess the Song round
- Subtle sound effects; each new round scrolls back to the top

**Everywhere**

- Sound effects for every game, generated in the browser, with a volume control
- German and English UI, light and dark theme
- Start page in two language versions (`/` German, `/en` English) for search engines
- Optional "Buy me a coffee" link in the footer and on the final screen

## Getting started

```bash
cd games
npm install
npm run dev
```

Then open <http://localhost:5174>. In development mode each tab counts as a separate player,
so you can also open a second tab and join with the room code.

### Test mode

During `npm run dev` the host sees a dashed **Test mode** box below the player list. It adds
test bots to the room, so you can try the lobby, chat and games without a second person:

- Bots count as players, so you can start a game alone.
- They pick songs from the suggestions, guess titles and artists, enter years, place timeline
  cards, fill in Stadt Land Fluss answers, draw and guess in Draw & Guess (and submit words in
  "Our own words" mode), answer Country Quiz questions (usually right, sometimes not) and play
  their Yahtzee turn (roll three times, take the best free box).
- They answer chat messages now and then; "Make a bot chat" sends a message on demand.
- "Remove all bots" takes them (and their Yahtzee columns) out again. Bots never become host.

Test mode is off in the Docker image (`NODE_ENV=production`). Force it with `DEV_TOOLS=1` or
`DEV_TOOLS=0`.

### Together with the portfolio

From the portfolio folder (one level up), `npm run dev` starts both:
portfolio on <http://localhost:5173>, games on <http://localhost:5174>.
Portfolio only: `npm run dev:portfolio`.

### Docker

From the portfolio folder:

```bash
docker compose up -d --build
```

Portfolio on <http://localhost:5173>, games on <http://localhost:1337>.
The games container serves the frontend, the API and the WebSockets from one port
(3001 inside the container).

## Project structure

| Folder    | Contents                                                                                  |
| --------- | ----------------------------------------------------------------------------------------- |
| `client/` | React + TypeScript + Vite + Tailwind CSS (user interface)                                 |
| `server/` | Node + Express + Socket.IO (rooms, game logic, song search)                               |
| `shared/` | Types and rules used by client and server (Yahtzee, Stadt Land Fluss, drawing, countries) |

```
client/src/
  components/     shared UI building blocks (Button, PlayerList, RoomLayout, RoomChat, Podium, …)
  games/music/    Guess the Song, Guess the Year and Song Timeline (lobby, picking, rounds, results)
  games/slf/      Stadt Land Fluss (lobby, letter drawing, writing round, review)
  games/draw/     Draw & Guess (lobby, word collection, canvas, toolbar, renderer)
  games/geo/      Country Quiz (lobby, question with picture, answers, reveal)
  games/kniffel/  Yahtzee score sheet (dice panel, sheet with direct entry)
  hooks/          room connection, server clock, theme, volume, sound effects, two-click confirm
  lib/            socket connection and player IDs, sounds, translations (lib/i18n/de.ts, en.ts),
                  search-engine texts (seo.ts), privacy text, donate link
  pages/          Home, Room and Privacy

server/src/
  config.ts       limits and timings
  state.ts        room and player state
  view.ts         per-player view of a room (hides answers) and broadcasting
  connection.ts   joining, leaving and host hand-over
  handlers/       socket events per area (room, chat, music, slf, draw, geo, kniffel, dev)
  games/          game logic (music, Stadt Land Fluss, Draw & Guess, Country Quiz, Yahtzee)
  draw/           word lists for Draw & Guess (German and English)
  music/          iTunes search, answer matching, song suggestions
  dev/            test bots for test mode

server/assets/    Country Quiz pictures: flags (flags/*.svg) and country shapes (outlines.json),
                  sources and licences in LICENSES.md
shared/countries.ts  all 195 countries: names, capitals, continents, other spellings
```

Run `npm run format` to format all code with Prettier and `npm run typecheck` to check types.

Songs come from the iTunes Search API (30-second previews, no account needed). The server
queries it so that hidden answers (title, artist, year) are not sent to the players who
still have to guess them.

### Search engines

`client/src/lib/seo.ts` holds title, description, intro, "How it works" and FAQ for both
languages. The start page shows them, and a small Vite plugin (`client/vite.config.ts`) writes
them into the built HTML at build time: `dist/index.html` (German) and `dist/en/index.html`
(English), each with its own title, description, `hreflang` links, structured data (JSON-LD)
and pre-rendered text. React replaces that text when it starts. `client/public/sitemap.xml`
lists both pages; room pages (`/r/…`) are sent with `X-Robots-Tag: noindex`.

The donate link lives in `client/src/lib/donate.ts` (empty = hidden).

## Configuration

Environment variables for the server, all optional:

| Variable         | Default | Meaning                                                                                          |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `PORT`           | `3001`  | Port the server listens on                                                                       |
| `ITUNES_COUNTRY` | `DE`    | iTunes store used for search results                                                             |
| `REVEAL_MS`      | –       | How long the reveal is shown before the next song (default 6 s for Song Timeline, 5 s otherwise) |
| `DEV_TOOLS`      | –       | `1`/`0` turns test mode with test bots on/off                                                    |

The suggestion categories and their artists live in `server/src/music/suggestions.ts`, the
Draw & Guess words in `server/src/draw/words.ts`.

## Production

```bash
npm run build   # builds client/dist (German and English start page)
npm start       # server delivers API, WebSockets and the frontend on PORT
```

The server needs long-lived WebSocket connections, so it has to run on a regular Node host
(own server, VPS, …) – purely static or serverless hosting is not enough. Behind a reverse
proxy or tunnel (e.g. Cloudflare Tunnel), WebSocket upgrades must be passed through. The app
expects to live at the root of its address (e.g. its own subdomain), not under a sub-path.

## Scoring and rules

**Guess the Song**

- Title: 50–100 points, artist: 25–50 points – the faster, the more.
- Whoever picked the song sits out and gets 15 points for each player who guesses the title.
- Time per song: 15, 20 or 30 seconds (same choice for all music games).

**Guess the Year**

- Exact year: 100 points, one year off: 80, then 10 fewer for each further year.
- Whoever picked the song sits out and gets 10 points for each player who is at most 2 years off.
- The host decides in the lobby whether title and artist are shown or the round is audio only.

**Song Timeline**

- Everyone starts with the same random **start year** as their first card (drawn per game from
  the years of the picked songs). All picked songs go into the shared pile, so every song is played.
- A song plays and you choose the gap in your timeline where it belongs. If its year fits between
  the neighbours (equal years count), the card stays; otherwise it is discarded.
- Modes, chosen by the host: everyone places the same song at once (whoever picked it sits out),
  or players take turns and the others watch the active player's timeline.
- The game ends when someone reaches the card goal (4, 6, 8, 10 or no limit) or the pile runs
  out; most cards wins. Late joiners get the same start year.

**Stadt Land Fluss**

- Lobby: categories (presets plus custom ones), number of rounds, time limit, how the letter is
  chosen, and whether Q, X and Y are played.
- Each round draws a letter that has not been played yet in this game – either at random (a
  3-2-1 countdown, then the letter rolls through the alphabet), or like at the table ("Recite"):
  in turn, one player runs through the alphabet in their head by tapping once per letter (only
  they see where they are), and a randomly chosen other player says stop. After a countdown the
  letter is revealed. If nobody stops within 20 seconds, the current letter is taken.
- Everyone fills in one answer per category. Whoever has filled in every field can call
  **Stop!** – the others then get 5 more seconds; otherwise the round ends with the time limit.
- In the review, all answers are shown per category. Empty answers and answers with the wrong
  first letter score 0 automatically; identical answers are detected regardless of case,
  accents and spaces, similar ones can be **marked as duplicate** by hand. Players can reject
  doubtful answers with 👎 – with votes from more than half of the other players, the answer
  scores 0.
- 10 points for an answer, 5 if someone else has the same one (or it is marked as duplicate),
  20 if it is the only valid answer in that category.

**Draw & Guess (Montagsmaler)**

- Lobby: rounds (2–5), time per drawing (60, 80 or 120 s) and where the words come from:
  - **Word list** in German or English (about 600 words each: animals, food, things, places,
    well-known video and board games, films, fairy tales, landmarks, holidays, countries, …)
  - **Our own words**: the host sets an optional theme, everyone submits 3, 5 or 8 words, and
    only those get drawn. Whoever submitted the current word doesn't guess and earns points
    when others get it.
- Each turn the drawer picks one of three words (15 seconds, otherwise one is picked). The
  others see the gaps below the canvas, and letters are revealed over time (at most half).
- Guess in the chat. Near misses show "close"; correct guesses are never shown to others.
  Once the first player has guessed it, the remaining time drops to 20 seconds.
- Correct guess: 50 points + up to 100 for speed + 30/20/10 for the first three. The drawer
  gets 25 and the word's author 15 for every correct guess.
- Tools: pen, eraser, fill, 12 colours, 4 sizes, undo (Ctrl+Z) and clear.

**Country Quiz (Länder-Quiz)**

- 195 countries (all UN members plus the Vatican and Palestine) with names and capitals in
  German and English. Flags from [flag-icons](https://github.com/lipis/flag-icons) (MIT),
  country shapes generated from [Natural Earth](https://www.naturalearthdata.com/) (public
  domain) – see `server/assets/LICENSES.md`.
- Lobby: questions (flags, shapes, capitals or mixed), region (world or one continent;
  "Americas" = North and South America), countries (well-known ≈ 95 or all), answers (type or
  multiple choice), number of questions (10/15/20/30), time per question (10/15/20 s), and –
  depending on the answer mode – hints on/off (typing) or 50:50 jokers per player (multiple
  choice: off, 1, 2 or 3). The lobby shows how many countries are in the pool; with a small pool
  fewer questions are played.
- Everyone answers the same question at the same time after a 3-second countdown. The
  question ends early once everyone has answered (multiple choice) or got it (typing), then
  the reveal shows the country with flag, capital and continent for 4 seconds.
- Typing: German or English names and common other spellings count ("USA", "Holland",
  "Kiev" …), small typos too. Another country's name never counts ("Niger" is not "Nigeria").
  Unlimited tries; near misses show "close" to everyone.
- Multiple choice: one answer, no changing. Wrong options for flags are picked from flags that
  look alike (Chad/Romania, Indonesia/Monaco, …), otherwise from the same region.
- Typing hints (if on): continent at 40 % of the time, first letter at 70 % (for capitals the
  first one and then two letters).
- Multiple-choice jokers: each player can use the 50:50 joker as often per game as set in the
  lobby, at most once per question and before answering. Two wrong answers disappear – only for
  that player; the others see "… uses the 50:50 joker" in the chat.
- Correct answer: 50 points + up to 100 for speed + 30/20/10 for the first three.
- The picture is served by the server under a random ID per question, so the network tab does
  not give the country away (and a shape question does not reveal the flag).

**Yahtzee (Kniffel)**

- Standard sheet: ones to sixes, bonus of 35 from 63 points in the upper section, three and
  four of a kind (sum of all dice), full house 25, small straight 30, large straight 40,
  Yahtzee 50, chance (sum of all dice). Columns all have the same width.
- Entering: with dice (rolled digitally or tapped in) a tap on a box writes the suggested score
  right away. Without dice – or to correct a box – the box turns into a small input: Enter (or
  clicking elsewhere) saves, empty clears, 0 crosses out, Esc cancels; impossible scores (like 7 in
  threes) are rejected.
- Desktop (from 1280 px): the sheet fills the page with compact rows, dice and tools sit in a
  column on the right and the chat opens as a panel over that column (with an unread counter) –
  everything fits on screen without scrolling.
- Phone (below 1024 px): a compact header (code, chat, "…" for volume, lock and new game),
  the dice and a narrow sheet that fits up to four players without sideways scrolling; the chat
  opens as a sheet from the bottom.
- "Undo" takes back the last entry, including the turn and the digital roll from before it.
  With locked columns, only the owner of that column can undo it.
- Turns move on automatically: after every new entry it is the next column's turn (full
  columns are skipped). Corrections and cleared entries do not move the turn. Only the host
  can set whose turn it is by hand (selector, skip button or tapping a column name).
- No dice at hand? "Roll digitally" rolls on the server so everyone sees the same result: up
  to three rolls per turn, tap dice to hold them between rolls (with a rolling animation and
  badges for combos). The roll is discarded when the turn changes.
- The host can lock the columns: then everyone can only write and roll in their own column;
  columns of players without a phone stay open to everyone.
- The host can start a new game (clears all entries), remove columns and hand over the host role.

## Limitations

- Rooms live in memory only; restarting the server ends running games.
- Clips are limited to the 30-second previews iTunes provides.
- Release years come from iTunes and can be those of a re-release or compilation. If the same
  song appears several times in the search results, the earliest year is used, and the year
  is shown during song selection so obviously wrong ones can be avoided.
- Yahtzee: there is no extra bonus for a second Yahtzee, and a Yahtzee does not count as a
  full house or straight. Unless the host locks the columns, everyone in the room can edit every
  column, as with a paper sheet.
- Removing a player is tied to the ID stored in that browser, so it is not a real ban
  (another browser or a private window can join again).
- Taking over a seat by name only works while that player is disconnected; two people with
  the same name in one room can therefore swap seats if one of them drops out.
- Song search is cached for 10 minutes and limited to 20 searches per player per 30 seconds
  to stay within the iTunes rate limit.
