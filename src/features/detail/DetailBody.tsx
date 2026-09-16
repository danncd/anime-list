import { useMemo } from "react";
import { useEntryValue } from "../../ui/entryState";
import type { AnimeDetail } from "../../contracts/anime";
import {
  fetchCastPage,
  fetchCrewPage,
  fetchSuggestionsPage,
} from "../../platform/anilist";
import { DetailTabs, type DetailTabItem } from "./DetailTabs";
import { CharactersPanel } from "./panels/CharactersPanel";
import { InformationPanel } from "./panels/InformationPanel";
import { RecommendationsPanel } from "./panels/RecommendationsPanel";
import { RelatedPanel } from "./panels/RelatedPanel";
import { StaffPanel } from "./panels/StaffPanel";
import { StatsPanel } from "./panels/StatsPanel";
import { formatCount } from "./format";
import { usePagedConnection, type ConnectionState } from "../../ui/usePagedConnection";

/* The spec sheet is what a database page is for, so it leads. */
const DEFAULT_TAB = "information";

/* AniList caps the totals it reports, so a count is a lower bound until every
   page is in. */
function countLabel(connection: ConnectionState<unknown>): string {
  const loaded = formatCount(connection.items.length);
  return connection.hasMore ? `${loaded}+` : loaded;
}

export interface DetailBodyProps {
  readonly detail: AnimeDetail;
  readonly onOpenAnime: (animeId: number) => void;
}

/* The detail is already loaded here, which lets the paged connections be plain
   hooks seeded with data in hand. */
export function DetailBody({ detail, onOpenAnime }: DetailBodyProps) {
  /* Held per history entry, so coming back to a title returns to its tab. */
  const [activeTab, setActiveTab] = useEntryValue("detailTab", DEFAULT_TAB);

  const cast = usePagedConnection(detail.id, detail.cast, (page) =>
    fetchCastPage(detail.id, page),
  );
  const crew = usePagedConnection(detail.id, detail.crew, (page) =>
    fetchCrewPage(detail.id, page),
  );
  const suggestions = usePagedConnection(detail.id, detail.suggestions, (page) =>
    fetchSuggestionsPage(detail.id, page),
  );

  const related = detail.related;

  const tabs = useMemo<readonly DetailTabItem[]>(
    () => [
      { id: "information", label: "Information", count: null },
      /* Only when the title has any, so the row does not carry an empty tab. */
      ...(related.length > 0
        ? [{ id: "related", label: "Related", count: formatCount(related.length) }]
        : []),
      { id: "characters", label: "Characters", count: countLabel(cast) },
      { id: "staff", label: "Staff", count: countLabel(crew) },
      { id: "stats", label: "Stats", count: null },
      {
        id: "recommendations",
        label: "Recommendations",
        count: countLabel(suggestions),
      },
    ],
    [cast, crew, suggestions, related],
  );

  return (
    <>
      <DetailTabs tabs={tabs} activeId={activeTab} onSelect={setActiveTab} />

      <div
        className="detail-panel"
        role="tabpanel"
        id={`detail-panel-${activeTab}`}
        aria-labelledby={`detail-tab-${activeTab}`}
      >
        {activeTab === "information" && <InformationPanel detail={detail} />}
        {activeTab === "related" && (
          <RelatedPanel entries={related} onOpenAnime={onOpenAnime} />
        )}
        {activeTab === "characters" && <CharactersPanel connection={cast} />}
        {activeTab === "staff" && <StaffPanel connection={crew} />}
        {activeTab === "stats" && <StatsPanel detail={detail} />}
        {activeTab === "recommendations" && (
          <RecommendationsPanel connection={suggestions} onOpen={onOpenAnime} />
        )}
      </div>
    </>
  );
}
