import type { AnimePoster } from "../../contracts/anime";
import { useDragScroll } from "../../ui/useDragScroll";
import { PosterCard } from "../shared/PosterCard";

export interface PosterRowProps {
  readonly items: readonly AnimePoster[];
  readonly onOpen: (animeId: number) => void;
}

export function PosterRow({ items, onOpen }: PosterRowProps) {
  const { ref, dragging, handlers } = useDragScroll<HTMLDivElement>();

  return (
    <div ref={ref} className={`poster-row${dragging ? " dragging" : ""}`} {...handlers}>
      {items.map((item) => (
        <PosterCard key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
