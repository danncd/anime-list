import { useEffect, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { AnimePoster } from "../../contracts/anime";
import { Chevron, Sliders } from "../../ui/icons";
import { useEntryValue } from "../../ui/entryState";
import type { ExploreFilters as Filters } from "../../contracts/filters";
import { fetchExplorePage } from "../../platform/anilist";
import { usePagedConnection } from "../../ui/usePagedConnection";
import { PosterGrid } from "../shared/PosterGrid";
import { ExploreFilters } from "./ExploreFilters";
import { EMPTY_FILTERS } from "../../contracts/filters";

const SEARCH_DEBOUNCE_MS = 350;
const COUNTED_KEYS = ["type", "format", "status", "country", "season", "year"] as const;

export interface ExplorePageProps {
  readonly onOpenAnime: (animeId: number) => void;
}

function activeCount(filters: Filters): number {
  let count = COUNTED_KEYS.filter((key) => filters[key] !== null).length;
  if (filters.genres.length) count += 1;
  if (filters.tags.length) count += 1;
  return count;
}

/*
Everything AniList holds, narrowed by the filter panel. Search and filters are
server-side, and the filters live on the history entry so returning restores them.
*/
export function ExplorePage({ onOpenAnime }: ExplorePageProps) {
  const [filters, setFilters] = useEntryValue<Filters>("exploreFilters", EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [typed, setTyped] = useState(filters.query);

  /*
  The toolbar can hand a query to this page, so the field follows the entry's
  query as well as feeding it.
  */
  useEffect(() => {
    setTyped(filters.query);
  }, [filters.query]);

  /* One request per pause, not one per keystroke. */
  useEffect(() => {
    if (typed === filters.query) return;
    const timer = window.setTimeout(
      () => setFilters({ ...filters, query: typed }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [typed, filters, setFilters]);

  const listing = usePagedConnection<AnimePoster>(JSON.stringify(filters), null, (page) =>
    fetchExplorePage(page, filters),
  );

  const count = activeCount(filters);

  return (
    <div className="browse-page">
      {/* The season pages' head, so the title sits at the same height. */}
      <div className="browse-head">
        <div className="browse-head-left">
          <h1 className="browse-title">Explore All</h1>
          {/* The season pages' separator and suffix styling. */}
          <span className="home-section-sep" aria-hidden="true">
            •
          </span>
          <span className="browse-title-season">Browse all anime and manga</span>
        </div>
      </div>

      <div className="browse-controls">
        <label className="browse-search">
          <MagnifyingGlass />
          <input
            type="search"
            value={typed}
            placeholder="Search by title"
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
        </label>

        <button
          type="button"
          className={`browse-pill${panelOpen ? " is-open" : ""}`}
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((current) => !current)}
        >
          <span className="browse-pill-icon">
            <Sliders />
          </span>
          {/* Narrow panes show the mark alone. */}
          <span className="browse-filters-label">Advanced Filters</span>
          {count > 0 && <span className="browse-count">{count}</span>}
          <span className="browse-pill-chevron">
            <Chevron dir="down" />
          </span>
        </button>
      </div>

      {panelOpen && (
        <div className="browse-filters-panel">
          <ExploreFilters filters={filters} onChange={setFilters} />
          <div className="browse-filters-foot">
            <span className="browse-filters-summary">
              {count === 0 ? "No filters applied" : `${count} filter${count === 1 ? "" : "s"} applied`}
            </span>
            <button
              type="button"
              className="browse-clear"
              disabled={count === 0 && filters.query === ""}
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setTyped("");
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <PosterGrid listing={listing} onOpenAnime={onOpenAnime} />
    </div>
  );
}
