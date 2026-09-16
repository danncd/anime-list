import { useCallback, useEffect, useRef, useState } from "react";

interface HistoryState {
  readonly entries: readonly string[];
  readonly index: number;
  /* Per-entry UI state, parallel to entries. Moving the cursor leaves it alone. */
  readonly data: readonly Readonly<Record<string, unknown>>[];
}

/*
Browser-style history for the active view, backed by the platform history stack, so
the toolbar arrows walk real entries and every view has an identity for scroll
position and per-entry state to hang on.
*/
export function useNavigationHistory(initial: string) {
  const [state, setState] = useState<HistoryState>({
    entries: [initial],
    index: 0,
    data: [{}],
  });
  const stateRef = useRef(state);

  /* The entry the document loaded on needs state too, or the first popstate back
     to it would carry nothing to match. */
  useEffect(() => {
    window.history.replaceState({ index: stateRef.current.index }, "");
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const index = (event.state as { index?: unknown } | null)?.index;
      if (typeof index !== "number") return;
      const current = stateRef.current;
      if (index < 0 || index >= current.entries.length) return;
      const next = { ...current, index };
      stateRef.current = next;
      setState(next);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const visit = useCallback((itemId: string) => {
    const current = stateRef.current;
    if (current.entries[current.index] === itemId) return;

    const entries = [...current.entries.slice(0, current.index + 1), itemId];
    const data = [...current.data.slice(0, current.index + 1), {}];
    const index = entries.length - 1;
    const next = { entries, index, data };
    /* The ref leads the state, so two visits in one tick still stack. */
    stateRef.current = next;
    window.history.pushState({ index }, "");
    setState(next);
  }, []);

  /* Patches the entry on screen and leaves the others as they were. */
  const setEntryData = useCallback((patch: Readonly<Record<string, unknown>>) => {
    setState((current) => {
      const data = current.data.map((entry, index) =>
        index === current.index ? { ...entry, ...patch } : entry,
      );
      const next = { ...current, data };
      stateRef.current = next;
      return next;
    });
  }, []);

  const back = useCallback(() => {
    if (stateRef.current.index > 0) window.history.back();
  }, []);

  const forward = useCallback(() => {
    if (stateRef.current.index < stateRef.current.entries.length - 1) {
      window.history.forward();
    }
  }, []);

  return {
    current: state.entries[state.index] ?? initial,
    /* Which entry is on screen; the scroll memory hangs on it. */
    index: state.index,
    /* The entry count, so a memory keyed by index can drop the entries a new
       visit truncated. */
    count: state.entries.length,
    entryData: state.data[state.index] ?? {},
    setEntryData,
    canGoBack: state.index > 0,
    canGoForward: state.index < state.entries.length - 1,
    visit,
    back,
    forward,
  };
}
