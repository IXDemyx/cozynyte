/**
 * Flagge und Umriss des Tages über HTTP (unter /api/flag) – ohne Raum und ohne Socket. Limits
 * pro IP.
 *
 * - POST /play             { kind?, number?, date, guesses, giveUp, count } → FlagTurn (alle Tipps
 *                          des Tages ausgewertet; mit `number` ein früherer Tag aus dem Archiv)
 * - GET  /img/:code        Flagge eines Landes als SVG (für die getippten Länder und die Auflösung)
 * - GET  /outline/:number  Umriss des Tages Nr. `number` als SVG (nur bis heute)
 */

import express, { type Response } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FLAG_TRIES } from "../../../shared/flag";
import { isFlagCountry, outlineOf, playFlag } from "../games/flag";
import { allowRequest, requestIp } from "../limits";
import { outlineSvg } from "../outlines";

export const flagRouter = express.Router();
flagRouter.use(express.json({ limit: "2kb" }));

const flags = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/flags");

const fail = (res: Response, error: string, status = 400) =>
  res.status(status).json({ ok: false, error });

flagRouter.post("/play", (req, res) => {
  if (!allowRequest("flagPlay", req)) return fail(res, "too_many_attempts", 429);
  const number = Number(req.body?.number);
  const guesses = Array.isArray(req.body?.guesses)
    ? req.body.guesses
        .slice(0, FLAG_TRIES)
        .map((code: unknown) => String(code).slice(0, 2).toLowerCase())
    : [];
  const turn = playFlag(
    req.body?.kind === "outline" ? "outline" : "flag",
    Number.isInteger(number) ? number : null,
    {
      date: String(req.body?.date ?? "").slice(0, 10),
      guesses,
      giveUp: req.body?.giveUp === true,
      count: req.body?.count === true,
    },
    requestIp(req),
  );
  res.json({ ok: true, ...turn });
});

// Jede Flagge darf jeder sehen – welche gesucht ist, verrät die Adresse nicht.
flagRouter.get("/img/:code", (req, res) => {
  const code = String(req.params.code).replace(/\.svg$/, "");
  if (!isFlagCountry(code)) return res.status(404).end();
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(readFileSync(path.join(flags, `${code}.svg`)));
});

// Umriss über die Tag-Nummer: Die Adresse verrät das Land nicht, künftige Tage gibt es nicht.
flagRouter.get("/outline/:number", (req, res) => {
  const code = outlineOf(Number(String(req.params.number).replace(/\.svg$/, "")));
  const svg = code && outlineSvg(code);
  if (!svg) return res.status(404).end();
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(svg);
});
