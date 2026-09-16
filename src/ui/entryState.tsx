import { createContext, useCallback, useContext, type ReactNode } from "react";

/*
UI state that belongs to a history entry rather than to the view as a whole, such
as which tab an anime page was on. It mirrors the browser's history.state, sitting
parallel to the entry list so moving the cursor leaves it untouched and returning
to an entry restores it.
*/
export interface EntryState {
  readonly data: Readonly<Record<string, unknown>>;
  readonly set: (patch: Readonly<Record<string, unknown>>) => void;
}

const EntryStateContext = createContext<EntryState | null>(null);

export function EntryStateProvider({
  value,
  children,
}: {
  readonly value: EntryState;
  readonly children: ReactNode;
}) {
  return <EntryStateContext.Provider value={value}>{children}</EntryStateContext.Provider>;
}

/* Frozen fallback for a view rendered outside a provider, so the setter identity
   does not change on every render. */
const NO_ENTRY_STATE: EntryState = { data: {}, set: () => undefined };

function useEntryState(): EntryState {
  return useContext(EntryStateContext) ?? NO_ENTRY_STATE;
}

/* One named slot of the current entry, with the value to use when it has none. */
export function useEntryValue<T>(name: string, initial: T): [T, (value: T) => void] {
  const { data, set } = useEntryState();
  const value = (data[name] as T | undefined) ?? initial;
  /* Stable, so an effect that lists this setter does not re-run every render. */
  const write = useCallback((next: T) => set({ [name]: next }), [name, set]);
  return [value, write];
}
