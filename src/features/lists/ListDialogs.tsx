import { AddToListDialog } from "./AddToListDialog";
import { NewListDialog } from "./NewListDialog";
import type { ListDialogState } from "./useListDialogs";
import type { ListStore } from "./useLists";

export interface ListDialogsProps {
  readonly state: ListDialogState;
  readonly lists: ListStore;
}

/* The two list dialogs, driven by the state in `useListDialogs`. Only the dialog
   that owns the current state renders; closing New List while adding a title
   returns to the picker. */
export function ListDialogs({ state, lists }: ListDialogsProps) {
  return (
    <>
      {(state.kind === "new" || state.kind === "edit") && (
        <NewListDialog
          initial={state.editDraft ?? undefined}
          onDelete={state.kind === "edit" ? state.remove : undefined}
          onClose={() => (state.pendingTitle ? state.openAddTo(state.pendingTitle) : state.close())}
          onCreate={(draft) => (state.kind === "edit" ? state.update(draft) : state.create(draft))}
        />
      )}

      {state.kind === "addTo" && state.pendingTitle && (
        <AddToListDialog
          title={state.pendingTitle}
          lists={lists.lists}
          onToggle={state.toggleEntry}
          onCreateList={state.openNew}
          onClose={state.close}
        />
      )}
    </>
  );
}
