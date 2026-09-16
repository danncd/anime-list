import { useCallback } from "react";
import { useEntryValue } from "../../ui/entryState";
import type { MangaOrigin } from "../../contracts/filters";
import { fetchMangaShelf } from "../../platform/anilist";
import { HomeSection } from "./HomeSection";
import { PosterShelf } from "./PosterShelf";
import { useAnimeList } from "./useAnimeList";

const ORIGINS: readonly { readonly origin: MangaOrigin; readonly label: string }[] = [
  { origin: "JP", label: "Manga" },
  { origin: "KR", label: "Manhwa" },
  { origin: "CN", label: "Manhua" },
];

export interface MangaShelfProps {
  readonly onSeeMore: () => void;
  readonly onOpenAnime: (animeId: number) => void;
}

/*
AniList keeps comics under one type and separates them by country of origin. Each
origin is its own request: a combined top thirty would never show manhua.
*/
export function MangaShelf({ onSeeMore, onOpenAnime }: MangaShelfProps) {
  /* Per history entry: returning to Home restores the chosen origin. */
  const [origin, setOrigin] = useEntryValue<MangaOrigin>("mangaOrigin", "JP");
  const label = ORIGINS.find((entry) => entry.origin === origin)?.label ?? "Manga";

  const load = useCallback(() => fetchMangaShelf(origin), [origin]);
  const state = useAnimeList(load);

  return (
    <HomeSection
      title={`Popular ${label}`}
      onSeeMore={onSeeMore}
      control={
        <div className="origin-switch" role="tablist" aria-label="Origin">
          {ORIGINS.map((entry) => {
            const on = entry.origin === origin;
            return (
              <button
                type="button"
                key={entry.origin}
                role="tab"
                aria-selected={on}
                className={`origin-option${on ? " is-on" : ""}`}
                onClick={() => setOrigin(entry.origin)}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      }
    >
      <PosterShelf state={state} onOpen={onOpenAnime} />
    </HomeSection>
  );
}
