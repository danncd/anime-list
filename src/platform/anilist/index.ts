/*
Public surface of the AniList adapter. Callers above depend on these functions
and the contracts they return, never on AniList itself.
*/
export { currentSeason, seasonOptions, type SeasonRef } from "./vocabulary";
export {
  COUNTRY_LABELS,
  FORMAT_LABELS,
  SEASON_LABELS,
  SEASON_ORDER,
  SORT_LABELS,
  SORT_ORDER,
  STATUS_LABELS,
  statusLabel,
} from "./vocabulary";
export {
  fetchCurrentSeasonAnime,
  fetchExplorePage,
  fetchGenres,
  fetchTags,
  fetchMangaShelf,
  fetchSeasonPage,
  fetchPopularAnime,
  fetchTrendingAnime,
} from "./list";
export {
  fetchAnimeDetail,
  fetchCastPage,
  fetchCrewPage,
  fetchSuggestionsPage,
} from "./detail";
export { fetchSchedule } from "./schedule";
export { fetchSearch } from "./list";
export { fetchListTitles, toPoster, type ListTitle } from "./titles";
export { describeError } from "./client";
