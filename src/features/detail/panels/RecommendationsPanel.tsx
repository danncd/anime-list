import type { AnimeSuggestion } from "../../../contracts/anime";
import { DetailEntry } from "../../shared/DetailEntry";
import { ShowMore } from "../../../ui/ShowMore";
import type { ConnectionState } from "../../../ui/usePagedConnection";

export interface RecommendationsPanelProps {
  readonly connection: ConnectionState<AnimeSuggestion>;
  readonly onOpen: (animeId: number) => void;
}

export function RecommendationsPanel({ connection, onOpen }: RecommendationsPanelProps) {
  return (
    <>
      <div className="detail-entries">
        {connection.items.map((item) => {
          const facts: string[] = [];
          if (item.formatLabel) facts.push(item.formatLabel);
          if (item.year !== null) facts.push(String(item.year));
          if (item.episodes !== null) facts.push(`${item.episodes} episodes`);
          if (item.genres.length > 0) facts.push(item.genres.join(" · "));

          return (
            <DetailEntry
              key={item.id}
              art={item.cover}
              rank={null}
              title={item.title}
              score={item.score}
              facts={facts}
              blurb={item.blurb || null}
              side={
                item.votes > 0 && (
                  <div className="detail-figure">
                    <b>+{item.votes}</b>
                    <span>votes</span>
                  </div>
                )
              }
              onOpen={() => onOpen(item.id)}
            />
          );
        })}
      </div>
      <ShowMore
        hasMore={connection.hasMore}
        loading={connection.loading}
        count={connection.items.length}
        noun="title"
        plural="titles"
        onLoadMore={connection.loadMore}
      />
    </>
  );
}
