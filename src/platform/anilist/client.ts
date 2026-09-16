/*
GraphQL transport for AniList: the endpoint allows cross-origin POSTs, so the
renderer calls it directly. Requests are queued for AniList's burst limiter, and a
429 pauses every request since the limit is per IP.
*/
const ENDPOINT = "https://graphql.anilist.co";

const CONCURRENCY = 4;
const GAP_MS = 60;
/* AniList's timeout after a 429 is a minute; Retry-After is usually 30. */
const FALLBACK_PAUSE_MS = 60_000;
const MAX_RETRIES = 1;
/* A request that never settles must not hold its slot for the life of the app. */
const TIMEOUT_MS = 20_000;

class AniListError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AniListError";
  }
}

/*
What to say when a request fails. A rate limit is the failure this app meets most,
and it is distinct from the network being down or the API returning an error.
*/
export function describeError(error: unknown): string {
  if (error instanceof AniListError) {
    return error.status === 429
      ? "AniList is rate limiting requests. Try again in a minute."
      : "AniList could not answer that request.";
  }
  return "Could not reach AniList.";
}

let inFlight = 0;
let lastDispatch = 0;
let pausedUntil = 0;
const waiting: (() => void)[] = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquire(): Promise<void> {
  /*
  Queue when no slot is free or somebody is already waiting. A woken waiter must
  be the only caller that can take the freed slot, or a newcomer can race it and
  starve it.
  */
  if (inFlight >= CONCURRENCY || waiting.length > 0) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  inFlight += 1;

  /*
  Reserve the slot before awaiting: reading lastDispatch, sleeping then writing it
  lets every caller in the same tick read the same stale value and dispatch
  together.
  */
  const now = Date.now();
  const at = Math.max(now, lastDispatch + GAP_MS, pausedUntil);
  lastDispatch = at;

  const wait = at - now;
  if (wait > 0) await sleep(wait);
}

function release(): void {
  inFlight -= 1;
  waiting.shift()?.();
}

interface GraphQlResponse<TData> {
  readonly data?: TData;
  readonly errors?: readonly { readonly message: string }[];
}

export async function request<TData, TResult>(
  document: string,
  variables: Readonly<Record<string, unknown>>,
  pick: (data: TData) => TResult,
): Promise<TResult> {
  for (let attempt = 0; ; attempt += 1) {
    await acquire();

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: document, variables }),
        /* Bounded, so four requests that hang cannot stall the queue forever. */
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status === 429) {
        const header = Number(response.headers.get("Retry-After"));
        const pause =
          Number.isFinite(header) && header > 0 ? header * 1000 : FALLBACK_PAUSE_MS;
        pausedUntil = Math.max(pausedUntil, Date.now() + pause);
        if (attempt < MAX_RETRIES) continue;
        throw new AniListError("AniList is rate limiting requests", 429);
      }

      if (!response.ok) {
        throw new AniListError(`AniList responded ${response.status}`, response.status);
      }

      const payload = (await response.json()) as GraphQlResponse<TData>;
      const firstError = payload.errors?.[0];
      if (firstError) {
        throw new AniListError(firstError.message, 200);
      }
      if (!payload.data) {
        throw new AniListError("AniList returned no data", 200);
      }
      return pick(payload.data);
    } finally {
      release();
    }
  }
}
