import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { countEntries, type CustomList, type ListEntryKind } from "../../contracts/lists";
import { describeError, fetchListTitles, toPoster, type ListTitle } from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { PosterSkeleton } from "../../ui/PosterSkeleton";
import { PosterCard } from "../shared/PosterCard";

export interface FavoritesPageProps {
  readonly list: CustomList | null;
  readonly onOpenTitle: (id: number) => void;
  readonly onRemove: (kind: ListEntryKind, id: number) => void;
}

/* Favorites rendered as a grid rather than a table. It offers a search and no
   filters. */
export function FavoritesPage({ list, onOpenTitle, onRemove }: FavoritesPageProps) {
  const [titles, setTitles] = useState<readonly ListTitle[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const entries = list?.entries;

  useEffect(() => {
    if (!entries || entries.length === 0) {
      setTitles([]);
      setError(null);
      setLoading(false);
      return;
    }

    let live = true;
    setError(null);
    setLoading(true);
    fetchListTitles(entries).then(
      (result) => {
        if (!live) return;
        setTitles(result);
        setLoading(false);
      },
      (reason) => {
        if (!live) return;
        setError(reason);
        setLoading(false);
      },
    );

    return () => {
      live = false;
    };
  }, [entries]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return titles;
    return titles.filter((title) => title.title.toLowerCase().includes(needle));
  }, [titles, query]);

  /* The fetched titles know what they are; the entries only guess. */
  const counts = useMemo(() => {
    if (titles.length === 0) {
      return list ? countEntries(list) : { anime: 0, manga: 0, total: 0 };
    }
    let anime = 0;
    let manga = 0;
    for (const title of titles) {
      if (title.kind === "anime") anime += 1;
      else manga += 1;
    }
    return { anime, manga, total: titles.length };
  }, [titles, list]);
  const posters = useMemo(() => visible.map(toPoster), [visible]);

  return (
    <div className="browse-page">
      <div className="browse-head">
        <div className="browse-head-left">
          <h1 className="browse-title">Favorites</h1>
          {counts.total > 0 && (
            <>
              <span className="home-section-sep" aria-hidden="true">
                •
              </span>
              {counts.anime > 0 && <span className="poster-pill">{counts.anime} Anime</span>}
              {counts.manga > 0 && <span className="poster-pill">{counts.manga} Manga</span>}
            </>
          )}
        </div>
      </div>

      <label className="browse-search">
        <MagnifyingGlass />
        <input
          type="search"
          value={query}
          placeholder="Search favorites"
          aria-label="Search favorites"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {error !== null && <Note spaced>{describeError(error)}</Note>}

      {!error && counts.total === 0 && !loading && <Note spaced>Nothing here yet.</Note>}

      {!error && counts.total > 0 && visible.length === 0 && (
        <Note spaced>Nothing matches that search.</Note>
      )}

      {loading && titles.length === 0 ? (
        <PosterSkeleton count={8} className="poster-grid" />
      ) : (
        <div className="poster-grid">
          {posters.map((poster) => (
            <PosterCard
              key={poster.id}
              item={poster}
              onOpen={onOpenTitle}
              onRemove={() => onRemove(poster.kind, poster.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
