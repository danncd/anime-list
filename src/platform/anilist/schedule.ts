import type { AiringEntry, Page } from "../../contracts/anime";
import { memo } from "./cache";
import { request } from "./client";
import { formatLabel } from "./vocabulary";

/* AniList's page ceiling for Page connections. */
const PAGE_SIZE = 50;

/*
One day of the airing schedule across every title. Unlike mediaTrends, this
connection needs no media id, so a whole day arrives in one request.
*/
const SCHEDULE = `
  query Schedule($start: Int, $end: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        id
        airingAt
        episode
        media {
          id
          isAdult
          title { english romaji }
          coverImage { large }
          format
        }
      }
    }
  }
`;

interface ScheduleNode {
  readonly id: number;
  readonly airingAt: number;
  readonly episode: number;
  readonly media: {
    readonly id: number;
    readonly isAdult: boolean;
    readonly title: { readonly english: string | null; readonly romaji: string | null };
    readonly coverImage: { readonly large: string | null };
    readonly format: string | null;
  } | null;
}

interface ScheduleData {
  readonly Page?: {
    readonly pageInfo?: { readonly hasNextPage: boolean };
    readonly airingSchedules?: readonly ScheduleNode[];
  };
}

/* Adult titles are dropped here, not filtered in the view. */
function toEntry(node: ScheduleNode): AiringEntry | null {
  const media = node.media;
  if (!media || media.isAdult || !media.coverImage.large) return null;
  return {
    id: node.id,
    animeId: media.id,
    title: media.title.english ?? media.title.romaji ?? "Untitled",
    cover: media.coverImage.large,
    formatLabel: formatLabel(media.format),
    episode: node.episode,
    airsAt: node.airingAt,
  };
}

/* [start, end) in unix seconds. */
export function fetchSchedule(
  start: number,
  end: number,
  page: number,
): Promise<Page<AiringEntry>> {
  /* The window is part of the key: the same start with a different end is a
     different day and must not reuse the other's page. */
  return memo(`schedule:${start}:${end}:${page}`, () =>
    request(SCHEDULE, { start, end, page, perPage: PAGE_SIZE }, (data: ScheduleData) => {
      const items: AiringEntry[] = [];
      for (const node of data.Page?.airingSchedules ?? []) {
        const entry = toEntry(node);
        if (entry) items.push(entry);
      }
      return { items, hasMore: data.Page?.pageInfo?.hasNextPage ?? false };
    }),
  );
}
