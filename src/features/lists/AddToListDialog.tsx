import { useEffect, useMemo, useState } from "react";
import { Check, MagnifyingGlass, Plus, Trash, X } from "@phosphor-icons/react";
import {
  countEntries,
  holdsEntry,
  isFavorites,
  type AddToListTitle,
  type CustomList,
} from "../../contracts/lists";
import { formatUpdated } from "./formatUpdated";
import { PREVIEW, useListCovers } from "../shared/useListCovers";

export interface AddToListDialogProps {
  readonly title: AddToListTitle;
  readonly lists: readonly CustomList[];
  readonly onToggle: (listId: string) => void;
  readonly onCreateList: () => void;
  readonly onClose: () => void;
}

/* Each row shows a list's covers, count and last change; one control toggles
   membership. */
export function AddToListDialog({
  title,
  lists,
  onToggle,
  onCreateList,
  onClose,
}: AddToListDialogProps) {
  const [query, setQuery] = useState("");
  const covers = useListCovers(lists);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /* Favorites first, then the rest. */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const ordered = [
      ...lists.filter(isFavorites),
      ...lists.filter((list) => !isFavorites(list)),
    ];
    if (needle.length === 0) return ordered;
    return ordered.filter((list) => list.label.toLowerCase().includes(needle));
  }, [lists, query]);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal-dialog is-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-list-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-head-text">
            <h2 className="modal-title" id="add-to-list-title">
              Add to list
            </h2>
            <p className="modal-subtitle">{title.label}</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>

        {lists.length > 0 && (
          <label className="modal-search">
            <MagnifyingGlass />
            <input
              type="search"
              value={query}
              placeholder="Find a list"
              aria-label="Find a list"
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}

        <div className="picker-rows">
          {lists.length === 0 ? (
            <div className="picker-empty">
              <p className="picker-empty-title">You have no lists yet.</p>
              <p className="picker-empty-body">
                Make one and {title.label} goes straight into it. A picture and a description are
                optional.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <p className="picker-empty-body">Nothing matches that name.</p>
          ) : (
            visible.map((list) => {
              const held = holdsEntry(list, title.id);
              const counts = countEntries(list);
              const preview = covers.get(list.id) ?? [];

              return (
                <button
                  type="button"
                  key={list.id}
                  className={`picker-row${held ? " is-held" : ""}`}
                  aria-pressed={held}
                  aria-label={`${held ? "Remove from" : "Add to"} ${list.label}`}
                  onClick={() => onToggle(list.id)}
                >
                  <span className="picker-thumb" aria-hidden="true">
                    {list.picture !== null ? (
                      /* A list's own picture takes precedence over its covers. */
                      <img className="picker-picture" src={list.picture} alt="" />
                    ) : (
                      Array.from({ length: PREVIEW }, (_, index) => {
                        const cover = preview[index];
                        return cover ? (
                          <img className="picker-cover" src={cover} alt="" key={index} />
                        ) : (
                          <span className="picker-cover" key={index} />
                        );
                      })
                    )}
                  </span>

                  <span className="picker-row-body">
                    <span className="picker-row-name">{list.label}</span>
                    <span className="picker-row-meta">
                      {counts.total} {counts.total === 1 ? "title" : "titles"} · Updated{" "}
                      {formatUpdated(list.updatedAt)}
                    </span>
                  </span>

                  <span className="picker-state">
                    <Plus className="as-add" />
                    <Check className="as-in" />
                    <Trash className="as-remove" />
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="modal-btn" onClick={onCreateList}>
            <Plus />
            New List
          </button>
          <button type="button" className="modal-btn is-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
