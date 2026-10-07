import type { Track } from "../../shared/types";

const BASE = process.env.ITUNES_BASE ?? "https://itunes.apple.com";
const COUNTRY = process.env.ITUNES_COUNTRY ?? "DE";

/** Zuletzt gesehene Tracks – Clients schicken nur die ID, die Daten kommen von hier. */
const cache = new Map<number, Track>();
const MAX_CACHE = 5000;

interface ItunesResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

export async function searchTracks(term: string): Promise<Track[]> {
  const url = `${BASE}/search?media=music&entity=song&limit=15&country=${COUNTRY}&term=${encodeURIComponent(term)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const data = (await res.json()) as { results?: ItunesResult[] };

  const tracks: Track[] = [];
  for (const r of data.results ?? []) {
    if (!r.trackId || !r.trackName || !r.artistName || !r.previewUrl) continue;
    const track: Track = {
      id: r.trackId,
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName ?? "",
      artwork: (r.artworkUrl100 ?? "").replace("100x100", "300x300"),
      previewUrl: r.previewUrl,
    };
    tracks.push(track);
    cache.delete(track.id);
    cache.set(track.id, track);
  }
  while (cache.size > MAX_CACHE) {
    cache.delete(cache.keys().next().value as number);
  }
  return tracks;
}

export function getCachedTrack(id: number): Track | undefined {
  return cache.get(id);
}
