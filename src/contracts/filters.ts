/*
The listing vocabulary and the filter model behind Explore All, the season pages
and the Home rows. The values are display-oriented ("popularity", "JP",
"WINTER"), so nothing here is an AniList enumeration.
*/

/* Which quarter a title premiered in. AniList's quarters are the calendar's. */
export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

/* The ways a listing can be ordered. */
export type MediaSortKey = "popularity" | "score" | "favourites" | "latest";

/* AniList files all comics as MANGA; the country of origin separates manga,
   manhwa and manhua. */
export type MangaOrigin = "JP" | "KR" | "CN";

export interface ExploreFilters {
  /* null asks for both types, which is one request per type and a merge. */
  readonly type: "ANIME" | "MANGA" | null;
  readonly format: string | null;
  readonly status: string | null;
  readonly genres: readonly string[];
  readonly tags: readonly string[];
  readonly country: string | null;
  readonly season: AnimeSeason | null;
  readonly year: number | null;
  readonly sort: MediaSortKey;
  readonly descending: boolean;
  /* Searched on the server, so it reaches past what is loaded. */
  readonly query: string;
}

/* The one shape of an untouched filter set. */
export const EMPTY_FILTERS: ExploreFilters = {
  type: null,
  format: null,
  status: null,
  genres: [],
  tags: [],
  country: null,
  season: null,
  year: null,
  sort: "popularity",
  descending: true,
  query: "",
};
