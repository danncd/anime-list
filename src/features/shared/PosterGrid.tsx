import type { AnimePoster } from "../../contracts/anime";
import { PosterCard } from "./PosterCard";
import { describeError } from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { PosterSkeleton } from "../../ui/PosterSkeleton";
import { ShowMore } from "../../ui/ShowMore";
import type { ConnectionState } from "../../ui/usePagedConnection";

const SKELETON_COUNT = 18;

export interface PosterGridProps {
  readonly listing: ConnectionState<AnimePoster>;
  readonly onOpenAnime: (animeId: number) => void;
}

/*
Loaded rows render whatever the status, dimmed while the next page is on its way;
branching on `loading` first blanked the grid on every sort or filter change.
Listings run to hundreds of titles, so they read a page at a time.
*/
export function PosterGrid({ listing, onOpenAnime }: PosterGridProps) {
  if (listing.items.length === 0) {
    if (listing.status === "error") {
      return <Note spaced>{describeError(listing.error)}</Note>;
    }
    if (listing.status === "loading") {
      return <PosterSkeleton count={SKELETON_COUNT} className="poster-grid" />;
    }
    return <Note spaced>Nothing here yet.</Note>;
  }

  return (
    <>
      <div className={`poster-grid${listing.stale ? " is-stale" : ""}`}>
        {listing.items.map((item) => (
          <PosterCard key={item.id} item={item} onOpen={onOpenAnime} />
        ))}
      </div>
      <ShowMore
        hasMore={listing.hasMore}
        loading={listing.loading}
        count={listing.items.length}
        noun="title"
        plural="titles"
        onLoadMore={listing.loadMore}
      />
    </>
  );
}
