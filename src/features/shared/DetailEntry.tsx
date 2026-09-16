import type { ReactNode } from "react";

export interface DetailEntryProps {
  readonly art: string | null;
  readonly rank: number | null;
  readonly title: string;
  readonly score: number | null;
  readonly facts: readonly string[];
  readonly blurb: string | null;
  readonly side: ReactNode;
  /* Set when the title itself links elsewhere. */
  readonly onOpen?: (() => void) | null;
}

export function DetailEntry({
  art,
  rank,
  title,
  score,
  facts,
  blurb,
  side,
  onOpen = null,
}: DetailEntryProps) {
  return (
    <div className="detail-entry">
      {rank !== null ? (
        <span className="detail-lead detail-lead-rank">#{rank}</span>
      ) : art ? (
        onOpen ? (
          <button
            type="button"
            className="detail-lead detail-lead-action"
            onClick={onOpen}
            aria-label={`Open ${title}`}
          >
            <img src={art} alt="" loading="lazy" draggable={false} />
          </button>
        ) : (
          <span className="detail-lead">
            <img src={art} alt="" loading="lazy" draggable={false} />
          </span>
        )
      ) : null}

      <div className="detail-entry-body">
        {onOpen ? (
          <button type="button" className="detail-entry-title detail-entry-link" onClick={onOpen}>
            {title}
          </button>
        ) : (
          <h3 className="detail-entry-title">{title}</h3>
        )}
        {(score !== null || facts.length > 0) && (
          <div className="detail-facts">
            {score !== null && (
              <span className="detail-pill detail-pill-strong">★ {score}%</span>
            )}
            {facts.map((fact) => (
              <span className="detail-pill" key={fact}>
                {fact}
              </span>
            ))}
          </div>
        )}
        {blurb && <p className="detail-blurb">{blurb}</p>}
      </div>

      {side}
    </div>
  );
}
