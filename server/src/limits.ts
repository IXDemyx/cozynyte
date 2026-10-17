/**
 * Einfache Rate-Limits gegen Scripts: Raumcodes durchprobieren und massenhaft Räume erstellen.
 * Gezählt wird pro IP-Adresse – hinter dem Cloudflare Tunnel steht die echte Adresse im Header
 * cf-connecting-ip, sonst gilt die Adresse der Verbindung.
 */

import type { Socket } from "socket.io";

const LIMITS = {
  /** Beitritt zu einem Raum, den es nicht gibt. */
  join: { max: 10, windowMs: 60_000 },
  /** Neue Räume erstellen. */
  create: { max: 10, windowMs: 10 * 60_000 },
} as const;

type Kind = keyof typeof LIMITS;

const attempts = new Map<string, number[]>();

function clientIp(socket: Socket): string {
  const forwarded = socket.handshake.headers["cf-connecting-ip"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return ip || socket.handshake.address;
}

/** Zählt einen Versuch mit; false = zu viele in kurzer Zeit. */
export function allowAttempt(kind: Kind, socket: Socket): boolean {
  const { max, windowMs } = LIMITS[kind];
  const key = `${kind}:${clientIp(socket)}`;
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
