import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { Clock, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import {
  countEntries,
  isFavorites,
  moveList,
  orderLists,
  type CustomList,
  type ListOrder,
  type ListOrderMode,
} from "../../contracts/lists";
import { GripGlyph, PinGlyph } from "../../ui/icons";
import { Note } from "../../ui/Note";
import { useDragOrder } from "../../ui/useDragOrder";
import { SortMenu, type SortOption } from "../shared/SortMenu";
import { formatUpdated } from "./formatUpdated";
import { PREVIEW, useListCovers } from "../shared/useListCovers";

/* "Custom" is not another sort: it is the order rows were arranged into, and it
   carries no direction. */
const ORDER_OPTIONS: readonly SortOption<ListOrderMode>[] = [
  { key: "custom", label: "Custom", directionless: true },
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "items", label: "Items" },
];

export interface YourListsPageProps {
  readonly lists: readonly CustomList[];
  readonly order: ListOrder;
  readonly onOrderChange: (order: ListOrder) => void;
  readonly onOpenList: (listId: string) => void;
  readonly onCreateList: () => void;
  readonly onReorderList: (listId: string, beforeId: string | null) => void;
  /* Arranging by hand selects Custom before anything is dropped. */
  readonly onArrangeStart: () => void;
  readonly onSetPinned: (listId: string, pinned: boolean) => void;
}

/* Your Lists. Rows show the list's own picture or the covers it holds. Ordering
   comes from `orderLists`, so this page and the sidebar cannot disagree. */
export function YourListsPage({
  lists,
  order,
  onOrderChange,
  onOpenList,
  onCreateList,
  onReorderList,
  onArrangeStart,
  onSetPinned,
}: YourListsPageProps) {
  /* Favorites has its own sidebar row, so it is left out here. */
  const own = useMemo(() => lists.filter((list) => !isFavorites(list)), [lists]);
  const covers = useListCovers(own);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const searching = query.trim().length > 0;
  const ordered = useMemo(() => orderLists(own, order), [own, order]);

  /* Search matches label and description, and filters the ordered set without
     reordering it. */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return ordered;
    return ordered.filter(
      (list) =>
        list.label.toLowerCase().includes(needle) ||
        list.description.toLowerCase().includes(needle),
    );
  }, [ordered, query]);

  /* Dragging is off while a search is active: the visible rows are a subset, so
     a drop has no unambiguous place in the kept order. */
  const drag = useDragOrder({
    enabled: !searching,
    style: "reflow",
    handle: ".your-list-grip",
    onDragStart: onArrangeStart,
    onDrop: onReorderList,
  });

  /* Keyboard equivalent of the drag: Alt plus an arrow key moves a row in the
     custom order and announces its position across the whole page. */
  const onRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, list: CustomList) => {
      if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
      const move = moveList(own, list.id, event.key === "ArrowUp" ? -1 : 1);
      if (!move) return;
      event.preventDefault();
      onArrangeStart();
      onReorderList(list.id, move.beforeId);
      setAnnouncement(
        `${list.label} moved ${event.key === "ArrowUp" ? "up" : "down"} to position ${move.position} of ${move.total}`,
      );
    },
    [onArrangeStart, onReorderList, own],
  );

  return (
    <div className="browse-page">
      <div className="browse-head">
        <div className="browse-head-left">
          <h1 className="browse-title">Your Lists</h1>
        </div>

        <div className="your-lists-controls">
          <button type="button" className="browse-pill" onClick={onCreateList}>
            <span className="browse-pill-icon">
              <Plus />
            </span>
            <span>New List</span>
          </button>

          <SortMenu
            label="Sort by:"
            options={ORDER_OPTIONS}
            value={order.mode}
            descending={order.descending}
            onChange={(mode, descending) => onOrderChange({ mode, descending })}
            /* A name sorts A to Z; a count or date sorts largest or newest
               first. Custom takes no direction. */
            descendingFor={(mode) => mode !== "name"}
          />
        </div>
      </div>

      <label className="browse-search">
        <MagnifyingGlass />
        <input
          type="search"
          value={query}
          placeholder="Search your lists"
          aria-label="Search your lists"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div
        className={`your-lists${searching ? " is-searching" : ""}`}
        ref={drag.containerRef}
      >
        {own.length === 0 ? (
          <Note spaced>No lists yet.</Note>
        ) : visible.length === 0 ? (
          <Note spaced>Nothing matches that search.</Note>
        ) : (
          visible.map((list) => {
            const counts = countEntries(list);
            const preview = covers.get(list.id) ?? [];
            return (
              <div
                className="your-list"
                key={list.id}
                data-drag-id={list.id}
                /* A pinned list cannot be dragged or have anything dropped
                   above it until it is unpinned. */
                data-drag-fixed={list.pinned ? "true" : undefined}
              >
                <button
                  type="button"
                  className="your-list-main"
                  onClick={() => onOpenList(list.id)}
                  onKeyDown={(event) => onRowKeyDown(event, list)}
                >
                  {list.picture ? (
                    <span className="your-list-picture">
                      <img src={list.picture} alt="" />
                    </span>
                  ) : (
                    /* An empty list still shows the frames its first covers will
                       fill. */
                    <span className="your-list-covers" aria-hidden="true">
                      {Array.from({ length: PREVIEW }, (_, index) => {
                        const cover = preview[index];
                        return cover ? (
                          <img className="your-list-cover" src={cover} alt="" key={index} />
                        ) : (
                          <span className="your-list-cover" key={index} />
                        );
                      })}
                    </span>
                  )}

                  <span className="your-list-body">
                    <span className="your-list-name-line">
                      {list.pinned && (
                        <span className="your-list-pin-mark" title="Pinned">
                          <PinGlyph />
                        </span>
                      )}
                      <span className="your-list-name">{list.label}</span>
                    </span>

                    {counts.total > 0 && (
                      <span className="your-list-facts">
                        {counts.anime > 0 && (
                          <span className="your-list-pill">{counts.anime} Anime</span>
                        )}
                        {counts.manga > 0 && (
                          <span className="your-list-pill">{counts.manga} Manga</span>
                        )}
                      </span>
                    )}

                    <span className="your-list-updated">
                      <Clock />
                      {formatUpdated(list.updatedAt)}
                    </span>

                    {/* Descriptions are clamped to two lines. */}
                    {list.description.length > 0 && (
                      <span className="your-list-description">{list.description}</span>
                    )}
                  </span>
                </button>

                {/* Shown on hover and on keyboard focus within the row. */}
                <span className="your-list-controls">
                  <button
                    type="button"
                    className={`your-list-pin${list.pinned ? " is-on" : ""}`}
                    aria-pressed={list.pinned}
                    aria-label={list.pinned ? `Unpin ${list.label}` : `Pin ${list.label} to the top`}
                    title={list.pinned ? "Unpin" : "Pin to top"}
                    onClick={() => onSetPinned(list.id, !list.pinned)}
                  >
                    <PinGlyph />
                  </button>

                  {/* No grip on a pinned list: the grip promises the row can
                      move. */}
                  {!list.pinned && (
                    <button
                      type="button"
                      className="your-list-grip"
                      aria-label={`Reorder ${list.label}`}
                      title="Drag to reorder, or hold Alt with the arrow keys"
                    >
                      <GripGlyph />
                    </button>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Announces keyboard moves to assistive technology. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
