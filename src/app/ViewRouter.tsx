import type { AddToListTitle, ListOrder } from "../contracts/lists";
import { AnimeDetailPage } from "../features/detail/AnimeDetailPage";
import { ExplorePage } from "../features/explore/ExplorePage";
import { FavoritesPage } from "../features/lists/FavoritesPage";
import { ListPage } from "../features/lists/ListPage";
import type { ListStore } from "../features/lists/useLists";
import { YourListsPage } from "../features/lists/YourListsPage";
import type { NavItem } from "../features/navigation/navigation";
import { FAVORITES_ID, YOUR_LISTS_ID } from "../features/navigation/navigation";
import { ProfilePage } from "../features/profile/ProfilePage";
import type { ProfileStore } from "../features/profile/useProfile";
import { SeasonalAnimePage } from "../features/season/SeasonalAnimePage";
import { HomePage } from "../features/home/HomePage";
import { EntryStateProvider } from "../ui/entryState";
import type { View } from "./routing";

export interface ViewRouterProps {
  readonly view: View;
  /* The sidebar row the view belongs to, for the placeholder's heading. */
  readonly activeItem: NavItem | null;
  readonly lists: ListStore;
  readonly profile: ProfileStore;
  /* How the lists page is ordered, and how to change it. The sidebar ignores this
     and always shows the hand-arranged order. */
  readonly order: ListOrder;
  readonly onOrderChange: (order: ListOrder) => void;
  readonly onArrangeStart: () => void;
  readonly entryState: { readonly data: Readonly<Record<string, unknown>>; readonly set: (patch: Readonly<Record<string, unknown>>) => void };
  readonly onOpenAnime: (animeId: number) => void;
  readonly onSelectItem: (itemId: string) => void;
  readonly onEditList: (listId: string) => void;
  readonly onNewList: () => void;
  readonly onAddToList: (title: AddToListTitle) => void;
  readonly onEditProfile: () => void;
}

/*
Which feature fills the content area, and what it is handed.
*/
export function ViewRouter({
  view,
  activeItem,
  lists,
  profile,
  order,
  onOrderChange,
  onArrangeStart,
  entryState,
  onOpenAnime,
  onSelectItem,
  onEditList,
  onNewList,
  onAddToList,
  onEditProfile,
}: ViewRouterProps) {
  const favorites = lists.lists.find((list) => list.id === FAVORITES_ID) ?? null;

  let page;
  if (view.kind === "anime") {
    page = (
      <AnimeDetailPage animeId={view.animeId} onOpenAnime={onOpenAnime} onAddToList={onAddToList} />
    );
  } else if (view.kind === "list") {
    page = (
      <ListPage
        list={lists.lists.find((candidate) => candidate.id === view.listId) ?? null}
        onOpenTitle={(_kind, id) => onOpenAnime(id)}
        onRemoveEntry={(kind, id) => lists.removeEntry(view.listId, kind, id)}
        onEdit={() => onEditList(view.listId)}
        onResolveKinds={(kinds) => lists.correctKinds(view.listId, kinds)}
      />
    );
  } else if (view.itemId === "home") {
    page = <HomePage onNavigate={onSelectItem} onOpenAnime={onOpenAnime} />;
  } else if (view.itemId === "seasonal-anime") {
    page = <SeasonalAnimePage onOpenAnime={onOpenAnime} />;
  } else if (view.itemId === "explore") {
    page = <ExplorePage onOpenAnime={onOpenAnime} />;
  } else if (view.itemId === "profile") {
    page = (
      <ProfilePage
        profile={profile.profile}
        onEdit={onEditProfile}
        lists={lists.lists}
        onOpenList={onSelectItem}
        counts={{
          favorites: favorites?.entries.length ?? 0,
          lists: lists.lists.filter((list) => list.id !== FAVORITES_ID).length,
          titles: lists.lists.reduce((total, list) => total + list.entries.length, 0),
        }}
      />
    );
  } else if (view.itemId === FAVORITES_ID) {
    page = (
      <FavoritesPage
        list={favorites}
        onOpenTitle={onOpenAnime}
        onRemove={(kind, id) => lists.removeEntry(FAVORITES_ID, kind, id)}
      />
    );
  } else if (view.itemId === YOUR_LISTS_ID) {
    page = (
      <YourListsPage
        lists={lists.lists}
        order={order}
        onOrderChange={onOrderChange}
        onOpenList={onSelectItem}
        onCreateList={onNewList}
        onReorderList={lists.reorder}
        onArrangeStart={onArrangeStart}
        onSetPinned={lists.setPinned}
      />
    );
  } else {
    page = (
      <div className="content-view">
        <h1>{activeItem?.label ?? ""}</h1>
      </div>
    );
  }

  return <EntryStateProvider value={entryState}>{page}</EntryStateProvider>;
}
