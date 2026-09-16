/* Last view and expanded sidebar branches, stored under the `anime-2.layout.*`
   keys alongside the sidebar width. Layout is disposable: losing it costs nothing. */
const VIEW_KEY = "anime-2.layout.view";
const EXPANDED_KEY = "anime-2.layout.expanded";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Storage can be unavailable; the layout still works for the session. */
  }
}

/* Stored JSON is untrusted: it can be edited by hand or written by another build. */
export function loadLastView(): string | null {
  const stored = read(VIEW_KEY);
  return stored !== null && stored.length > 0 ? stored : null;
}

export function saveLastView(viewId: string): void {
  write(VIEW_KEY, viewId);
}

export function loadExpandedSections(): readonly string[] {
  const stored = read(EXPANDED_KEY);
  if (stored === null) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function saveExpandedSections(ids: readonly string[]): void {
  write(EXPANDED_KEY, JSON.stringify(ids));
}
