import { useEffect, useMemo, useState } from "react";
import {
  countEntries,
  type CustomList,
  type ListEntryKind,
} from "../../contracts/lists";
import { describeError, fetchListTitles, type ListTitle } from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { DetailEntry } from "../shared/DetailEntry";
import { ConfirmButton } from "../../ui/ConfirmButton";
import { ListHeader } from "./ListHeader";
import { SortMenu } from "../shared/SortMenu";

type SortKey = "added" | "score" | "title";
type KindFilter = "all" | "anime" | "manga";

const SORT_LABELS: Record<SortKey, string> = {
  added: "Date added",
  score: "Score",
  title: "Title",
};

const SORT_OPTIONS: readonly { readonly key: SortKey; readonly label: string }[] = (
  ["added", "score", "title"] as const
).map((key) => ({ key, label: SORT_LABELS[key] }));

const KIND_LABELS: Record<KindFilter, string> = {
  all: "All",
  anime: "Anime",
  manga: "Manga",
};

export interface ListPageProps {
  readonly list: CustomList | null;
  readonly onOpenTitle: (kind: ListEntryKind, id: number) => void;
  readonly onRemoveEntry: (kind: ListEntryKind, id: number) => void;
  readonly onEdit: () => void;
  /* Called with the kinds AniList reported, to correct the stored records. */
  readonly onResolveKinds: (kinds: ReadonlyMap<number, ListEntryKind>) => void;
}

/* One list opened: header above, its titles as filterable, sortable rows below. */
export function ListPage({
  list,
  onOpenTitle,
  onRemoveEntry,
  onEdit,
  onResolveKinds,
}: ListPageProps) {
  const [titles, setTitles] = useState<readonly ListTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("added");
  const [descending, setDescending] = useState(true);
  const [armed, setArmed] = useState<string | null>(null);

  const entries = list?.entries;

  useEffect(() => {
    if (!entries || entries.length === 0) {
      setTitles([]);
      setError(null);
      return;
    }

    let live = true;
    setLoading(true);
    setError(null);
    fetchListTitles(entries)
      .then((result) => {
        if (!live) return;
        setTitles(result);
        onResolveKinds(new Map(result.map((title) => [title.id, title.kind])));
      })
      .catch((reason: unknown) => {
        if (live) setError(reason);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
    /* Refetch on identity only: `onResolveKinds` is an inline arrow at the root,
       so listing it would refetch on every render. */
  }, [entries]);

  /* Fetched titles are the truth for kind, so the counts beside the name agree
     with the rows beneath. Until they arrive, the stored entries are all there
     is. */
  const counts = useMemo(() => {
    if (titles.length === 0) {
      return list ? countEntries(list) : { anime: 0, manga: 0, total: 0 };
    }
    let anime = 0;
    let manga = 0;
    for (const title of titles) {
      if (title.kind === "anime") anime += 1;
      else manga += 1;
    }
    return { anime, manga, total: titles.length };
  }, [titles, list]);

  const addedAt = useMemo(() => {
    const map = new Map<number, number>();
    for (const entry of list?.entries ?? []) {
      map.set(entry.id, entry.addedAt);
    }
    return map;
  }, [list]);

  const visible = useMemo(() => {
    const filtered = titles.filter((title) => kind === "all" || title.kind === kind);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "score") return (a.score ?? 0) - (b.score ?? 0);
      return (addedAt.get(a.id) ?? 0) - (addedAt.get(b.id) ?? 0);
    });
    return descending ? sorted.reverse() : sorted;
  }, [titles, kind, sort, descending, addedAt]);

  if (!list) {
    return (
      <div className="browse-page">
        <Note spaced>This list no longer exists.</Note>
      </div>
    );
  }

  const preview = titles.slice(0, 3).map((title) => title.cover);
  return (
    <div className="browse-page list-page">
      <ListHeader list={list} counts={counts} preview={preview} onEdit={onEdit} />

      {entries && entries.length > 0 && (
        <div className="browse-controls">
          <div className="list-filter">
            {(["all", "anime", "manga"] as const).map((value) => (
              <button
                type="button"
                key={value}
                className={`browse-pill${kind === value ? " is-on" : ""}`}
                onClick={() => setKind(value)}
              >
                {KIND_LABELS[value]}
              </button>
            ))}
          </div>
          <span className="list-count">
            {visible.length} {visible.length === 1 ? "title" : "titles"}
          </span>

          <SortMenu
            label="Sort by:"
            options={SORT_OPTIONS}
            value={sort}
            descending={descending}
            onChange={(key, next) => {
              setSort(key);
              setDescending(next);
            }}
            /* A title sorts A to Z; a date or score sorts highest first. */
            descendingFor={(key) => key !== "title"}
          />
        </div>
      )}

      {error !== null && <Note spaced>{describeError(error)}</Note>}

      {entries && entries.length === 0 && <Note spaced>Nothing in this list yet.</Note>}

      <div className="list-rows">
        {visible.map((title) => {
          const key = String(title.id);
          const facts = [
            title.formatLabel,
            title.count !== null ? `${title.count} ${title.unit}` : null,
            title.year !== null ? String(title.year) : null,
          ].filter((fact): fact is string => fact !== null);

          return (
            <DetailEntry
              key={key}
              art={title.cover}
              rank={null}
              title={title.title}
              score={title.score}
              facts={facts}
              blurb={title.summary.length > 0 ? title.summary : null}
              onOpen={() => onOpenTitle(title.kind, title.id)}
              side={
                <ConfirmButton
                  className="remove-circle"
                  label={`Remove ${title.title} from this list`}
                  confirmLabel={`Confirm removing ${title.title}`}
                  armed={armed === key}
                  onArm={() => setArmed(key)}
                  onConfirm={() => {
                    onRemoveEntry(title.kind, title.id);
                    setArmed(null);
                  }}
                  onDisarm={() => setArmed(null)}
                />
              }
            />
          );
        })}
      </div>

      {loading && titles.length === 0 && <Note spaced>Loading titles…</Note>}

      {!loading && !error && entries && entries.length > 0 && visible.length === 0 && (
        <Note spaced>Nothing matches that filter.</Note>
      )}
    </div>
  );
}
