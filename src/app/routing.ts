/*
View ids are what the browser history stack stores. A leading `anime-` marks one
title; anything else is a sidebar id, with list ids used verbatim. Keeping the
encoding here means neither the sidebar nor the history knows about the other.
*/
const ANIME_PREFIX = "anime-";
/* `parseViewId` returns the id with this prefix intact, and it is compared
   against a raw list id. */
const LIST_PREFIX = "list-";

export type View =
  | { readonly kind: "anime"; readonly animeId: number }
  | { readonly kind: "list"; readonly listId: string }
  | { readonly kind: "section"; readonly itemId: string };

export function animeViewId(animeId: number): string {
  return `${ANIME_PREFIX}${animeId}`;
}

export function parseViewId(viewId: string): View {
  if (viewId.startsWith(ANIME_PREFIX)) {
    const animeId = Number(viewId.slice(ANIME_PREFIX.length));
    if (Number.isInteger(animeId) && animeId > 0) {
      return { kind: "anime", animeId };
    }
  }
  if (viewId.startsWith(LIST_PREFIX)) {
    return { kind: "list", listId: viewId };
  }
  return { kind: "section", itemId: viewId };
}
