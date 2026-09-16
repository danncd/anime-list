import { useCallback, useMemo, useState } from "react";
import type { AddToListTitle, ListDraft } from "../../contracts/lists";
import type { ListActions } from "../shared/ListActionsContext";
import type { ListStore } from "./useLists";

type Kind = "none" | "new" | "edit" | "addTo";

export interface ListDialogState {
  readonly kind: Kind;
  /* The list being edited, already shaped as a draft. */
  readonly editDraft: ListDraft | null;
  /* The title being added, held so creating a list from the picker can return
     to it. */
  readonly pendingTitle: AddToListTitle | null;
  readonly openNew: () => void;
  readonly openEdit: (listId: string) => void;
  readonly openAddTo: (title: AddToListTitle) => void;
  readonly close: () => void;
  readonly create: (draft: ListDraft) => void;
  readonly update: (draft: ListDraft) => void;
  readonly remove: () => void;
  readonly toggleEntry: (listId: string) => void;
  /* What a poster card's or a hero's add button calls. */
  readonly listActions: ListActions;
}

/* State machine for the list dialogs: one dialog at a time, and what submitting
   it does. `onOpenList` opens a list created on its own; `onDeleted` is called
   after a list is removed. */
export function useListDialogs(
  lists: ListStore,
  onOpenList: (listId: string) => void,
  onDeleted: () => void,
): ListDialogState {
  const [kind, setKind] = useState<Kind>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState<AddToListTitle | null>(null);

  const openNew = useCallback(() => setKind("new"), []);

  const openEdit = useCallback((listId: string) => {
    setEditingId(listId);
    setKind("edit");
  }, []);

  const openAddTo = useCallback((title: AddToListTitle) => {
    setPendingTitle(title);
    setKind("addTo");
  }, []);

  const close = useCallback(() => {
    setPendingTitle(null);
    setEditingId(null);
    setKind("none");
  }, []);

  const editing =
    editingId === null ? null : (lists.lists.find((list) => list.id === editingId) ?? null);
  const editDraft: ListDraft | null = editing
    ? { label: editing.label, description: editing.description, picture: editing.picture }
    : null;

  /* A list created while adding a title takes it and stays on the picker; one
     created on its own opens. */
  const create = useCallback(
    (draft: ListDraft) => {
      const id = lists.create(draft);
      if (pendingTitle) {
        lists.addEntry(id, pendingTitle.kind, pendingTitle.id);
        setKind("addTo");
        return;
      }
      setKind("none");
      onOpenList(id);
    },
    [lists, pendingTitle, onOpenList],
  );

  const update = useCallback(
    (draft: ListDraft) => {
      if (editingId !== null) lists.update(editingId, draft);
      setEditingId(null);
      setKind("none");
    },
    [lists, editingId],
  );

  const remove = useCallback(() => {
    if (editingId !== null) lists.remove(editingId);
    setPendingTitle(null);
    setEditingId(null);
    setKind("none");
    onDeleted();
  }, [lists, editingId, onDeleted]);

  const toggleEntry = useCallback(
    (listId: string) => {
      if (!pendingTitle) return;
      const held = lists.lists
        .find((list) => list.id === listId)
        ?.entries.some((entry) => entry.kind === pendingTitle.kind && entry.id === pendingTitle.id);
      if (held) lists.removeEntry(listId, pendingTitle.kind, pendingTitle.id);
      else lists.addEntry(listId, pendingTitle.kind, pendingTitle.id);
    },
    [lists, pendingTitle],
  );

  const listActions = useMemo(() => ({ addToList: openAddTo }), [openAddTo]);

  return {
    kind,
    editDraft,
    pendingTitle,
    openNew,
    openEdit,
    openAddTo,
    close,
    create,
    update,
    remove,
    toggleEntry,
    listActions,
  };
}
