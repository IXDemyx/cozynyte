/** Song-Schnipsel: Anfragen an den Server (HTTP unter /api/snippet, ohne Raum). */

import type { SnippetDaily, SnippetTrack, SnippetTurn } from "../../../../shared/snippet";

type Reply<T> = ({ ok: true } & T) | { ok: false; error: string };

async function request<T>(path: string, body?: unknown): Promise<Reply<T>> {
  try {
    const res = await fetch(`/api/snippet${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as Reply<T>;
  } catch {
    return { ok: false, error: "server_unreachable" };
  }
}

/** Neue Runde. `recent`: zuletzt gespielte Songs, die nicht gleich wiederkommen sollen. */
export const newSnippet = (category: string, recent: number[]) =>
  request<{ id: string }>("/new", { category, recent });

/**
 * Song des Tages – heute oder (`number`) ein früherer Tag aus dem Archiv. `date`, `used`, `done`:
 * bisheriger Stand im Browser für diesen Tag, damit Neuladen nichts verliert.
 */
export const dailySnippet = (number: number | null, date: string, used: number, done: boolean) =>
  request<SnippetDaily>("/daily", { number, date, used, done });

export const searchSnippet = (term: string) =>
  request<{ tracks: SnippetTrack[] }>(`/search?q=${encodeURIComponent(term)}`);

export const guessSnippet = (id: string, trackId: number) =>
  request<SnippetTurn>(`/${id}/guess`, { trackId });

export const skipSnippet = (id: string) => request<SnippetTurn>(`/${id}/skip`, {});

export const audioUrl = (id: string) => `/api/snippet/${id}/audio`;
