import type { AnimePoster, Page } from "../../contracts/anime";
import type {
  AnimeSeason,
  ExploreFilters,
  MangaOrigin,
  MediaSortKey,
} from "../../contracts/filters";
import { memo } from "./cache";
import { request } from "./client";
import { currentSeason, formatLabel, releaseState, startedOn, type FuzzyDate } from "./vocabulary";

const LIST_SIZE = 30;
/* AniList's page size ceiling for Page connections. */
const SEASON_PAGE_SIZE = 50;

/*
AniList takes the direction as part of the sort value. Client-side ordering is not
an option: only a page is held at a time, so sorting what is loaded would silently
sort a subset.
*/
const SORT_VALUES: Record<MediaSortKey, { readonly asc: string; readonly desc: string }> = {
  popularity: { asc: "POPULARITY", desc: "POPULARITY_DESC" },
  score: { asc: "SCORE", desc: "SCORE_DESC" },
  favourites: { asc: "FAVOURITES", desc: "FAVOURITES_DESC" },
  /*
  "Latest" is the premiere date. UPDATED_AT_DESC looks like the stand-in for
  "latest episode", but every airing record shares one update date, so its order
  is arbitrary.
  */
  latest: { asc: "START_DATE", desc: "START_DATE_DESC" },
};

type MediaSort = "TRENDING_DESC" | "POPULARITY_DESC";

/* One selection, so every listing returns the same read model. The count fields
   are here because a mixed-media listing is merged client-side and only the
   server's own ordering values reproduce its order. */
const MEDIA_FIELDS = `
  id
  title { english romaji }
  coverImage { extraLarge color }
  bannerImage
  averageScore
  popularity
  favourites
  format
  type
  episodes
  chapters
  seasonYear
  startDate { year month day }
  status
`;

const MANGA_SHELF = `
  query MangaShelf($origin: CountryCode, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: MANGA, countryOfOrigin: $origin, sort: POPULARITY_DESC, isAdult: false) {
        id
        title { english romaji }
        coverImage { extraLarge color }
        bannerImage
        averageScore
        popularity
        favourites
        format
        chapters
        startDate { year month day }
        status
      }
    }
  }
`;

interface MangaMedia {
  readonly id: number;
  readonly title: { readonly english: string | null; readonly romaji: string | null };
  readonly coverImage: { readonly extraLarge: string | null; readonly color: string | null };
  readonly bannerImage: string | null;
  readonly averageScore: number | null;
  readonly popularity: number | null;
  readonly favourites: number | null;
  readonly format: string | null;
  readonly chapters: number | null;
  readonly startDate: FuzzyDate | null;
  readonly status: string | null;
}

function toMangaPoster(media: MangaMedia): AnimePoster {
  return {
    id: media.id,
    kind: "manga",
    title: media.title.english ?? media.title.romaji ?? "Untitled",
    cover: media.coverImage.extraLarge ?? "",
    banner: media.bannerImage,
    color: media.coverImage.color,
    score: media.averageScore,
    popularity: media.popularity,
    favourites: media.favourites,
    formatLabel: formatLabel(media.format),
    /* A comic's year is when it started. No count: chapter totals are missing for
       most series and inconsistent where they exist. */
    seasonYear: media.startDate?.year ?? null,
    startedOn: startedOn(media.startDate),
    count: null,
    unit: "ch",
    release: releaseState(media.status),
  };
}

export function fetchMangaShelf(origin: MangaOrigin): Promise<readonly AnimePoster[]> {
  return memo(`manga:${origin}`, () =>
    request(MANGA_SHELF, { origin, perPage: LIST_SIZE }, (data: { Page?: { media?: readonly MangaMedia[] } }) =>
      (data.Page?.media ?? [])
        .filter((media) => media.coverImage.extraLarge)
        .map(toMangaPoster),
    ),
  );
}

const ANIME_LIST = `
  query AnimeList($sort: [MediaSort], $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: $sort, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const SEASON_ANIME = `
  query SeasonAnime($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

interface MediaNode {
  readonly id: number;
  readonly type: string | null;
  readonly title: { readonly english: string | null; readonly romaji: string | null };
  readonly coverImage: { readonly extraLarge: string | null; readonly color: string | null };
  readonly bannerImage: string | null;
  readonly averageScore: number | null;
  readonly popularity: number | null;
  readonly favourites: number | null;
  readonly format: string | null;
  readonly episodes: number | null;
  readonly chapters: number | null;
  readonly seasonYear: number | null;
  readonly startDate: FuzzyDate | null;
  readonly status: string | null;
}

interface ListData {
  readonly Page?: { readonly media?: readonly MediaNode[] };
}

function toPoster(media: MediaNode): AnimePoster {
  const comic = media.type === "MANGA";
  return {
    id: media.id,
    kind: comic ? "manga" : "anime",
    title: media.title.english ?? media.title.romaji ?? "Untitled",
    cover: media.coverImage.extraLarge ?? "",
    banner: media.bannerImage,
    color: media.coverImage.color,
    score: media.averageScore,
    popularity: media.popularity,
    favourites: media.favourites,
    formatLabel: formatLabel(media.format),
    seasonYear: media.seasonYear,
    startedOn: startedOn(media.startDate),
    count: comic ? media.chapters : media.episodes,
    unit: comic ? "ch" : "ep",
    release: releaseState(media.status),
  };
}

function toPosters(data: ListData): readonly AnimePoster[] {
  return (data.Page?.media ?? [])
    .filter((media) => media.coverImage.extraLarge)
    .map(toPoster);
}

function fetchAnimeList(sort: MediaSort): Promise<readonly AnimePoster[]> {
  return memo(`list:${sort}`, () =>
    request(ANIME_LIST, { sort: [sort], perPage: LIST_SIZE }, toPosters),
  );
}

export function fetchTrendingAnime(): Promise<readonly AnimePoster[]> {
  return fetchAnimeList("TRENDING_DESC");
}

export function fetchPopularAnime(): Promise<readonly AnimePoster[]> {
  return fetchAnimeList("POPULARITY_DESC");
}

/* One listing query. AniList ignores season and year when they are null, so
   browsing everything and browsing one quarter share a request shape. */
const MEDIA_PAGE = `
  query MediaPage($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: $sort, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

/* A listing runs to hundreds of titles, so a page at a time. */
function fetchMediaPage(
  season: AnimeSeason | null,
  seasonYear: number | null,
  page: number,
  sort: MediaSortKey,
  descending: boolean,
): Promise<Page<AnimePoster>> {
  const order = descending ? SORT_VALUES[sort].desc : SORT_VALUES[sort].asc;
  const scope = season && seasonYear ? `${season}:${seasonYear}` : "all";
  return memo(`media:${scope}:${page}:${order}`, () =>
    request(
      MEDIA_PAGE,
      { season, seasonYear, page, perPage: SEASON_PAGE_SIZE, sort: [order] },
      (data: ListData & { Page?: { pageInfo?: { hasNextPage: boolean } } }) => ({
        items: toPosters(data),
        hasMore: data.Page?.pageInfo?.hasNextPage ?? false,
      }),
    ),
  );
}

export function fetchCurrentSeasonAnime(): Promise<readonly AnimePoster[]> {
  const { season, year } = currentSeason();
  return memo(`season:${season}:${year}`, () =>
    request(SEASON_ANIME, { season, seasonYear: year, perPage: LIST_SIZE }, toPosters),
  );
}

export function fetchSeasonPage(
  season: AnimeSeason,
  seasonYear: number,
  page: number,
  sort: MediaSortKey,
  descending: boolean,
): Promise<Page<AnimePoster>> {
  return fetchMediaPage(season, seasonYear, page, sort, descending);
}

/*
AniList's enum arguments disagree about null: season null means "no filter", while
countryOfOrigin null means "country is null" and returns nothing, so only set
filters become arguments.
*/
/*
The media query returns anime when type is omitted and rejects a type list, so
"both" is one request per type merged by the value the server ordered each page
by. That is why the poster carries popularity, favourites and a premiere date.
*/
function exploreQuery(type: "ANIME" | "MANGA"): string {
  return `query ExplorePage(
    $page: Int
    $perPage: Int
    $format: MediaFormat
    $status: MediaStatus
    $genres: [String]
    $tags: [String]
    $country: CountryCode
    $season: MediaSeason
    $seasonYear: Int
    $sort: [MediaSort]
    $search: String
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(${[
        `type: ${type}`,
        "format: $format",
        "status: $status",
        "genre_in: $genres",
        "tag_in: $tags",
        "countryOfOrigin: $country",
        "season: $season",
        "seasonYear: $seasonYear",
        "sort: $sort",
        "search: $search",
        "isAdult: false",
      ].join(", ")}) {
        ${MEDIA_FIELDS}
      }
    }
  }`;
}

function exploreVariables(
  page: number,
  filters: ExploreFilters,
): Record<string, unknown> {
  const order = filters.descending
    ? SORT_VALUES[filters.sort].desc
    : SORT_VALUES[filters.sort].asc;
  /* Unset filters are left out of the variables too. */
  const variables: Record<string, unknown> = {
    page,
    perPage: SEASON_PAGE_SIZE,
    sort: [order],
  };
  if (filters.format) variables.format = filters.format;
  if (filters.status) variables.status = filters.status;
  if (filters.genres.length) variables.genres = filters.genres;
  if (filters.tags.length) variables.tags = filters.tags;
  if (filters.country) variables.country = filters.country;
  if (filters.season) variables.season = filters.season;
  if (filters.year !== null) variables.seasonYear = filters.year;
  if (filters.query) variables.search = filters.query;
  return variables;
}

function exploreKey(page: number, type: string, filters: ExploreFilters): string {
  return [
    "explore",
    type,
    page,
    filters.format ?? "",
    filters.status ?? "",
    [...filters.genres].sort().join("+"),
    [...filters.tags].sort().join("+"),
    filters.country ?? "",
    filters.season ?? "",
    filters.year ?? "",
    filters.sort,
    filters.descending ? "desc" : "asc",
    filters.query,
  ].join(":");
}

function fetchExploreType(
  type: "ANIME" | "MANGA",
  page: number,
  filters: ExploreFilters,
): Promise<Page<AnimePoster>> {
  return memo(exploreKey(page, type, filters), () =>
    request(
      exploreQuery(type),
      exploreVariables(page, filters),
      (data: ListData & { Page?: { pageInfo?: { hasNextPage: boolean } } }) => ({
        items: toPosters(data),
        hasMore: data.Page?.pageInfo?.hasNextPage ?? false,
      }),
    ),
  );
}

/*
The value the server ordered each per-type page by. Popularity, favourites and
score orderings contain no nulls, and premiere-date results are all undated, so a
zero default orders the merged list as the server ordered each half.
*/
function orderValue(item: AnimePoster, sort: MediaSortKey): number {
  switch (sort) {
    case "score":
      return item.score ?? 0;
    case "favourites":
      return item.favourites ?? 0;
    case "latest":
      return item.startedOn ?? 0;
    default:
      return item.popularity ?? 0;
  }
}

export async function fetchExplorePage(
  page: number,
  filters: ExploreFilters,
): Promise<Page<AnimePoster>> {
  if (filters.type) return fetchExploreType(filters.type, page, filters);

  /* Both types: one page of each, interleaved by the ordering the server used.
     Sorting by anything else, average score for instance, silently reorders three
     of the four available sorts. */
  const [anime, manga] = await Promise.all([
    fetchExploreType("ANIME", page, filters),
    fetchExploreType("MANGA", page, filters),
  ]);
  const direction = filters.descending ? -1 : 1;
  const merged = [...anime.items, ...manga.items].sort(
    (a, b) => direction * (orderValue(a, filters.sort) - orderValue(b, filters.sort)),
  );
  return { items: merged, hasMore: anime.hasMore || manga.hasMore };
}

/* Search, for the toolbar field. SEARCH_MATCH is AniList's relevance ordering for
   a title query. */
const SEARCH_MEDIA = `
  query SearchMedia($query: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $query, sort: SEARCH_MATCH, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export function fetchSearch(
  query: string,
  limit: number,
): Promise<readonly AnimePoster[]> {
  return memo(`search:${limit}:${query.trim().toLowerCase()}`, () =>
    request(SEARCH_MEDIA, { query: query.trim(), perPage: limit }, (data: ListData) =>
      toPosters(data),
    ),
  );
}

/* The vocabularies the filters offer, taken from AniList rather than derived from
   what is loaded. */
export function fetchGenres(): Promise<readonly string[]> {
  return memo("genres", () =>
    request(`{ GenreCollection }`, {}, (data: { GenreCollection: readonly string[] }) =>
      data.GenreCollection,
    ),
  );
}

export function fetchTags(): Promise<readonly string[]> {
  return memo("tags", () =>
    request(
      `{ MediaTagCollection { name isAdult } }`,
      {},
      (data: { MediaTagCollection: readonly { name: string; isAdult: boolean }[] }) =>
        data.MediaTagCollection.filter((tag) => !tag.isAdult)
          .map((tag) => tag.name)
          .sort((a, b) => a.localeCompare(b)),
    ),
  );
}
