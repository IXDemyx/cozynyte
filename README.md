# Games

Multiplayer party games in the browser, styled like the portfolio (orange, black/white).
No sign-up: create a room, share the four-letter code or the invite link, and play.

## Games

| Game               | What you do                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| **Guess the Song** | A 30-second clip plays; everyone types the title and artist as fast as possible. |
| **Guess the Year** | A clip plays; everyone guesses the release year.                                 |
| **Song Timeline**  | Place each song in your own timeline; the first with enough correct cards wins.  |
| **Yahtzee**        | A shared score sheet for playing Yahtzee with real dice at the table.            |

The three music games share the same flow: lobby → everyone picks their own songs → rounds → reveal →
final scores. The host can switch between the games in the lobby, so a room can be reused
for a different game without anyone leaving.

Yahtzee rooms (called Kniffel in the German UI) work differently: there are no rounds, just one shared sheet. Everyone who joins
gets their own column, players without a phone can be added by name, and every change shows
up for everyone right away.

## Features

- Rooms for 2–16 players, joinable by code or invite link, also on phones
- Players pick their own songs via search, with preview playback and a volume slider
- Song suggestions by category ("Surprise me", Pop, Rock, 80s, …)
- Optional theme set by the host (e.g. "2000s only"), shown during song selection
- Letter hints for title and artist during a Guess the Song round
- Room layout like skribbl: players on the left, the game in the middle, chat on the right
  (on phones: game, chat, players). The chat is on every room screen; during Guess the Song you
  guess right in the chat, and messages that would give away the answer are never passed on
- Room chat keeps the last 50 messages, also across rounds and games
- Joining late is possible: mid-game joiners guess along, just without songs of their own
- Host tools: remove a player, skip the current song
- Reconnecting after a reload or a dropped connection keeps your score
- Yahtzee: roll digitally (three rolls, hold dice in between) or enter real dice; every empty box shows what the roll would score;
  sums, the upper bonus and the grand total are calculated automatically
- Yahtzee sound effects (rolling, holding, entries, a Yahtzee, your turn, the win), generated in
  the browser and switchable on/off
- German and English UI, light and dark theme

## Getting started

```bash
cd games
npm install
npm run dev
```

Then open <http://localhost:5174>. To try it alone, open a second tab and join with the
room code – each tab counts as a separate player.

### Test mode

During `npm run dev` the host sees a dashed **Test mode** box below the player list. It adds
test bots to the room, so you can try the lobby, chat and games without a second person:

- Bots count as players, so you can start a game alone.
- They pick songs from the suggestions, guess titles and artists, enter years, place timeline
  cards and play their Yahtzee turn (roll three times, take the best free box).
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

| Folder    | Contents                                                    |
| --------- | ----------------------------------------------------------- |
| `client/` | React + TypeScript + Vite + Tailwind CSS (user interface)   |
| `server/` | Node + Express + Socket.IO (rooms, game logic, song search) |
| `shared/` | Types and Yahtzee rules used by both client and server      |

```
client/src/
  components/     shared UI building blocks (Button, PlayerList, Option, InviteButton, …)
  games/music/    Guess the Song, Guess the Year and Song Timeline (lobby, picking, rounds, results)
  games/kniffel/  Yahtzee score sheet (dice panel, sheet, entry dialog)
  hooks/          room connection, server clock, theme, volume, sound effects, two-click confirm
  lib/            socket connection, sound effects and translations (lib/i18n/de.ts, en.ts)
  pages/          Home and Room

server/src/
  config.ts       limits and timings
  state.ts        room and player state
  view.ts         per-player view of a room (hides answers) and broadcasting
  connection.ts   joining, leaving and host hand-over
  handlers/       socket events per area (room, chat, music, kniffel, dev)
  dev/            test bots for test mode
  games/          game logic (music rounds and scoring, Yahtzee turns)
  music/          iTunes search, answer matching, song suggestions
```

Run `npm run format` to format all code with Prettier.

Songs come from the iTunes Search API (30-second previews, no account needed). The server
queries it so that hidden answers (title, artist, year) are not sent to the players who
still have to guess them.

## Configuration

Environment variables for the server, all optional:

| Variable         | Default | Meaning                                           |
| ---------------- | ------- | ------------------------------------------------- |
| `PORT`           | `3001`  | Port the server listens on                        |
| `ITUNES_COUNTRY` | `DE`    | iTunes store used for search results              |
| `REVEAL_MS`      | `9000`  | How long the reveal is shown before the next song |
| `DEV_TOOLS`      | –       | `1`/`0` turns test mode with test bots on/off     |

The suggestion categories and their artists live in `server/src/music/suggestions.ts`.

## Production

```bash
npm run build   # builds client/dist
npm start       # server delivers API, WebSockets and the frontend on PORT
```

The server needs long-lived WebSocket connections, so it has to run on a regular Node host
(your own server, a VPS, Render, Railway, Fly.io, …) – purely static or serverless hosting
such as Vercel is not enough. Behind a reverse proxy, WebSocket upgrades must be passed
through. The app expects to live at the root of its address (e.g. its own subdomain), not
under a sub-path.

## Scoring

**Guess the Song**

- Title: 50–100 points, artist: 25–50 points – the faster, the more.
- Whoever picked the song sits out and gets 15 points for each player who guesses the title.

**Guess the Year**

- Exact year: 100 points, one year off: 80, then 10 fewer for each further year.
- Whoever picked the song sits out and gets 10 points for each player who is at most 2 years off.
- The host decides in the lobby whether title and artist are shown or the round is audio only.

**Song Timeline**

- Each player's first picked song becomes their face-up starting card; the rest form the shared pile.
- A song plays and you choose the gap in your timeline where it belongs. If its year fits between
  the neighbours (equal years count), the card stays; otherwise it is discarded.
- Modes, chosen by the host: everyone places the same song at once (whoever picked it sits out),
  or players take turns and the others watch the active player's timeline.
- The game ends when someone reaches the card goal (4, 6, 8, 10 or no limit) or the pile runs out; most
  cards wins. Late joiners get a starting card from the pile.

**Yahtzee (Kniffel)**

- Standard sheet: ones to sixes, bonus of 35 from 63 points in the upper section, three and
  four of a kind (sum of all dice), full house 25, small straight 30, large straight 40,
  Yahtzee 50, chance (sum of all dice).
- Any box can be crossed out (0) or cleared again to correct a mistake.
- "Undo" takes back the last entry, including the turn and the digital roll from before it.
  With locked columns, only the owner of that column can undo it.
- Turns move on automatically: after every new entry it is the next column's turn (columns
  that are already full are skipped). Corrections and cleared entries do not move the turn.
  Anyone can set whose turn it is by hand, via the selector, the skip button or by tapping a
  column name.
- No dice at hand? "Roll digitally" rolls on the server so everyone sees the same result: up
  to three rolls per turn, tap dice to hold them between rolls. The roll is discarded when the
  turn changes.
- The host can lock the columns: then everyone can only write and roll in their own column;
  columns of players without a phone stay open to everyone.
- The host can start a new game (clears all entries) and remove columns.

## Limitations

- Rooms live in memory only; restarting the server ends running games.
- Clips are limited to the 30-second previews iTunes provides.
- Release years come from iTunes and can be those of a re-release or compilation. If the same
  song appears several times in the search results, the earliest year is used, and the year
  is shown during song selection so obviously wrong ones can be avoided.
- Yahtzee: there is no extra bonus for a second Yahtzee, and a Yahtzee does not count as a
  full house or straight. Unless the host locks the columns, everyone in the room can edit every
  column, as with a paper sheet.
- Removing a player is tied to the browser tab, so it is not a real ban.
- Song search is cached for 10 minutes and limited to 20 searches per player per 30 seconds
  to stay within the iTunes rate limit.
