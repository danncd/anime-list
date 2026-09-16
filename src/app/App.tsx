import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_FILTERS } from "../contracts/filters";
import { ListDialogs } from "../features/lists/ListDialogs";
import { useListDialogs } from "../features/lists/useListDialogs";
import { useLists } from "../features/lists/useLists";
import { MainSidebar } from "../features/navigation/MainSidebar";
import {
  NEW_LIST_ID,
  YOUR_LISTS_ID,
  baseSections,
  createListsSection,
  findNavItem,
} from "../features/navigation/navigation";
import { EditProfileDialog } from "../features/profile/EditProfileDialog";
import { useProfile } from "../features/profile/useProfile";
import { ListActionsProvider } from "../features/shared/ListActionsContext";
import { animeViewId, parseViewId } from "./routing";
import { AppShell } from "./shell/AppShell";
import { usePanelLayout } from "./shell/usePanelLayout";
import { useScrollRestoration } from "./shell/useScrollRestoration";
import { WindowToolbar } from "./shell/WindowToolbar";
import { useLayoutMemory } from "./useLayoutMemory";
import { useListOrder } from "./useListOrder";
import { useNavigationHistory } from "./useNavigationHistory";
import { ViewRouter } from "./ViewRouter";

/*
Composition root: it owns the shell state, the view history and the user's data,
and hands each to the component that renders it.
*/
export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profile = useProfile();
  const lists = useLists();
  const listOrder = useListOrder();

  const sections = useMemo(
    () => [...baseSections, createListsSection(lists.lists)],
    [lists.lists],
  );

  /*
  What was on screen and unfolded when the app was last left. The view is read
  once, as the history's starting point.
  */
  const memory = useLayoutMemory(lists.lists, sections);

  const {
    current: viewId,
    index: entryIndex,
    count: entryCount,
    entryData,
    setEntryData,
    canGoBack,
    canGoForward,
    visit,
    back,
    forward,
  } = useNavigationHistory(memory.startView);

  /* So the next launch opens here. Depends on the function, not the object it
     came in: that object is new every render, so this would write on every one. */
  const { rememberView } = memory;
  useEffect(() => {
    rememberView(viewId);
  }, [rememberView, viewId]);

  /* Back and forward return to the scroll position that entry was left at. */
  const contentRef = useRef<HTMLDivElement>(null);

  /*
  The toolbar search sends its query to Explore All. The visit must happen first:
  entry data lands on the entry current at the time of the write.
  */
  const searchAll = useCallback(
    (query: string) => {
      visit("explore");
      setEntryData({ exploreFilters: { ...EMPTY_FILTERS, query } });
      setSearchQuery("");
    },
    [visit, setEntryData],
  );
  useScrollRestoration(contentRef, entryIndex, entryCount);

  const panels = usePanelLayout({ mainOpen: sidebarOpen, onMainOpenChange: setSidebarOpen });

  const view = parseViewId(viewId);
  const activeItem = view.kind === "section" ? findNavItem(sections, view.itemId) : null;
  /* A list is one of the sidebar's rows, so it marks that row active too. */
  const activeItemId =
    view.kind === "list" ? view.listId : view.kind === "section" ? view.itemId : "";

  const dialogs = useListDialogs(lists, visit, () => visit(YOUR_LISTS_ID));

  const selectItem = useCallback(
    (itemId: string) => {
      if (itemId === NEW_LIST_ID) {
        dialogs.openNew();
        return;
      }
      visit(itemId);
    },
    [dialogs, visit],
  );

  const openAnime = useCallback((animeId: number) => visit(animeViewId(animeId)), [visit]);

  /* Memoised so every entry-state consumer does not re-render with this one. */
  const entryState = useMemo(
    () => ({ data: entryData, set: setEntryData }),
    [entryData, setEntryData],
  );

  return (
    <ListActionsProvider value={dialogs.listActions}>
      <ListDialogs state={dialogs} lists={lists} />

      {profileOpen && (
        <EditProfileDialog
          profile={profile.profile}
          onSave={(next) => {
            profile.save(next);
            setProfileOpen(false);
          }}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <AppShell
        contentRef={contentRef}
        sidebarOpen={sidebarOpen}
        sidebarWidth={panels.mainContentWidth}
        isDragging={panels.mainDragging}
        mainMaximum={panels.mainMaximum}
        onResizeKeyDown={panels.resizeWithKeyboard}
        onMainResizeStart={panels.startMainResize}
        toolbar={
          <WindowToolbar
            sidebarOpen={sidebarOpen}
            sidebarWidth={panels.mainWidth}
            searchQuery={searchQuery}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onToggleSidebar={panels.toggleMain}
            onSearchQueryChange={setSearchQuery}
            isDragging={panels.mainDragging}
            onSearchAll={searchAll}
            onOpenAnime={openAnime}
            onBack={back}
            onForward={forward}
          />
        }
        sidebar={
          <MainSidebar
            sections={sections}
            activeItemId={activeItemId}
            onSelectItem={selectItem}
            onCreateList={dialogs.openNew}
            onReorderList={lists.reorder}
            onArrangeStart={listOrder.arrangeByHand}
            onSetPinned={lists.setPinned}
            expanded={memory.expanded}
            onToggleBranch={memory.toggleBranch}
          />
        }
        main={
          <ViewRouter
            view={view}
            activeItem={activeItem}
            lists={lists}
            profile={profile}
            order={listOrder.order}
            onOrderChange={listOrder.setOrder}
            onArrangeStart={listOrder.arrangeByHand}
            entryState={entryState}
            onOpenAnime={openAnime}
            onSelectItem={selectItem}
            onEditList={dialogs.openEdit}
            onNewList={dialogs.openNew}
            onAddToList={dialogs.openAddTo}
            onEditProfile={() => setProfileOpen(true)}
          />
        }
      />
    </ListActionsProvider>
  );
}
