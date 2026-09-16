import type { ListEntryKind } from "./lists";

export type { ListEntryKind } from "./lists";

export type ReleaseState = "airing" | "upcoming" | "finished" | "other";

/* A poster-sized title row. Every field is already a display value, so no AniList
   enumeration reaches the UI. */
export interface AnimePoster {
  readonly id: number;
  readonly kind: ListEntryKind;
  readonly title: string;
  readonly cover: string;
  readonly banner: string | null;
  readonly color: string | null;
  readonly score: number | null;
  /* Carried for mixed-media orderings, where the server sorts each type separately
     and the client interleaves them. */
  readonly popularity: number | null;
  readonly favourites: number | null;
  readonly formatLabel: string | null;
  readonly seasonYear: number | null;
  /* Premiere date as a yyyymmdd ordinal, or null when AniList has no year. A
     mixed-media "latest" ordering is merged by this value. */
  readonly startedOn: number | null;
  /* The count and its unit: episodes for a series, chapters for a comic. */
  readonly count: number | null;
  readonly unit: "ep" | "ch";
  readonly release: ReleaseState;
}

/* The detail read model. Like AnimePoster, every field is already display-ready. */

export interface AnimeTag {
  readonly name: string;
  readonly rank: number;
  readonly spoiler: boolean;
}

export interface AnimeCastMember {
  readonly name: string;
  readonly image: string;
  readonly role: string;
  readonly actor: string | null;
  readonly actorImage: string | null;
}

/* One person with every credit, since AniList returns a row per role. */
export interface AnimeCrewMember {
  readonly name: string;
  readonly image: string;
  readonly roles: readonly string[];
}

export interface AnimeSuggestion {
  readonly id: number;
  readonly title: string;
  readonly cover: string;
  readonly score: number | null;
  readonly formatLabel: string | null;
  readonly year: number | null;
  readonly episodes: number | null;
  readonly genres: readonly string[];
  readonly blurb: string;
  readonly votes: number;
}

export interface AnimeRank {
  readonly rank: number;
  readonly label: string;
  readonly basis: string;
  readonly formatLabel: string | null;
}

export interface ScoreBucket {
  readonly score: number;
  readonly amount: number;
}

export interface LibraryBucket {
  readonly label: string;
  readonly amount: number;
}

export interface AnimeFact {
  readonly label: string;
  readonly value: string;
}

/* One page of a connection. pageInfo.total is capped rather than counted, so
   hasMore, from hasNextPage, is the only trustworthy signal. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly hasMore: boolean;
}

/* A place the title can be watched or read about. */
export interface AnimeLink {
  readonly site: string;
  readonly url: string;
  readonly kind: "stream" | "info";
}

/* An edge to a related title: source manga, sequel, spin-off. */
export interface RelatedEntry {
  readonly id: number;
  readonly kind: "anime" | "manga";
  readonly title: string;
  readonly cover: string;
  readonly formatLabel: string | null;
  readonly relationLabel: string;
}

/* One episode airing at a known time. */
export interface AiringEntry {
  readonly id: number;
  readonly animeId: number;
  readonly title: string;
  readonly cover: string;
  readonly formatLabel: string | null;
  readonly episode: number;
  /* Unix seconds. */
  readonly airsAt: number;
}

/* Opened in the user's browser. */
export interface AnimeTrailer {
  readonly thumbnail: string;
  readonly url: string;
}

/* Present only while a title is airing and AniList knows the next episode. */
export interface AiringCountdown {
  readonly episode: number;
  /* Unix seconds. */
  readonly airsAt: number;
  readonly previousAt: number | null;
}

export interface AnimeDetail {
  readonly id: number;
  readonly kind: ListEntryKind;
  readonly title: string;
  readonly altTitles: string;
  readonly synopsis: string;
  readonly cover: string;
  /* Wide art, only used on narrow panes. */
  readonly banner: string | null;
  readonly release: ReleaseState;
  readonly releaseLabel: string;
  readonly formatLabel: string | null;
  readonly episodes: number | null;
  readonly duration: number | null;
  readonly score: number | null;
  readonly meanScore: number | null;
  readonly popularity: number;
  readonly favourites: number;
  readonly trailer: AnimeTrailer | null;
  readonly links: readonly AnimeLink[];
  readonly facts: readonly AnimeFact[];
  readonly tags: readonly AnimeTag[];
  /* Anime and manga in one list. */
  readonly related: readonly RelatedEntry[];
  readonly cast: Page<AnimeCastMember>;
  readonly crew: Page<AnimeCrewMember>;
  readonly suggestions: Page<AnimeSuggestion>;
  readonly ranks: readonly AnimeRank[];
  readonly scores: readonly ScoreBucket[];
  readonly libraries: readonly LibraryBucket[];
  readonly airing: AiringCountdown | null;
}
