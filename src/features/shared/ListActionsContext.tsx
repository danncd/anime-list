import { createContext, useContext, type ReactNode } from "react";
import type { AddToListTitle } from "../../contracts/lists";

export interface ListActions {
  readonly addToList: (title: AddToListTitle) => void;
}

const ListActionsContext = createContext<ListActions | null>(null);

/*
Add-to-list is offered on every title row, far from where the lists live.
Threading a callback through every row and grid would touch a dozen components,
so it travels as context.
*/
export function ListActionsProvider({
  value,
  children,
}: {
  readonly value: ListActions;
  readonly children: ReactNode;
}) {
  return <ListActionsContext.Provider value={value}>{children}</ListActionsContext.Provider>;
}

/* Null where list actions are not available. */
export function useListActions(): ListActions | null {
  return useContext(ListActionsContext);
}
