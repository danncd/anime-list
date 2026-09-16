/*
A list is a named collection of titles. Entries hold an id and media type rather
than a copy, so a list cannot go stale and its counts cannot drift from its
contents.
*/
export type ListEntryKind = "anime" | "manga";

/* What a title needs to be put in a list. */
export interface AddToListTitle {
  readonly id: number;
  readonly kind: ListEntryKind;
  readonly label: string;
}

/* What a dialog collects for a list, before it is a list. */
export interface ListDraft {
  readonly label: string;
  readonly description: string;
  readonly picture: string | null;
}

export interface ListEntry {
  readonly id: number;
  readonly kind: ListEntryKind;
  readonly addedAt: number;
}

export interface CustomList {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /* A data URL chosen by the user, or null when the list shows its covers. */
  readonly picture: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly entries: readonly ListEntry[];
  /* A pinned list sorts above the others in every mode and cannot be dragged until
     it is unpinned. It is a state, not a position among the lists. */
  readonly pinned: boolean;
}

/*
Favorites is a list like any other, same storage, with a fixed id and no
description or picture; every list operation therefore applies to it unchanged.
*/
export const FAVORITES_LIST_ID = "favorites";

export function isFavorites(list: CustomList): boolean {
  return list.id === FAVORITES_LIST_ID;
}

export function favoritesList(now: number): CustomList {
  return {
    id: FAVORITES_LIST_ID,
    label: "Favorites",
    description: "",
    picture: null,
    createdAt: now,
    updatedAt: now,
    entries: [],
    pinned: false,
  };
}

/* How the lists are shown. "custom" is the hand-arranged order the sidebar always
   shows; every mode keeps the pinned block on top. */
export type ListOrderMode = "custom" | "date" | "name" | "items";

export interface ListOrder {
  readonly mode: ListOrderMode;
  readonly descending: boolean;
}

export const DEFAULT_LIST_ORDER: ListOrder = { mode: "custom", descending: true };

/*
The one place the order is decided, so every view agrees. The pinned block comes
first in every mode; the sort applies inside each block, and "custom" uses the
array's own order.
*/
export function orderLists(
  lists: readonly CustomList[],
  order: ListOrder,
): readonly CustomList[] {
  const pinned = lists.filter((list) => list.pinned);
  const rest = lists.filter((list) => !list.pinned);
  if (order.mode === "custom") return [...pinned, ...rest];

  const compare = (a: CustomList, b: CustomList): number => {
    let result: number;
    if (order.mode === "name") result = a.label.localeCompare(b.label);
    else if (order.mode === "items") result = countEntries(a).total - countEntries(b).total;
    /* A list's date is when it last changed. */
    else result = a.updatedAt - b.updatedAt;
    return order.descending ? -result : result;
  };
  return [...pinned].sort(compare).concat([...rest].sort(compare));
}

/*
Moves a list one place, as the keyboard does where a pointer would drag. Only the
hand-arranged order has places, so `position` counts from the top of the whole
set, pinned block included, and is what `reorder` takes.
*/
export interface ListMove {
  readonly beforeId: string | null;
  readonly position: number;
  readonly total: number;
}

export function moveList(
  lists: readonly CustomList[],
  listId: string,
  delta: -1 | 1,
): ListMove | null {
  const movable = lists.filter((list) => !list.pinned);
  const from = movable.findIndex((list) => list.id === listId);
  if (from < 0) return null;
  const to = from + delta;
  const target = movable[to];
  if (!target) return null;
  /* Moving up lands before the row above; moving down lands before the row after
     it, or last when there is none. */
  const beforeId = delta < 0 ? target.id : (movable[to + 1]?.id ?? null);
  return { beforeId, position: lists.length - movable.length + to + 1, total: lists.length };
}

/* The hand-arranged order: the pinned block, then the rest as they were left. The
   sidebar always shows this, whatever the page is sorted by. */
export function manualOrder(lists: readonly CustomList[]): readonly CustomList[] {
  return orderLists(lists, { mode: "custom", descending: true });
}

export interface ListCounts {
  readonly anime: number;
  readonly manga: number;
  readonly total: number;
}

export function countEntries(list: CustomList): ListCounts {
  let anime = 0;
  let manga = 0;
  for (const entry of list.entries) {
    if (entry.kind === "anime") anime += 1;
    else manga += 1;
  }
  return { anime, manga, total: list.entries.length };
}

/*
AniList ids are unique across media types, so an entry's identity within a list is
its id. The recorded kind is only a hint about what it is.
*/
export function holdsEntry(list: CustomList, id: number): boolean {
  return list.entries.some((entry) => entry.id === id);
}
