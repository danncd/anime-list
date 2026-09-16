import { useEffect, useState } from "react";
import type { CustomList } from "../../contracts/lists";
import { fetchListTitles } from "../../platform/anilist";

/* Covers standing in for a list that has no picture of its own. */
export const PREVIEW = 3;

/*
Covers for each list, fetched together so a list looks the same in every row that
shows it.
*/
export function useListCovers(
  lists: readonly CustomList[],
): ReadonlyMap<string, readonly string[]> {
  const [covers, setCovers] = useState<ReadonlyMap<string, readonly string[]>>(new Map());
  const wanted = lists.flatMap((list) => list.entries.slice(0, PREVIEW));
  /*
  Keyed by the entries themselves, not the array's identity: a caller that derives
  its array hands over a new identity every render, which re-ran this effect, set
  state, and looped.
  */
  const signature = wanted.map((entry) => `${entry.kind}${entry.id}`).join(",");

  useEffect(() => {
    if (wanted.length === 0) {
      setCovers(new Map());
      return;
    }

    let live = true;
    fetchListTitles(wanted)
      .then((titles) => {
        if (!live) return;
        const byId = new Map(titles.map((title) => [title.id, title.cover]));
        setCovers(
          new Map(
            lists.map((list) => [
              list.id,
              list.entries
                .slice(0, PREVIEW)
                .map((entry) => byId.get(entry.id))
                .filter((cover): cover is string => typeof cover === "string" && cover.length > 0),
            ]),
          ),
        );
      })
      .catch(() => {
        /* A row without covers still names the list and opens it. */
      });

    return () => {
      live = false;
    };
    /* `signature` alone is the dependency: an equal signature means the same
       entries in the same lists, so reading `lists` here cannot go stale. */
  }, [signature]);

  return covers;
}
