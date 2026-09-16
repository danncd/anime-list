import type { ReleaseState } from "../../contracts/anime";
import type { AnimeSeason, MediaSortKey } from "../../contracts/filters";

/*
AniList's vocabulary reduced to the strings the UI shows, so the contracts stay
free of AniList enumerations. Each table below is the single source for its enum.
*/

export const FORMAT_LABELS: Readonly<Record<string, string>> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
  /* Comics share this field: AniList files all three origins under MANGA. */
  MANGA: "Manga",
  NOVEL: "Novel",
  ONE_SHOT: "One Shot",
};

/* Each status has a full name and a shorter form for menus of short options; both
   live here so they cannot drift apart. */
export const STATUS_LABELS: Readonly<Record<string, { readonly label: string; readonly short: string }>> = {
  RELEASING: { label: "Currently airing", short: "Airing" },
  FINISHED: { label: "Finished", short: "Finished" },
  NOT_YET_RELEASED: { label: "Not yet aired", short: "Not yet aired" },
  CANCELLED: { label: "Cancelled", short: "Cancelled" },
  HIATUS: { label: "Hiatus", short: "Hiatus" },
};

const LIST_STATUS_LABELS: Readonly<Record<string, string>> = {
  CURRENT: "Watching",
  PLANNING: "Planning",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PAUSED: "Paused",
};

export const SEASON_LABELS: Readonly<Record<AnimeSeason, string>> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

/* Country of origin, which is how the comics are separated. */
export const COUNTRY_LABELS: Readonly<Record<string, string>> = {
  JP: "Japan",
  KR: "Korea",
  CN: "China",
  TW: "Taiwan",
  US: "United States",
};

/* The names and the order of the four ways a listing can be ordered. */
export const SORT_LABELS: Readonly<Record<MediaSortKey, string>> = {
  popularity: "Popularity",
  score: "Score",
  favourites: "Favourites",
  latest: "Latest",
};

export const SORT_ORDER: readonly MediaSortKey[] = [
  "popularity",
  "score",
  "favourites",
  "latest",
];

export interface SeasonInfo {
  readonly season: AnimeSeason;
  readonly year: number;
  readonly label: string;
}

export interface SeasonRef extends SeasonInfo {
  /* The season name without the year, for lists that group by it. */
  readonly name: string;
  /* Quarters from the season running now: 0 is this one, positive has not
     started yet. */
  readonly offset: number;
}

/* The quarters in the order a year runs them. */
export const SEASON_ORDER: readonly AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

/* How far ahead AniList lists anything at all. */
const SEASONS_AHEAD = 4;
/* Anime reaches back further, but seasons before this thin out to a handful of
   records; this is the picker's floor. */
const OLDEST_SEASON_YEAR = 1980;

/* AniList quarters are the calendar's: Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec. */
function seasonAt(offset: number): SeasonRef {
  const now = new Date();
  const index = Math.floor(now.getMonth() / 3) + offset;
  const year = now.getFullYear() + Math.floor(index / 4);
  const season = SEASON_ORDER[((index % 4) + 4) % 4] ?? "WINTER";
  return {
    season,
    year,
    name: SEASON_LABELS[season],
    label: `${SEASON_LABELS[season]} ${year}`,
    offset,
  };
}

/* Every quarter the picker offers, newest first and grouped by year. Generated
   rather than listed, so it rolls forward instead of going stale. */
export function seasonOptions(): readonly SeasonRef[] {
  const now = new Date();
  const oldestYear = OLDEST_SEASON_YEAR;
  const currentIndex = Math.floor(now.getMonth() / 3);
  const currentYear = now.getFullYear();
  const options: SeasonRef[] = [];

  for (let year = currentYear + 1; year >= oldestYear; year -= 1) {
    for (let index = SEASON_ORDER.length - 1; index >= 0; index -= 1) {
      const offset = (year - currentYear) * 4 + (index - currentIndex);
      if (offset > SEASONS_AHEAD) continue;
      const season = SEASON_ORDER[index] ?? "WINTER";
      options.push({
        season,
        year,
        name: SEASON_LABELS[season],
        label: `${SEASON_LABELS[season]} ${year}`,
        offset,
      });
    }
  }
  return options;
}

const RELATION_LABELS: Readonly<Record<string, string>> = {
  ADAPTATION: "Adaptation",
  PREQUEL: "Prequel",
  SEQUEL: "Sequel",
  PARENT: "Parent",
  SIDE_STORY: "Side story",
  CHARACTER: "Character",
  SUMMARY: "Summary",
  ALTERNATIVE: "Alternative",
  SPIN_OFF: "Spin-off",
  COMPILATION: "Compilation",
  CONTAINS: "Contains",
  OTHER: "Other",
};

export function relationLabel(value: string | null): string | null {
  if (!value) return null;
  return RELATION_LABELS[value] ?? value;
}

export function formatLabel(format: string | null): string | null {
  if (!format) return null;
  return FORMAT_LABELS[format] ?? format;
}

export function releaseState(status: string | null): ReleaseState {
  if (status === "RELEASING") return "airing";
  if (status === "NOT_YET_RELEASED") return "upcoming";
  if (status === "FINISHED") return "finished";
  return "other";
}

/* Chooses between the full label and the short form; see STATUS_LABELS. */
export function statusLabel(status: string | null, form: "label" | "short" = "label"): string {
  if (!status) return "Unknown";
  const entry = STATUS_LABELS[status];
  if (!entry) return status;
  return form === "short" ? entry.short : entry.label;
}

export function listStatusLabel(status: string): string {
  return LIST_STATUS_LABELS[status] ?? status;
}

export function sourceLabel(source: string | null): string {
  return source ? source.replace(/_/g, " ").toLowerCase() : "—";
}

export function currentSeason(): SeasonInfo {
  return seasonAt(0);
}

export function seasonLabel(season: string | null, year: number | null): string {
  if (!season) return year === null ? "—" : String(year);
  const key = season as AnimeSeason;
  const name = SEASON_LABELS[key] ?? season;
  return year === null ? name : `${name} ${year}`;
}

export interface FuzzyDate {
  readonly year: number | null;
  readonly month: number | null;
  readonly day: number | null;
}

/* AniList dates are partial, so anything past the missing part is dropped. */
export function fuzzyDateLabel(date: FuzzyDate | null): string {
  if (!date?.year) return "?";
  const month = date.month;
  const day = date.day;
  if (month === null) return String(date.year);
  const pad = (value: number) => String(value).padStart(2, "0");
  if (day === null) return `${date.year}-${pad(month)}`;
  return `${date.year}-${pad(month)}-${pad(day)}`;
}

/*
The same date as a yyyymmdd ordinal, or null when there is no year. Missing parts
are zero, so a mixed-media "latest" ordering can merge partial dates within their
year.
*/
export function startedOn(date: FuzzyDate | null): number | null {
  if (!date?.year) return null;
  return date.year * 10000 + (date.month ?? 0) * 100 + (date.day ?? 0);
}

/* Descriptions arrive with some HTML and hard-wrapped whitespace. */
export function cleanText(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?i>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
