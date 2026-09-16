import { useCallback, useEffect, useState } from "react";
import type { CustomList } from "../contracts/lists";
import { findNavItem, type NavSection } from "../features/navigation/navigation";
import {
  loadExpandedSections,
  loadLastView,
  saveExpandedSections,
  saveLastView,
} from "../platform/layout/storage";
import { parseViewId } from "./routing";

/*
The view to open on. A stored view is used only while it names something the app
can still show, so a deleted list or a section that is gone opens on Home. An
anime id is taken on trust: only AniList can say whether the title still exists,
and its page says so.
*/
export function restorableView(
  stored: string | null,
  lists: readonly CustomList[],
  sections: readonly NavSection[],
): string {
  if (stored === null) return "home";
  const view = parseViewId(stored);
  if (view.kind === "list") {
    return lists.some((list) => list.id === view.listId) ? stored : "home";
  }
  if (view.kind === "section") {
    return findNavItem(sections, view.itemId) === null ? "home" : stored;
  }
  return stored;
}

export interface LayoutMemory {
  /* The view the app was left on, for the history to start from. */
  readonly startView: string;
  readonly expanded: readonly string[];
  readonly toggleBranch: (itemId: string) => void;
  readonly rememberView: (viewId: string) => void;
}

/*
The state the composition root remembers between launches: the open view and the
unfolded sidebar branches. The list order and the sidebar width persist on their
own.
*/
export function useLayoutMemory(
  lists: readonly CustomList[],
  sections: readonly NavSection[],
): LayoutMemory {
  const [startView] = useState(() => restorableView(loadLastView(), lists, sections));
  const [expanded, setExpanded] = useState<readonly string[]>(loadExpandedSections);

  useEffect(() => {
    saveExpandedSections(expanded);
  }, [expanded]);

  const toggleBranch = useCallback((itemId: string) => {
    setExpanded((current) =>
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId],
    );
  }, []);

  const rememberView = useCallback((viewId: string) => {
    saveLastView(viewId);
  }, []);

  return { startView, expanded, toggleBranch, rememberView };
}
