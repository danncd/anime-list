import { useEffect, useRef, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { AnimePoster } from "../../contracts/anime";
import { useOverflowingTitle } from "../../ui/useOverflowingTitle";
import { fetchAnimeDetail } from "../../platform/anilist";
import { ConfirmButton } from "../../ui/ConfirmButton";
import { useListActions } from "./ListActionsContext";

export interface PosterCardProps {
  readonly item: AnimePoster;
  readonly onOpen: (animeId: number) => void;
  /* Present only where removal makes sense, such as a list's own page. */
  readonly onRemove?: (() => void) | undefined;
}

export function PosterCard({ item, onOpen, onRemove }: PosterCardProps) {
  /* Offered only where list actions are in scope; a dead button is worse. */
  const listActions = useListActions();
  /* Removal arms on the first press and acts on the second. */
  const [armed, setArmed] = useState(false);

  /*
  Hovering warms the detail request, the heaviest in the app; the memo in cache.ts
  then serves the open. The 120ms delay keeps a sweep across a row from firing a
  request per card.
  */
  const prefetchTimer = useRef(0);

  const startPrefetch = () => {
    const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData === true) return;
    prefetchTimer.current = window.setTimeout(() => {
      void fetchAnimeDetail(item.id).catch(() => undefined);
    }, 120);
  };

  const cancelPrefetch = () => {
    if (prefetchTimer.current !== 0) {
      window.clearTimeout(prefetchTimer.current);
      prefetchTimer.current = 0;
    }
  };
  /* A card can unmount while its timer is pending; the fetch would outlive it. */
  useEffect(() => cancelPrefetch, []);
  const title = useOverflowingTitle(item.title);

  return (
    <div className="poster" onPointerEnter={startPrefetch} onPointerLeave={cancelPrefetch}>
      <div className="poster-art">
        <img src={item.cover} alt="" loading="lazy" draggable={false} />
        {item.score !== null && <span className="poster-score">★ {item.score}</span>}

        <span className="poster-overlay" aria-hidden="true" />
        {/* Separate buttons, not a button wrapping the card: interactive
            elements cannot nest. */}
        <button
          type="button"
          className="poster-open"
          aria-label={`Open ${item.title}`}
          onClick={() => onOpen(item.id)}
        />
        {onRemove && (
          <ConfirmButton
            className="poster-remove"
            label={`Remove ${item.title} from list`}
            confirmLabel={`Confirm removing ${item.title}`}
            armed={armed}
            onArm={() => setArmed(true)}
            onConfirm={onRemove}
            onDisarm={() => setArmed(false)}
          />
        )}

        {listActions && (
          <button
            type="button"
            className="poster-add"
            aria-label={`Add ${item.title} to list`}
            onClick={() =>
              listActions.addToList({ id: item.id, kind: item.kind, label: item.title })
            }
          >
            <Plus />
          </button>
        )}
      </div>

      <span className="poster-titleline">
        <span className={`poster-dot ${item.release}`} aria-hidden="true" />
        <span
          ref={title.viewportRef}
          className={`poster-title${title.isOverflowing ? " overflowing" : ""}`}
          style={title.style}
        >
          <span ref={title.textRef}>{item.title}</span>
        </span>
      </span>

      <span className="poster-pills">
        {item.formatLabel && <span className="poster-pill">{item.formatLabel}</span>}
        {item.seasonYear !== null && <span className="poster-pill">{item.seasonYear}</span>}
        {item.count !== null && (
          <span className="poster-pill">
            {item.count} {item.unit}
          </span>
        )}
      </span>
    </div>
  );
}
