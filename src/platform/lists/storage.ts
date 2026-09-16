import type {
  CustomList,
  ListEntry,
  ListEntryKind,
  ListOrder,
  ListOrderMode,
} from "../../contracts/lists";
import { DEFAULT_LIST_ORDER } from "../../contracts/lists";

/*
Lists live in local storage; there is no server, and losing them on every restart
would make the feature pointless. The key carries a version so a shape change can
be migrated rather than guessed at.
*/
const KEY = "anime-2.lists.v1";

function isKind(value: unknown): value is ListEntryKind {
  return value === "anime" || value === "manga";
}

/* AniList ids are positive integers; anything else cannot name a title. */
function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/* A timestamp is a positive finite number; anything else becomes now. */
function timestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : Date.now();
}

/* Pictures are data URLs from a file input; nothing else is safe in an <img src>. */
function picture(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

/* Stored JSON is untrusted: it can be edited by hand or written by another build. */
function readEntry(value: unknown): ListEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;
  if (!isId(entry["id"]) || !isKind(entry["kind"])) return null;
  return {
    id: entry["id"],
    kind: entry["kind"],
    addedAt: timestamp(entry["addedAt"]),
  };
}

function readList(value: unknown): CustomList | null {
  if (typeof value !== "object" || value === null) return null;
  const list = value as Record<string, unknown>;
  const id = list["id"];
  const label = list["label"];
  if (typeof id !== "string" || id.length === 0) return null;

  const parsed = Array.isArray(list["entries"])
    ? list["entries"].map(readEntry).filter((entry): entry is ListEntry => entry !== null)
    : [];

  /* A title is held at most once however the file was written, so a count always
     matches the rows beneath it. */
  const seen = new Set<number>();
  const entries = parsed.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });

  return {
    id,
    label: typeof label === "string" && label.trim().length > 0 ? label : "Untitled list",
    description: typeof list["description"] === "string" ? list["description"] : "",
    picture: picture(list["picture"]),
    createdAt: timestamp(list["createdAt"]),
    updatedAt: timestamp(list["updatedAt"]),
    entries,
    /* Absent in lists stored before pinning, where false is the same as never
       pinned. */
    pinned: list["pinned"] === true,
  };
}

export function loadLists(): readonly CustomList[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    /* One list per id; a duplicate would make lookups and mutations act on
       whichever came first. */
    const byId = new Map<string, CustomList>();
    for (const list of parsed.map(readList)) {
      if (list !== null && !byId.has(list.id)) byId.set(list.id, list);
    }
    return [...byId.values()];
  } catch {
    /* Unreadable or unavailable storage is not a reason to fail to start. */
    return [];
  }
}

export function saveLists(lists: readonly CustomList[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lists));
  } catch {
    /* Full or disabled storage: the session still works from memory. */
  }
}

/*
Which order the lists are shown in. The order is the array's; this view on top of
it is persisted too, so a restart keeps both.
*/
const ORDER_KEY = "anime-2.lists.order";

const ORDER_MODES: readonly ListOrderMode[] = ["custom", "date", "name", "items"];

export function loadListOrder(): ListOrder {
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return DEFAULT_LIST_ORDER;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_LIST_ORDER;
    const record = parsed as Record<string, unknown>;
    const mode = record["mode"];
    if (typeof mode !== "string" || !ORDER_MODES.includes(mode as ListOrderMode)) {
      return DEFAULT_LIST_ORDER;
    }
    return { mode: mode as ListOrderMode, descending: record["descending"] !== false };
  } catch {
    return DEFAULT_LIST_ORDER;
  }
}

export function saveListOrder(order: ListOrder): void {
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    /* Full or disabled storage: the session still works from memory. */
  }
}
