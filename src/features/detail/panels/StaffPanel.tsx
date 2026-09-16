import type { AnimeCrewMember } from "../../../contracts/anime";
import { DetailEntry } from "../../shared/DetailEntry";
import { ShowMore } from "../../../ui/ShowMore";
import type { ConnectionState } from "../../../ui/usePagedConnection";

export interface StaffPanelProps {
  readonly connection: ConnectionState<AnimeCrewMember>;
}

export function StaffPanel({ connection }: StaffPanelProps) {
  return (
    <>
      <div className="detail-entries detail-entries-two-up">
        {connection.items.map((member) => (
          <DetailEntry
            key={member.name}
            art={member.image}
            rank={null}
            title={member.name}
            score={null}
            facts={member.roles}
            blurb={null}
            side={null}
          />
        ))}
      </div>
      <ShowMore
        hasMore={connection.hasMore}
        loading={connection.loading}
        count={connection.items.length}
        noun="person"
        plural="people"
        onLoadMore={connection.loadMore}
      />
    </>
  );
}
