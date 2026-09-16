import { Plus } from "@phosphor-icons/react";
import type { AnimeDetail } from "../../contracts/anime";
import { SiteMark, YouTubeMark } from "./SiteMark";

export interface DetailHeaderProps {
  readonly detail: AnimeDetail;
  readonly onAddToList: () => void;
}

export function DetailHeader({ detail, onAddToList }: DetailHeaderProps) {
  const meta: string[] = [];
  if (detail.formatLabel) meta.push(detail.formatLabel);
  if (detail.episodes !== null) meta.push(`${detail.episodes} episodes`);
  if (detail.duration !== null) meta.push(`${detail.duration} min`);

  const streamLink = detail.links.find((link) => link.kind === "stream") ?? null;

  return (
    <>
      {/* Wide art. Hidden normally; on a narrow pane it becomes the band the
          cover is laid over. */}
      {detail.banner && (
        <div className="detail-banner">
          <img src={detail.banner} alt="" draggable={false} />
        </div>
      )}

      <div className={`detail-head${detail.banner ? " has-banner" : ""}`}>
        <div className="detail-cover-col">
          <div className="detail-cover">
            <img src={detail.cover} alt="" draggable={false} />
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="detail-action detail-action-primary"
              aria-label="Add to list"
              onClick={onAddToList}
            >
              <Plus />
              <span className="detail-action-label">Add to list</span>
            </button>
            {detail.trailer && (
              <a
                className="detail-action detail-action-icon"
                href={detail.trailer.url}
                target="_blank"
                rel="noreferrer"
                title="Watch trailer"
                aria-label="Watch trailer"
              >
                <YouTubeMark />
              </a>
            )}
            {streamLink && (
              <a
                className="detail-action detail-action-icon"
                href={streamLink.url}
                target="_blank"
                rel="noreferrer"
                title={`Watch on ${streamLink.site}`}
                aria-label={`Watch on ${streamLink.site}`}
              >
                <SiteMark site={streamLink.site} />
              </a>
            )}
          </div>
        </div>

        <div className="detail-headline">
          <h1 className="detail-title">{detail.title}</h1>
          {detail.altTitles && <p className="detail-alts">{detail.altTitles}</p>}

          <div className="detail-pills">
            {detail.score !== null && (
              <span className="detail-pill detail-pill-strong">★ {detail.score}%</span>
            )}
            <span className="detail-pill">
              <span className={`detail-dot ${detail.release}`} aria-hidden="true" />
              {detail.releaseLabel}
            </span>
            {meta.map((item) => (
              <span className="detail-pill" key={item}>
                {item}
              </span>
            ))}
          </div>

          {detail.synopsis && <p className="detail-synopsis">{detail.synopsis}</p>}
        </div>
      </div>
    </>
  );
}
