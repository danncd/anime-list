import type { AnimeCastMember } from "../../../contracts/anime";
import { DetailEntry } from "../../shared/DetailEntry";
import { ShowMore } from "../../../ui/ShowMore";
import type { ConnectionState } from "../../../ui/usePagedConnection";

export interface CharactersPanelProps {
  readonly connection: ConnectionState<AnimeCastMember>;
}

export function CharactersPanel({ connection }: CharactersPanelProps) {
  return (
    <>
      <div className="detail-entries detail-entries-two-up">
        {connection.items.map((member) => (
          <DetailEntry
            key={`${member.name}-${member.role}`}
            art={member.image}
            rank={null}
            title={member.name}
            score={null}
            facts={[member.role]}
            blurb={null}
            side={
              member.actor && (
                <div className="detail-credit">
                  <div className="detail-credit-who">
                    <b>{member.actor}</b>
                    <span>Japanese</span>
                  </div>
                  {member.actorImage && (
                    <img
                      className="detail-credit-avatar"
                      src={member.actorImage}
                      alt=""
                      loading="lazy"
                    />
                  )}
                </div>
              )
            }
          />
        ))}
      </div>
      <ShowMore
        hasMore={connection.hasMore}
        loading={connection.loading}
        count={connection.items.length}
        noun="character"
        plural="characters"
        onLoadMore={connection.loadMore}
      />
    </>
  );
}
