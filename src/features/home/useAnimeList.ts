import { useEffect, useState } from "react";
import type { AnimePoster } from "../../contracts/anime";

export interface AnimeListState {
  readonly status: "loading" | "ready" | "error";
  readonly items: readonly AnimePoster[];
  /* The raw failure; the surface showing it chooses the wording. */
  readonly error: unknown;
}

/* Runs the loader once: callers pass a module-level function, keeping the
   dependency stable across renders. */
export function useAnimeList(
  load: () => Promise<readonly AnimePoster[]>,
): AnimeListState {
  const [state, setState] = useState<AnimeListState>({ status: "loading", items: [], error: null });

  useEffect(() => {
    let active = true;
    /* Existing items stay on screen while the next loader runs. */
    setState((current) => ({ status: "loading", items: current.items, error: null }));
    load().then(
      (items) => {
        if (active) setState({ status: "ready", items, error: null });
      },
      (reason) => {
        /* A failed refresh keeps the existing items and reports through status. */
        if (active) {
          setState((current) => ({
            status: "error",
            items: current.items,
            error: reason,
          }));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [load]);

  return state;
}
