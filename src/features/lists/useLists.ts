import { useCallback, useEffect, useMemo, useState } from "react";
import {
  favoritesList,
  holdsEntry,
  isFavorites,
  type CustomList,
  type ListDraft,
  type ListEntryKind,
} from "../../contracts/lists";
import { loadLists, saveLists } from "../../platform/lists/storage";

export interface ListStore {
  readonly lists: readonly CustomList[];
  readonly create: (draft: ListDraft) => string;
  readonly update: (listId: string, draft: ListDraft) => void;
  readonly remove: (listId: string) => void;
  readonly addEntry: (listId: string, kind: ListEntryKind, id: number) => void;
  readonly removeEntry: (listId: string, kind: ListEntryKind, id: number) => void;
  /* Records what AniList says a title is, for entries that got it wrong. */
  readonly correctKinds: (listId: string, kinds: ReadonlyMap<number, ListEntryKind>) => void;
  /* Moves a list to sit before `beforeId`, or to the end of the unpinned block
     when that is null. Position rather than index: the pinned block is not
     expressible as an index. */
  readonly reorder: (listId: string, beforeId: string | null) => void;
  /* Pinning moves a list to the top of the pinned block; unpinning leaves it in
     place. */
  readonly setPinned: (listId: string, pinned: boolean) => void;
}

function newId(): string {
  /* randomUUID needs a secure context; the fallback keeps the same id shape and
     uniqueness. */
  const unique =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `list-${unique}`;
}

/* Content changes stamp updatedAt. */
function touch(list: CustomList, entries: CustomList["entries"], now: number): CustomList {
  return { ...list, entries, updatedAt: now };
}

/* The user's lists and the only ways to change them. */
/* Favorites always exists, so a title can go into it before the list is opened. */
function initialLists(): readonly CustomList[] {
  const stored = loadLists();
  if (stored.some(isFavorites)) return stored;
  return [favoritesList(Date.now()), ...stored];
}

export function useLists(): ListStore {
  const [lists, setLists] = useState<readonly CustomList[]>(initialLists);

  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  const create = useCallback((draft: ListDraft): string => {
    const id = newId();
    const now = Date.now();
    const list: CustomList = {
      id,
      label: draft.label.trim() || "Untitled list",
      description: draft.description.trim(),
      picture: draft.picture,
      createdAt: now,
      updatedAt: now,
      entries: [],
      pinned: false,
    };
    setLists((current) => [list, ...current]);
    return id;
  }, []);

  const update = useCallback((listId: string, draft: ListDraft) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId
          ? {
              ...list,
              label: draft.label.trim() || "Untitled list",
              description: draft.description.trim(),
              picture: draft.picture,
              updatedAt: Date.now(),
            }
          : list,
      ),
    );
  }, []);

  const remove = useCallback((listId: string) => {
    setLists((current) => current.filter((list) => list.id !== listId));
  }, []);

  const addEntry = useCallback((listId: string, kind: ListEntryKind, id: number) => {
    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId || holdsEntry(list, id)) return list;
        const now = Date.now();
        return touch(list, [{ id, kind, addedAt: now }, ...list.entries], now);
      }),
    );
  }, []);

  const removeEntry = useCallback((listId: string, _kind: ListEntryKind, id: number) => {
    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId) return list;
        const entries = list.entries.filter((entry) => entry.id !== id);
        if (entries.length === list.entries.length) return list;
        return touch(list, entries, Date.now());
      }),
    );
  }, []);

  /* Learning a title's real kind is not a user change, so this rewrites the
     entries without touching updatedAt. */
  const correctKinds = useCallback(
    (listId: string, kinds: ReadonlyMap<number, ListEntryKind>) => {
      setLists((current) => {
        let touched = false;
        const next = current.map((list) => {
          if (list.id !== listId) return list;
          let changed = false;
          const entries = list.entries.map((entry) => {
            const kind = kinds.get(entry.id);
            if (!kind || kind === entry.kind) return entry;
            changed = true;
            return { ...entry, kind };
          });
          if (!changed) return list;
          touched = true;
          return { ...list, entries };
        });
        /* The same array when nothing changed, so a confirming page load does
           not rewrite storage or re-render. */
        return touched ? next : current;
      });
    },
    [],
  );

  /* Rearranging and pinning change order, not contents, and "Updated" reports
     contents. Neither stamps updatedAt, as `correctKinds` does not. */
  const reorder = useCallback((listId: string, beforeId: string | null) => {
    setLists((current) => {
      const moved = current.find((list) => list.id === listId);
      if (!moved || moved.pinned || beforeId === listId) return current;
      const without = current.filter((list) => list.id !== listId);
      const at = beforeId === null ? -1 : without.findIndex((list) => list.id === beforeId);
      if (beforeId !== null && at < 0) return current;
      const next = [...without];
      next.splice(at < 0 ? next.length : at, 0, moved);
      /* The stored array is the manual order. */
      return next;
    });
  }, []);

  const setPinned = useCallback((listId: string, pinned: boolean) => {
    setLists((current) => {
      const list = current.find((candidate) => candidate.id === listId);
      if (!list || list.pinned === pinned) return current;
      const flagged = { ...list, pinned };
      if (!pinned) {
        /* Unpinning keeps the slot: Custom keeps its neighbours, and a sorted
           mode places it on its own. */
        return current.map((candidate) => (candidate.id === listId ? flagged : candidate));
      }
      return [flagged, ...current.filter((candidate) => candidate.id !== listId)];
    });
  }, []);

  return useMemo(
    () => ({
      lists,
      create,
      update,
      remove,
      addEntry,
      removeEntry,
      correctKinds,
      reorder,
      setPinned,
    }),
    [lists, create, update, remove, addEntry, removeEntry, correctKinds, reorder, setPinned],
  );
}
