/**
 * Einfache Rate-Limits gegen Scripts: Raumcodes durchprobieren, massenhaft Räume erstellen und
 * Song-Schnipsel (ohne Raum, daher nur pro IP) mit Anfragen fluten.
 * Gezählt wird pro IP-Adresse – hinter dem Cloudflare Tunnel steht die echte Adresse im Header
 * cf-connecting-ip, sonst gilt die Adresse der Verbindung.
 */

import type { Request } from "express";
import type { Socket } from "socket.io";

const LIMITS = {
  /** Beitritt zu einem Raum, den es nicht gibt. */
  join: { max: 10, windowMs: 60_000 },
  /** Neue Räume erstellen. */
  create: { max: 10, windowMs: 10 * 60_000 },
  /** Song-Schnipsel: neuer Song, Songsuche, Tipp oder Überspringen. */
  snippetNew: { max: 40, windowMs: 10 * 60_000 },
  snippetSearch: { max: 20, windowMs: 30_000 },
  snippetGuess: { max: 60, windowMs: 60_000 },
} as const;

type Kind = keyof typeof LIMITS;

const attempts = new Map<string, number[]>();

function clientIp(headers: Record<string, string | string[] | undefined>, address: string): string {
  const forwarded = headers["cf-connecting-ip"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return ip || address;
}

/** Zählt einen Versuch mit; false = zu viele in kurzer Zeit. */
export function allowAttempt(kind: Kind, socket: Socket): boolean {
  return allowIp(kind, clientIp(socket.handshake.headers, socket.handshake.address));
}

/** IP-Adresse einer HTTP-Anfrage (hinter dem Tunnel aus cf-connecting-ip). */
export function requestIp(req: Request): string {
  return clientIp(req.headers, req.socket.remoteAddress ?? "");
}

/** Dasselbe für HTTP-Anfragen (Song-Schnipsel). */
export function allowRequest(kind: Kind, req: Request): boolean {
  return allowIp(kind, requestIp(req));
}

function allowIp(kind: Kind, ip: string): boolean {
  const { max, windowMs } = LIMITS[kind];
  const key = `${kind}:${ip}`;
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= max) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

// Alte Einträge regelmäßig wegräumen, damit die Map nicht wächst.
setInterval(() => {
  const now = Date.now();
  for (const [key, list] of attempts) {
    const windowMs = LIMITS[key.split(":")[0] as Kind]?.windowMs ?? 0;
    const recent = list.filter((at) => now - at < windowMs);
    if (recent.length) attempts.set(key, recent);
    else attempts.delete(key);
  }
}, 60_000).unref();
