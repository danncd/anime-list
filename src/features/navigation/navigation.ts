import { FAVORITES_LIST_ID, isFavorites, manualOrder, type CustomList } from "../../contracts/lists";
import type { NavIconName } from "./NavIcon";

export type { CustomList };

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly icon: NavIconName;
  /* Rows shown indented beneath this one when it is expanded. */
  readonly children?: readonly NavItem[];
  /*
  Present only on a row that is one of the user's lists; undefined on every other
  row. A pinned list is kept above the others in every order.
  */
  readonly pinned?: boolean;
}

export interface NavSection {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly NavItem[];
}

export const NEW_LIST_ID = "new-list";
/* A sidebar row and the list it names share an id. */
export const FAVORITES_ID = FAVORITES_LIST_ID;
export const YOUR_LISTS_ID = "your-lists";

/* Sections that hold no user data; createListsSection builds the Lists section. */
export const baseSections: readonly NavSection[] = [
  {
    id: "home",
    items: [{ id: "home", label: "Home", icon: "home" }],
  },
  {
    id: "discover",
    label: "Discover",
    items: [
      { id: "seasonal-anime", label: "Seasonal Anime", icon: "season" },
      { id: "explore", label: "Explore All", icon: "grid" },
    ],
  },
  {
    id: "me",
    label: "Me",
    items: [{ id: "profile", label: "Profile", icon: "user" }],
  },
];

export function createListsSection(lists: readonly CustomList[]): NavSection {
  const items: NavItem[] = [
    { id: FAVORITES_ID, label: "Favorites", icon: "heart" },
    {
      id: YOUR_LISTS_ID,
      label: "Your Lists",
      icon: "list",
      /* Favorites already has its own row above. The sidebar always shows the
         hand-arranged order with the pinned block first, whatever sort the page
         uses. */
      children: manualOrder(lists.filter((list) => !isFavorites(list))).map((list) => ({
        id: list.id,
        label: list.label,
        icon: "list" as const,
        pinned: list.pinned,
      })),
    },
  ];
  return { id: "lists", label: "Lists", items };
}

export function findNavItem(
  sections: readonly NavSection[],
  itemId: string,
): NavItem | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.id === itemId) return item;
      const child = item.children?.find((candidate) => candidate.id === itemId);
      if (child) return child;
    }
  }
  return null;
}
