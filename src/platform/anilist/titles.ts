import type { AnimePoster, ReleaseState } from "../../contracts/anime";
import type { ListEntry, ListEntryKind } from "../../contracts/lists";
import { memo } from "./cache";
import { request } from "./client";
import { formatLabel, releaseState, startedOn, type FuzzyDate } from "./vocabulary";

/* A title as a list needs it: enough to recognise it in a row without paying for
   a full detail read per entry. */
export interface ListTitle {
  readonly id: number;
  readonly kind: ListEntryKind;
  readonly title: string;
  readonly cover: string;
  readonly formatLabel: string | null;
  readonly year: number | null;
  readonly startedOn: number | null;
  readonly score: number | null;
  readonly count: number | null;
  readonly unit: "ep" | "ch";
  readonly release: ReleaseState;
  readonly summary: string;
}

/* AniList's per-page ceiling. A longer list is fetched in chunks. */
const CHUNK = 50;

interface TitleNode {
  readonly id: number;
  readonly type: string | null;
  readonly title: { readonly english: string | null; readonly romaji: string | null };
  readonly coverImage: { readonly extraLarge: string | null };
  readonly format: string | null;
  readonly status: string | null;
  readonly episodes: number | null;
  readonly chapters: number | null;
  readonly seasonYear: number | null;
  readonly startDate: FuzzyDate | null;
  readonly averageScore: number | null;
  readonly description: string | null;
}

interface TitlesData {
  readonly Page: { readonly media: readonly TitleNode[] };
}

const TITLES = `
  query Titles($ids: [Int]) {
    Page(page: 1, perPage: ${CHUNK}) {
      media(id_in: $ids) {
        id
        type
        title { english romaji }
        coverImage { extraLarge }
        format
        status
        episodes
        chapters
        seasonYear
        startDate { year month day }
        averageScore
        description(asHtml: false)
      }
    }
  }
`;

/* Descriptions arrive with stray tags inline even with asHtml off. */
function plainText(value: string | null): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* The type AniList reports wins over the recorded kind, which is consulted only
   for a record AniList does not describe. */
function toTitle(node: TitleNode, kind: ListEntryKind): ListTitle {
  const comic = node.type === null ? kind === "manga" : node.type === "MANGA";
  return {
    id: node.id,
    kind: comic ? "manga" : "anime",
    title: node.title.english ?? node.title.romaji ?? "Untitled",
    cover: node.coverImage.extraLarge ?? "",
    formatLabel: formatLabel(node.format),
    year: node.seasonYear,
    startedOn: startedOn(node.startDate),
    score: node.averageScore,
    count: comic ? node.chapters : node.episodes,
    unit: comic ? "ch" : "ep",
    release: releaseState(node.status),
    summary: plainText(node.description),
  };
}

function batches<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

/* Every entry is asked for by id alone, in one query; the recorded kind is only
   the fallback for a node AniList reports without a type. */
async function fetchIds(
  ids: readonly number[],
  hints: ReadonlyMap<number, ListEntryKind>,
): Promise<readonly ListTitle[]> {
  const pages = await Promise.all(
    batches(ids, CHUNK).map((batch) =>
      memo(`titles:${[...batch].sort((a, b) => a - b).join(",")}`, () =>
        request<TitlesData, readonly ListTitle[]>(TITLES, { ids: batch }, (data) =>
          data.Page.media.map((node) => toTitle(node, hints.get(node.id) ?? "anime")),
        ),
      ),
    ),
  );
  return pages.flat();
}

/* The same title shaped as a poster. */
export function toPoster(title: ListTitle): AnimePoster {
  return {
    id: title.id,
    kind: title.kind,
    title: title.title,
    cover: title.cover,
    banner: null,
    color: null,
    score: title.score,
    popularity: null,
    favourites: null,
    formatLabel: title.formatLabel,
    seasonYear: title.year,
    startedOn: title.startedOn,
    count: title.count,
    unit: title.unit,
    release: title.release,
  };
}

/*
The titles a list holds, in the list's own order. AniList does not promise to
return ids in the order asked for, so the result is re-ordered rather than
trusted.
*/
export async function fetchListTitles(
  entries: readonly ListEntry[],
): Promise<readonly ListTitle[]> {
  if (entries.length === 0) return [];

  const hints = new Map<number, ListEntryKind>(
    entries.map((entry) => [entry.id, entry.kind]),
  );
  const titles = await fetchIds(
    entries.map((entry) => entry.id),
    hints,
  );

  const byId = new Map(titles.map((title) => [title.id, title]));

  /* The list's own order, one row per title however many entries point at it. */
  const seen = new Set<number>();
  const ordered: ListTitle[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) continue;
    const title = byId.get(entry.id);
    if (!title) continue;
    seen.add(entry.id);
    ordered.push(title);
  }
  return ordered;
}
