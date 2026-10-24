/**
 * Song-Schnipsel über HTTP (unter /api/snippet) – ohne Raum und ohne Socket. Limits pro IP.
 *
 * - POST /new            { category, recent }  → { id }
 * - GET  /:id/audio      Hörprobe der Runde, vom Server durchgereicht (verrät keinen Titel)
 * - GET  /search?q=…     → { tracks }
 * - POST /:id/guess      { trackId } → SnippetTurn
 * - POST /:id/skip       → SnippetTurn
 */

import express, { type Response } from "express";
import { hasGame, newGame, play, previewOf, toSnippetTrack } from "../games/snippet";
import { allowRequest } from "../limits";
import { getCachedTrack, searchTracks } from "../music/itunes";

export const snippetRouter = express.Router();
snippetRouter.use(express.json({ limit: "2kb" }));

const fail = (res: Response, error: string, status = 400) =>
  res.status(status).json({ ok: false, error });

snippetRouter.post("/new", async (req, res) => {
  if (!allowRequest("snippetNew", req)) return fail(res, "too_many_attempts", 429);
  const category = String(req.body?.category ?? "surprise").slice(0, 20);
  const recent = Array.isArray(req.body?.recent)
    ? req.body.recent.slice(0, 50).map(Number).filter(Number.isInteger)
    : [];
  try {
    res.json({ ok: true, id: await newGame(category, recent) });
  } catch {
    fail(res, "search_unavailable", 503);
  }
});

// Die Hörprobe läuft über den eigenen Server: Die Adresse bei Apple bleibt verborgen, der Browser
// darf die Datei für Web Audio lesen (gleiche Herkunft), und Apple sieht nicht die IP der Spieler.
// Gespeichert wird nichts.
snippetRouter.get("/:id/audio", async (req, res) => {
  const url = previewOf(String(req.params.id));
  if (!url) return res.status(404).end();
  // Nur Apples eigene Server durchreichen (Hörproben liegen je nach Song auf *.apple.com oder
  // *.mzstatic.com).
  const host = URL.canParse(url) ? new URL(url).hostname : "";
  if (!/(^|\.)(apple\.com|mzstatic\.com)$/.test(host)) {
    console.warn(`Song-Schnipsel: Hörprobe von unerwartetem Server abgelehnt: ${url}`);
    return res.status(404).end();
  }
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) {
      console.warn(`Song-Schnipsel: Hörprobe nicht geladen (${upstream.status}): ${url}`);
      return res.status(502).end();
    }
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "audio/mp4");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.warn(`Song-Schnipsel: Hörprobe nicht geladen (${String(error)}): ${url}`);
    res.status(502).end();
  }
});

snippetRouter.get("/search", async (req, res) => {
  const term = String(req.query.q ?? "")
    .trim()
    .slice(0, 80);
  if (term.length < 2) return res.json({ ok: true, tracks: [] });
  if (!allowRequest("snippetSearch", req)) return fail(res, "search_rate_limited", 429);
  try {
    const tracks = await searchTracks(term);
    res.json({ ok: true, tracks: tracks.map(toSnippetTrack) });
  } catch {
    fail(res, "search_unavailable", 503);
  }
});

snippetRouter.post("/:id/guess", (req, res) => {
  if (!allowRequest("snippetGuess", req)) return fail(res, "too_many_attempts", 429);
  const id = String(req.params.id);
  if (!hasGame(id)) return fail(res, "snippet_expired", 404);
  // Geraten wird nur aus der Suche – der Song liegt dann im Zwischenspeicher.
  const track = getCachedTrack(Number(req.body?.trackId));
  if (!track) return fail(res, "track_not_found");
  const turn = play(id, track);
  if (!turn) return fail(res, "snippet_expired", 404);
  res.json({ ok: true, ...turn });
});

snippetRouter.post("/:id/skip", (req, res) => {
  if (!allowRequest("snippetGuess", req)) return fail(res, "too_many_attempts", 429);
  const turn = play(String(req.params.id));
  if (!turn) return fail(res, "snippet_expired", 404);
  res.json({ ok: true, ...turn });
});
