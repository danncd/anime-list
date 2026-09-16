import { describeError } from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { PosterSkeleton } from "../../ui/PosterSkeleton";
import { PosterRow } from "./PosterRow";
import type { AnimeListState } from "./useAnimeList";

const SKELETON_COUNT = 8;

export interface PosterShelfProps {
  readonly state: AnimeListState;
  readonly onOpen: (animeId: number) => void;
}

export function PosterShelf({ state, onOpen }: PosterShelfProps) {
  /* Rows already loaded stay until the next ones arrive. */
  if (state.items.length > 0) {
    return (
      <div className={state.status === "loading" ? "is-stale" : undefined}>
        <PosterRow items={state.items} onOpen={onOpen} />
      </div>
    );
  }

  if (state.status === "error") {
    return <Note>{describeError(state.error)}</Note>;
  }

  return <PosterSkeleton count={SKELETON_COUNT} className="poster-row" />;
}
