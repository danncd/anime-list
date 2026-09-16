import { Clock, PencilSimple } from "@phosphor-icons/react";
import type { CustomList, ListCounts } from "../../contracts/lists";
import { formatUpdated } from "./formatUpdated";

export interface ListHeaderProps {
  readonly list: CustomList;
  readonly counts: ListCounts;
  /* Covers shown when the list has no picture of its own. */
  readonly preview: readonly string[];
  readonly onEdit: () => void;
}

/* A list's header: name, counts, last change and the way into editing. */
export function ListHeader({ list, counts, preview, onEdit }: ListHeaderProps) {
  /* No image means no first column: a grid keeps its column gap even when the
     track is zero wide. */
  const hasImage = list.picture !== null || preview.length > 0;

  return (
    <div className={`list-head${hasImage ? "" : " no-image"}`}>
      {list.picture ? (
        <span className="list-picture">
          <img src={list.picture} alt="" />
        </span>
      ) : preview.length > 0 ? (
        <span className="list-covers" aria-hidden="true">
          {preview.map((cover, index) => (
            <img className="list-cover" src={cover} alt="" key={index} />
          ))}
        </span>
      ) : null}

      <div className="list-head-main">
        <div className="list-head-top">
          <div className="list-head-body">
            <h1 className="list-name">{list.label}</h1>
            <div className="list-facts">
              {counts.anime > 0 && <span className="poster-pill">{counts.anime} Anime</span>}
              {counts.manga > 0 && <span className="poster-pill">{counts.manga} Manga</span>}
              <span className="list-updated">
                <Clock />
                {formatUpdated(list.updatedAt)}
              </span>
            </div>
          </div>

          <div className="list-actions">
            <button type="button" className="browse-pill" onClick={onEdit}>
              <span className="browse-pill-icon">
                <PencilSimple />
              </span>
              <span>Edit</span>
            </button>
          </div>
        </div>

        {list.description && <p className="list-description">{list.description}</p>}
      </div>
    </div>
  );
}
