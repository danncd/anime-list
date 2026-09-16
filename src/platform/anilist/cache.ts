/*
A short-lived in-memory cache: entries expire so a long window cannot serve a
stale airing countdown, nothing is written to disk because AniList's terms rule
that out, and the in-flight promise is stored so same-tick callers share a request.
*/
const DEFAULT_TTL_MS = 10 * 60 * 1000;

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/*
Matched in order; the first prefix that fits decides the lifetime. Detail is
short-lived because its payload carries the next episode's air time and the
previous one, so a long entry serves a countdown that is hours out of date.
*/
const TTL_BY_PREFIX: readonly (readonly [string, number])[] = [
  ["detail:", 30 * MINUTE],
  ["cast:", 6 * HOUR],
  ["crew:", 6 * HOUR],
  ["suggestions:", 6 * HOUR],
  ["genres", 12 * HOUR],
  ["tags", 12 * HOUR],
  ["schedule:", 30 * MINUTE],
  ["season:", 30 * MINUTE],
  ["explore:", 30 * MINUTE],
  ["list:", 30 * MINUTE],
  ["manga:", 30 * MINUTE],
  ["media:", 30 * MINUTE],
  ["titles:", 30 * MINUTE],
  ["search:", 10 * MINUTE],
];

function ttlFor(key: string): number {
  for (const [prefix, ttl] of TTL_BY_PREFIX) {
    if (key.startsWith(prefix)) return ttl;
  }
  return DEFAULT_TTL_MS;
}

interface Entry {
  readonly value: unknown;
  readonly at: number;
}

const entries = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/*
A long window must not accumulate every page it has seen; the terms rule out
hoarding and the memory is real. Past the limit, expired entries are culled, then
the first-written, since a re-written key keeps its place in a Map.
*/
const MAX_ENTRIES = 400;

function cull(): void {
  if (entries.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of entries) {
    if (now - entry.at >= ttlFor(key)) entries.delete(key);
  }
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next();
    if (oldest.done) break;
    entries.delete(oldest.value);
  }
}

export function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < ttlFor(key)) {
    return Promise.resolve(hit.value as T);
  }

  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const promise = load()
    .then((value) => {
      entries.set(key, { value, at: Date.now() });
      cull();
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
