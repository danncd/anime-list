import { useEffect, useState } from "react";
import type { AnimeDetail } from "../../contracts/anime";
import { fetchAnimeDetail } from "../../platform/anilist";

export type AnimeDetailState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly error: unknown }
  | { readonly status: "ready"; readonly detail: AnimeDetail };

/* Re-runs when the id changes, and ignores a response that arrives after the
   view has moved on. */
export function useAnimeDetail(animeId: number): AnimeDetailState {
  const [state, setState] = useState<AnimeDetailState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    fetchAnimeDetail(animeId).then(
      (detail) => {
        if (active) setState({ status: "ready", detail });
      },
      (reason) => {
        if (active) setState({ status: "error", error: reason });
      },
    );
    return () => {
      active = false;
    };
  }, [animeId]);

  return state;
}
