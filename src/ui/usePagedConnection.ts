import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Page } from "../contracts/anime";

export interface ConnectionState<T> {
  readonly items: readonly T[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly status: "loading" | "ready" | "error";
  /* True while the previous key's page is still on screen because the new one
     has not arrived. Consumers render it, dimmed, rather than blanking. */
  readonly stale: boolean;
  /* Which subject the items on screen belong to. It lags the reset key while
     `stale` is true, so a view can name what it is actually showing. */
  readonly itemsKey: unknown;
  /* The failure itself, for the surface that shows it to describe. Keeping the
     value rather than a sentence is what lets this stay out of `platform/`. */
  readonly error: unknown;
  readonly loadMore: () => void;
}

/*
Extends a paged connection past its first page, supplied by the caller or fetched
here. AniList caps the totals it reports, so "is there more" comes from each page's
hasNextPage rather than a count. The loader is held in a ref so a fresh closure
identity every render does not mean a fresh request.
*/
export function usePagedConnection<T>(
  resetKey: unknown,
  first: Page<T> | null,
  load: (page: number) => Promise<Page<T>>,
): ConnectionState<T> {
  const [extra, setExtra] = useState<readonly T[]>([]);
  const [hasMore, setHasMore] = useState(first?.hasMore ?? false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    first ? "ready" : "loading",
  );
  const [stale, setStale] = useState(false);
  const [itemsKey, setItemsKey] = useState<unknown>(first ? resetKey : null);
  const [error, setError] = useState<unknown>(null);
  const pageRef = useRef(1);
  /* Guards a second request that starts before loading has rendered. */
  const busyRef = useRef(false);
  /* The subject in force, so a response can tell whether it is still wanted. */
  const keyRef = useRef(resetKey);
  keyRef.current = resetKey;
  const loadRef = useRef(load);
  loadRef.current = load;

  /*
  Start over whenever the subject changes. The rows already on screen are kept
  until the new ones arrive: clearing them blanked the view between every sort,
  season or origin, which read as a flicker.
  */
  useEffect(() => {
    setLoading(false);
    setError(null);
    pageRef.current = 1;
    busyRef.current = false;

    if (first) {
      setExtra([]);
      setHasMore(first.hasMore);
      setStatus("ready");
      setStale(false);
      setItemsKey(resetKey);
    } else {
      /* What is on screen is still the previous subject's, so its own count
         stands until the new page lands. Resetting it here made the footer read
         "All 100 titles" for the length of a request that had more to come. */
      setStatus((current) => (current === "error" ? "loading" : current));
      setStale(true);
    }
  }, [resetKey, first]);

  useEffect(() => {
    if (first) return;
    let active = true;
    loadRef.current(1).then(
      (page) => {
        if (!active) return;
        setExtra(page.items);
        setHasMore(page.hasMore);
        setStatus("ready");
        setStale(false);
        setItemsKey(resetKey);
      },
      (reason) => {
        if (active) {
          setStatus("error");
          setStale(false);
          setError(reason);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [resetKey, first]);

  const loadMore = useCallback(() => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoading(true);
    const key = keyRef.current;
    const next = pageRef.current + 1;
    loadRef.current(next).then(
      (page) => {
        /* The subject can change while a page is in flight. A response that no
           longer belongs to it must not be appended to the new subject's list,
           and must not clear the state the reset effect has already restored. */
        if (keyRef.current !== key) return;
        pageRef.current = next;
        setExtra((current) => [...current, ...page.items]);
        setHasMore(page.hasMore);
        setLoading(false);
        busyRef.current = false;
      },
      (reason) => {
        if (keyRef.current !== key) return;
        setLoading(false);
        busyRef.current = false;
        setError(reason);
      },
    );
  }, [hasMore]);

  const items = useMemo(() => (first ? [...first.items, ...extra] : extra), [first, extra]);

  return { items, hasMore, loading, status, stale, itemsKey, error, loadMore };
}
