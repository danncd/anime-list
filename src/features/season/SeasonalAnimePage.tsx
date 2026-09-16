import { useMemo } from "react";
import type { AnimePoster } from "../../contracts/anime";
import { useEntryValue } from "../../ui/entryState";
import type { AnimeSeason, MediaSortKey } from "../../contracts/filters";
import { currentSeason, fetchSeasonPage, seasonOptions } from "../../platform/anilist";
import { usePagedConnection } from "../../ui/usePagedConnection";
import { PosterGrid } from "../shared/PosterGrid";
import { CurrentDot, UpcomingStar } from "./SeasonMark";
import { SeasonPicker } from "./SeasonPicker";
import { MEDIA_SORT_OPTIONS, SortMenu } from "../shared/SortMenu";

export interface SeasonalAnimePageProps {
  readonly onOpenAnime: (animeId: number) => void;
}

/*
Lists any season: the one running, the ones behind it or the ones announced ahead.
Defaults to the current quarter, continuing the Home season row's "See More".
*/
export function SeasonalAnimePage({ onOpenAnime }: SeasonalAnimePageProps) {
  const current = currentSeason();

  /* Rebuilt only when the current season rolls over. */
  const options = useMemo(() => seasonOptions(), [`${current.season}-${current.year}`]);

  /* Per history entry: leaving and returning keeps the chosen season. */
  const [selected, setSelected] = useEntryValue<{ season: AnimeSeason; year: number }>(
    "seasonalAnimeSeason",
    { season: current.season, year: current.year },
  );
  const [sort, setSort] = useEntryValue<{ key: MediaSortKey; descending: boolean }>(
    "seasonalAnimeSort",
    { key: "popularity", descending: true },
  );

  const chosen = options.find(
    (option) => option.season === selected.season && option.year === selected.year,
  );
  const season = usePagedConnection<AnimePoster>(
    `${selected.season}:${selected.year}:${sort.key}:${sort.descending}`,
    null,
    (page) => fetchSeasonPage(selected.season, selected.year, page, sort.key, sort.descending),
  );

  return (
    <div className="browse-page">
      <div className="browse-head">
        <div className="browse-head-left">
          <h1 className="browse-title">Seasonal Anime</h1>
          {/* The season on screen, marked as in the picker. */}
          <span className="home-section-sep" aria-hidden="true">
            •
          </span>
          {chosen && (
            <span className="browse-title-season">
              {chosen.label}
              <span className="browse-mark-slot">
                {chosen.offset > 0 ? <UpcomingStar /> : <CurrentDot />}
              </span>
            </span>
          )}
        </div>

        <div className="browse-controls">
          <SeasonPicker
            options={options}
            season={selected.season}
            year={selected.year}
            onChange={(nextSeason, nextYear) =>
              setSelected({ season: nextSeason, year: nextYear })
            }
          />
          <SortMenu
            label="Filter by:"
            options={MEDIA_SORT_OPTIONS}
            value={sort.key}
            descending={sort.descending}
            onChange={(key, descending) => setSort({ key, descending })}
          />
        </div>
      </div>

      <PosterGrid listing={season} onOpenAnime={onOpenAnime} />
    </div>
  );
}
