import type {
  AiringCountdown,
  AnimeCastMember,
  AnimeCrewMember,
  AnimeDetail,
  AnimeFact,
  AnimeLink,
  AnimeRank,
  AnimeSuggestion,
  AnimeTag,
  AnimeTrailer,
  LibraryBucket,
  Page,
  RelatedEntry,
  ScoreBucket,
} from "../../contracts/anime";
import { memo } from "./cache";
import { request } from "./client";
import {
  cleanText,
  formatLabel,
  fuzzyDateLabel,
  listStatusLabel,
  releaseState,
  seasonLabel,
  relationLabel,
  sourceLabel,
  statusLabel,
  type FuzzyDate,
} from "./vocabulary";

/*
The page size these connections honour. characters, staff and recommendations
each cap at 25; asking for 50 does not error, it silently returns 25.
*/
const PAGE_SIZE = 25;

interface PageInfo {
  readonly hasNextPage: boolean;
}

interface CastEdge {
  readonly role: string;
  readonly node: {
    readonly name: { readonly full: string | null };
    readonly image: { readonly large: string | null };
  };
  readonly voiceActors: readonly {
    readonly name: { readonly full: string | null };
    readonly image: { readonly large: string | null };
  }[];
}

interface CrewEdge {
  readonly role: string;
  readonly node: {
    readonly name: { readonly full: string | null };
    readonly image: { readonly large: string | null };
  };
}

interface SuggestionNode {
  readonly rating: number;
  readonly mediaRecommendation: {
    readonly id: number;
    readonly title: TitleNode;
    readonly coverImage: { readonly large: string | null };
    readonly description: string | null;
    readonly averageScore: number | null;
    readonly format: string | null;
    readonly seasonYear: number | null;
    readonly episodes: number | null;
    readonly genres: readonly string[];
  } | null;
}

interface TitleNode {
  readonly romaji: string | null;
  readonly english: string | null;
  readonly native: string | null;
}

interface CastConnection {
  readonly pageInfo: PageInfo;
  readonly edges: readonly CastEdge[];
}

interface CrewConnection {
  readonly pageInfo: PageInfo;
  readonly edges: readonly CrewEdge[];
}

interface SuggestionConnection {
  readonly pageInfo: PageInfo;
  readonly nodes: readonly SuggestionNode[];
}

/*
The previous episode comes from a separate paged query, because AniList returns
aired episodes oldest-first with no sort on the media field. That lets the
countdown use the real interval rather than an assumed weekly cadence.
*/
const ANIME_DETAIL = `
  query AnimeDetail($id: Int, $now: Int) {
    Media(id: $id) {
      id
      title { romaji english native }
      synonyms
      description(asHtml: false)
      coverImage { extraLarge }
      bannerImage
      trailer { id site thumbnail }
      type
      format
      episodes
      chapters
      volumes
      duration
      status
      season
      seasonYear
      source
      countryOfOrigin
      averageScore
      meanScore
      popularity
      favourites
      genres
      tags { name rank isMediaSpoiler }
      studios { edges { isMain node { name } } }
      startDate { year month day }
      endDate { year month day }
      nextAiringEpisode { episode airingAt }
      stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
      }
      rankings { rank type format year season allTime }
      relations {
        edges {
          relationType
          node {
            id
            type
            format
            title { english romaji }
            coverImage { large }
          }
        }
      }
      externalLinks { site url type }
      recommendations(sort: RATING_DESC, perPage: ${PAGE_SIZE}) {
        pageInfo { hasNextPage }
        nodes {
          rating
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { large }
            description(asHtml: false)
            averageScore
            format
            seasonYear
            episodes
            genres
          }
        }
      }
      characters(sort: [ROLE, RELEVANCE, ID], perPage: ${PAGE_SIZE}) {
        pageInfo { hasNextPage }
        edges {
          role
          node { name { full } image { large } }
          voiceActors(language: JAPANESE) { name { full } image { large } }
        }
      }
      staff(perPage: ${PAGE_SIZE}) {
        pageInfo { hasNextPage }
        edges { role node { name { full } image { large } } }
      }
    }
    past: Page(page: 1, perPage: 1) {
      airingSchedules(mediaId: $id, airingAt_lesser: $now, sort: TIME_DESC) {
        airingAt
      }
    }
  }
`;

const CAST_PAGE = `
  query CastPage($id: Int, $page: Int) {
    Media(id: $id) {
      characters(sort: [ROLE, RELEVANCE, ID], page: $page, perPage: ${PAGE_SIZE}) {
        pageInfo { hasNextPage }
        edges {
          role
          node { name { full } image { large } }
          voiceActors(language: JAPANESE) { name { full } image { large } }
        }
      }
    }
  }
`;

const CREW_PAGE = `
  query CrewPage($id: Int, $page: Int) {
    Media(id: $id) {
      staff(page: $page, perPage: ${PAGE_SIZE}) {
        pageInfo { hasNextPage }
        edges { role node { name { full } image { large } } }
      }
    }
  }
`;

const SUGGESTIONS_PAGE = `
  query SuggestionsPage($id: Int, $page: Int) {
    Media(id: $id) {
      recommendations(sort: RATING_DESC, page: $page, perPage: ${PAGE_SIZE}) {
        pageInfo { hasNextPage }
        nodes {
          rating
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { large }
            description(asHtml: false)
            averageScore
            format
            seasonYear
            episodes
            genres
          }
        }
      }
    }
  }
`;

interface RankingNode {
  readonly rank: number;
  readonly type: string;
  readonly format: string | null;
  readonly year: number | null;
  readonly season: string | null;
  readonly allTime: boolean;
}

interface DetailMedia {
  readonly id: number;
  readonly title: TitleNode;
  readonly synonyms: readonly string[];
  readonly description: string | null;
  readonly coverImage: { readonly extraLarge: string | null };
  readonly bannerImage: string | null;
  readonly trailer: {
    readonly id: string | null;
    readonly site: string;
    readonly thumbnail: string | null;
  } | null;
  readonly type: string | null;
  readonly format: string | null;
  readonly episodes: number | null;
  readonly chapters: number | null;
  readonly volumes: number | null;
  readonly duration: number | null;
  readonly status: string | null;
  readonly season: string | null;
  readonly seasonYear: number | null;
  readonly source: string | null;
  readonly countryOfOrigin: string | null;
  readonly averageScore: number | null;
  readonly meanScore: number | null;
  readonly popularity: number;
  readonly favourites: number;
  readonly genres: readonly string[];
  readonly tags: readonly {
    readonly name: string;
    readonly rank: number;
    readonly isMediaSpoiler: boolean;
  }[];
  readonly studios: {
    readonly edges: readonly { readonly isMain: boolean; readonly node: { readonly name: string } }[];
  };
  readonly startDate: FuzzyDate | null;
  readonly endDate: FuzzyDate | null;
  readonly nextAiringEpisode: { readonly episode: number; readonly airingAt: number } | null;
  readonly stats: {
    readonly scoreDistribution: readonly { readonly score: number; readonly amount: number }[];
    readonly statusDistribution: readonly { readonly status: string; readonly amount: number }[];
  };
  readonly rankings: readonly RankingNode[];
  readonly relations: {
    readonly edges: readonly {
      readonly relationType: string | null;
      readonly node: {
        readonly id: number;
        readonly type: string | null;
        readonly format: string | null;
        readonly title: { readonly english: string | null; readonly romaji: string | null };
        readonly coverImage: { readonly large: string | null };
      };
    }[];
  };
  readonly externalLinks: readonly {
    readonly site: string;
    readonly url: string;
    readonly type: string | null;
  }[];
  readonly recommendations: SuggestionConnection;
  readonly characters: CastConnection;
  readonly staff: CrewConnection;
}

interface DetailData {
  readonly Media: DetailMedia | null;
  readonly past: { readonly airingSchedules: readonly { readonly airingAt: number }[] };
}

function roleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function rankLabel(ranking: RankingNode): string {
  const basis = ranking.type === "RATED" ? "Highest rated" : "Most popular";
  if (ranking.allTime) return `${basis} · all time`;
  if (ranking.season) return `${basis} · ${seasonLabel(ranking.season, ranking.year)}`;
  if (ranking.year !== null) return `${basis} · ${ranking.year}`;
  return basis;
}

function toCast(connection: CastConnection): Page<AnimeCastMember> {
  return {
    hasMore: connection.pageInfo.hasNextPage,
    items: connection.edges.map((edge) => {
      const actor = edge.voiceActors[0];
      return {
        name: edge.node.name.full ?? "Unknown",
        image: edge.node.image.large ?? "",
        role: roleLabel(edge.role),
        actor: actor?.name.full ?? null,
        actorImage: actor?.image.large ?? null,
      };
    }),
  };
}

/* AniList returns one staff row per credit, so the same person repeats. */
function toCrew(connection: CrewConnection): Page<AnimeCrewMember> {
  const byName = new Map<string, { image: string; roles: string[] }>();
  for (const edge of connection.edges) {
    const name = edge.node.name.full ?? "Unknown";
    const existing = byName.get(name);
    if (existing) {
      if (!existing.roles.includes(edge.role)) existing.roles.push(edge.role);
    } else {
      byName.set(name, { image: edge.node.image.large ?? "", roles: [edge.role] });
    }
  }
  return {
    hasMore: connection.pageInfo.hasNextPage,
    items: [...byName].map(([name, person]) => ({
      name,
      image: person.image,
      roles: person.roles,
    })),
  };
}

function toSuggestions(connection: SuggestionConnection): Page<AnimeSuggestion> {
  const items: AnimeSuggestion[] = [];
  for (const node of connection.nodes) {
    const item = node.mediaRecommendation;
    if (!item) continue;
    items.push({
      id: item.id,
      title: item.title.english ?? item.title.romaji ?? "Untitled",
      cover: item.coverImage.large ?? "",
      score: item.averageScore,
      formatLabel: formatLabel(item.format),
      year: item.seasonYear,
      episodes: item.episodes,
      genres: item.genres.slice(0, 3),
      blurb: cleanText(item.description).slice(0, 240),
      votes: node.rating,
    });
  }
  return { hasMore: connection.pageInfo.hasNextPage, items };
}

/* Every relation arrives in one unpaged response, so nothing here is a connection. */
function toRelated(media: DetailMedia): readonly RelatedEntry[] {
  const entries: RelatedEntry[] = [];
  for (const edge of media.relations.edges) {
    const node = edge.node;
    const title = node.title.english ?? node.title.romaji;
    if (!title || !node.coverImage.large) continue;
    entries.push({
      id: node.id,
      kind: node.type === "MANGA" ? "manga" : "anime",
      title,
      cover: node.coverImage.large,
      formatLabel: formatLabel(node.format),
      relationLabel: relationLabel(edge.relationType) ?? "Related",
    });
  }
  return entries;
}

function toTags(media: DetailMedia): readonly AnimeTag[] {
  return [...media.tags]
    .sort((a, b) => b.rank - a.rank)
    .map((tag) => ({ name: tag.name, rank: tag.rank, spoiler: tag.isMediaSpoiler }));
}

function toFacts(media: DetailMedia): readonly AnimeFact[] {
  /* AniList files comics under the same type, so the sheet must know which one it
     describes. */
  const comic = media.type === "MANGA";
  const studios: string[] = [];
  const producers: string[] = [];
  for (const edge of media.studios.edges) {
    (edge.isMain ? studios : producers).push(edge.node.name);
  }
  const facts: readonly AnimeFact[] = [
    { label: "Japanese", value: media.title.native ?? "—" },
    { label: "Romaji", value: media.title.romaji ?? "—" },
    { label: "Type", value: formatLabel(media.format) ?? "—" },
    ...(comic
      ? [
          { label: "Chapters", value: media.chapters === null ? "?" : String(media.chapters) },
          { label: "Volumes", value: media.volumes === null ? "—" : String(media.volumes) },
        ]
      : [
          { label: "Episodes", value: media.episodes === null ? "?" : String(media.episodes) },
          { label: "Duration", value: media.duration === null ? "—" : `${media.duration} min` },
        ]),
    { label: "Status", value: statusLabel(media.status) },
    {
      label: comic ? "Published" : "Aired",
      value: `${fuzzyDateLabel(media.startDate)} – ${fuzzyDateLabel(media.endDate)}`,
    },
    /* A comic has no season to have premiered in. */
    ...(comic ? [] : [{ label: "Premiered", value: seasonLabel(media.season, media.seasonYear) }]),
    { label: "Source", value: sourceLabel(media.source) },
    { label: "Country", value: media.countryOfOrigin ?? "—" },
    { label: "Studios", value: studios.join(", ") || "—" },
    { label: "Producers", value: producers.slice(0, 3).join(", ") || "—" },
    { label: "Genres", value: media.genres.join(", ") || "—" },
    { label: "Synonyms", value: media.synonyms.slice(0, 2).join(", ") || "—" },
  ];
  return facts.map((fact) => (fact.value === "" ? { ...fact, value: "—" } : fact));
}

function toRanks(media: DetailMedia): readonly AnimeRank[] {
  return media.rankings.map((ranking) => ({
    rank: ranking.rank,
    label: rankLabel(ranking),
    basis: ranking.type === "RATED" ? "By score" : "By popularity",
    formatLabel: formatLabel(ranking.format),
  }));
}

function toScores(media: DetailMedia): readonly ScoreBucket[] {
  return media.stats.scoreDistribution.map((bucket) => ({
    score: bucket.score,
    amount: bucket.amount,
  }));
}

function toLibraries(media: DetailMedia): readonly LibraryBucket[] {
  return media.stats.statusDistribution.map((bucket) => ({
    label: listStatusLabel(bucket.status),
    amount: bucket.amount,
  }));
}

function toAiring(media: DetailMedia, previousAt: number | null): AiringCountdown | null {
  if (media.status !== "RELEASING" || !media.nextAiringEpisode) return null;
  return {
    episode: media.nextAiringEpisode.episode,
    airsAt: media.nextAiringEpisode.airingAt,
    previousAt,
  };
}

function toLinks(media: DetailMedia): readonly AnimeLink[] {
  const seen = new Set<string>();
  const links: AnimeLink[] = [];
  for (const link of media.externalLinks) {
    if (!link.url || seen.has(link.url)) continue;
    seen.add(link.url);
    links.push({
      site: link.site,
      url: link.url,
      kind: link.type === "STREAMING" ? "stream" : "info",
    });
  }
  /* Streamable links first. */
  return links.sort((a, b) => Number(b.kind === "stream") - Number(a.kind === "stream"));
}

/* Only YouTube trailers carry a usable watch URL. */
function toTrailer(trailer: DetailMedia["trailer"]): AnimeTrailer | null {
  if (!trailer?.id || !trailer.thumbnail) return null;
  if (trailer.site.toLowerCase() !== "youtube") return null;
  return {
    thumbnail: trailer.thumbnail,
    url: `https://www.youtube.com/watch?v=${trailer.id}`,
  };
}

function toDetail(data: DetailData): AnimeDetail {
  const media = data.Media;
  if (!media) throw new Error("AniList returned no media");

  const title = media.title.english ?? media.title.romaji ?? "Untitled";
  const altTitles = [media.title.romaji !== title ? media.title.romaji : null, media.title.native]
    .filter((value): value is string => Boolean(value))
    .join("  ·  ");

  return {
    id: media.id,
    kind: media.type === "MANGA" ? "manga" : "anime",
    title,
    altTitles,
    synopsis: cleanText(media.description),
    cover: media.coverImage.extraLarge ?? "",
    banner: media.bannerImage,
    release: releaseState(media.status),
    releaseLabel: statusLabel(media.status),
    formatLabel: formatLabel(media.format),
    episodes: media.episodes,
    duration: media.duration,
    score: media.averageScore,
    meanScore: media.meanScore,
    popularity: media.popularity,
    favourites: media.favourites,
    trailer: toTrailer(media.trailer),
    links: toLinks(media),
    facts: toFacts(media),
    tags: toTags(media),
    related: toRelated(media),
    cast: toCast(media.characters),
    crew: toCrew(media.staff),
    suggestions: toSuggestions(media.recommendations),
    ranks: toRanks(media),
    scores: toScores(media),
    libraries: toLibraries(media),
    airing: toAiring(media, data.past.airingSchedules[0]?.airingAt ?? null),
  };
}

export function fetchAnimeDetail(id: number): Promise<AnimeDetail> {
  return memo(`detail:${id}`, () =>
    request(ANIME_DETAIL, { id, now: Math.floor(Date.now() / 1000) }, toDetail),
  );
}

/* One connection page past the first, for the "show more" controls. */
export function fetchCastPage(id: number, page: number): Promise<Page<AnimeCastMember>> {
  return memo(`cast:${id}:${page}`, () =>
    request<{ Media: { characters: CastConnection } | null }, Page<AnimeCastMember>>(
      CAST_PAGE,
      { id, page },
      (data) => {
        if (!data.Media) throw new Error("AniList returned no media");
        return toCast(data.Media.characters);
      },
    ),
  );
}

export function fetchCrewPage(id: number, page: number): Promise<Page<AnimeCrewMember>> {
  return memo(`crew:${id}:${page}`, () =>
    request<{ Media: { staff: CrewConnection } | null }, Page<AnimeCrewMember>>(
      CREW_PAGE,
      { id, page },
      (data) => {
        if (!data.Media) throw new Error("AniList returned no media");
        return toCrew(data.Media.staff);
      },
    ),
  );
}

export function fetchSuggestionsPage(
  id: number,
  page: number,
): Promise<Page<AnimeSuggestion>> {
  return memo(`suggestions:${id}:${page}`, () =>
    request<{ Media: { recommendations: SuggestionConnection } | null }, Page<AnimeSuggestion>>(
      SUGGESTIONS_PAGE,
      { id, page },
      (data) => {
        if (!data.Media) throw new Error("AniList returned no media");
        return toSuggestions(data.Media.recommendations);
      },
    ),
  );
}
