import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { AnimePoster } from "../../contracts/anime";
import { fetchSearch } from "../../platform/anilist";

const DEBOUNCE_MS = 220;
const RESULT_LIMIT = 6;

/* Flat, so the arrow keys move through the panel as one list. */
type Row = { readonly kind: "search" } | { readonly kind: "hit"; readonly item: AnimePoster };

export interface ContentSearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /* Hands the query to Explore All, where the full result set lives. */
  readonly onSearchAll: (query: string) => void;
  readonly onOpenAnime: (animeId: number) => void;
  readonly placeholder?: string;
}

/*
Typing opens a panel beneath the field. The route to Explore All is the first
row, so a query with no hits still leads somewhere.
*/

function metaBits(item: AnimePoster): readonly string[] {
  return [
    item.formatLabel,
    item.seasonYear === null ? null : String(item.seasonYear),
    item.count === null ? null : `${item.count} ${item.unit}`,
    item.score === null ? null : `★ ${item.score}`,
  ].filter((bit): bit is string => Boolean(bit));
}
export function ContentSearch({
  value,
  onChange,
  onSearchAll,
  onOpenAnime,
  placeholder = "Search anime",
}: ContentSearchProps) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<readonly AnimePoster[]>([]);
  const [cursor, setCursor] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const query = value.trim();

  /* One search per pause, not per keystroke. */
  useEffect(() => {
    if (!open || query === "") {
      setHits([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      fetchSearch(query, RESULT_LIMIT).then(
        (items) => {
          if (active) setHits(items);
        },
        () => {
          if (active) setHits([]);
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const rows = useMemo<readonly Row[]>(() => {
    if (query === "") return [];
    return [{ kind: "search" }, ...hits.map((item) => ({ kind: "hit" as const, item }))];
  }, [query, hits]);

  /* The first row is the default, so Enter searches without any arrowing. */
  useEffect(() => {
    setCursor(0);
  }, [query]);

  /* Keep the highlighted row in view when the keys move past the edge. */
  useEffect(() => {
    if (!open) return;
    const element = menu.current?.querySelectorAll(".search-row")[cursor];
    element?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const go = (run: () => void) => {
    setOpen(false);
    run();
  };

  const activate = (index: number) => {
    const row = rows[index];
    if (!row) return;
    if (row.kind === "search") go(() => onSearchAll(query));
    else go(() => onOpenAnime(row.item.id));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (rows.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((current) => Math.min(current + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(cursor);
    }
  };

  return (
    <div className="content-search-wrap" ref={root}>
      <form
        className="content-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          activate(cursor);
        }}
      >
        <MagnifyingGlass />
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open && rows.length > 0}
          aria-controls="search-menu"
          aria-activedescendant={rows.length > 0 ? `search-row-${cursor}` : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </form>

      {open && (
        <div className="search-menu" id="search-menu" role="listbox" ref={menu}>
          {query === "" ? (
            <p className="search-note">Type to search all anime and manga.</p>
          ) : (
            <>
              <button
                type="button"
                id="search-row-0"
                role="option"
                aria-selected={cursor === 0}
                className={`search-row is-primary${cursor === 0 ? " is-active" : ""}`}
                onMouseEnter={() => setCursor(0)}
                onClick={() => activate(0)}
              >
                <span className="search-glyph">
                  <MagnifyingGlass />
                </span>
                <span>
                  Search <strong>“{query}”</strong>
                </span>
                <span className="search-where">in Explore All</span>
              </button>

              {hits.length > 0 && <p className="search-head">Results</p>}
              {hits.map((item, index) => {
                const at = index + 1;
                return (
                  <button
                    type="button"
                    key={item.id}
                    id={`search-row-${at}`}
                    role="option"
                    aria-selected={cursor === at}
                    className={`search-row${cursor === at ? " is-active" : ""}`}
                    onMouseEnter={() => setCursor(at)}
                    onClick={() => activate(at)}
                  >
                    <span className="search-art">
                      <img src={item.cover} alt="" loading="lazy" draggable={false} />
                    </span>
                    <span className="search-body">
                      <span className="search-title">{item.title}</span>
                      <span className="search-meta">
                        {metaBits(item).map((bit) => (
                          <span className="search-pill" key={bit}>
                            {bit}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
