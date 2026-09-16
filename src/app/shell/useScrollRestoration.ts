import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/* Frames spent waiting for a view to reach its full height. */
const SETTLE_FRAMES = 60;

/*
Remembers where each history entry was scrolled to, keyed by history index so going
back returns to where that entry was left. The offset is re-applied over the frames
after paint, because a view that mounts as a skeleton is too short to hold it.
*/
export function useScrollRestoration(
  ref: RefObject<HTMLElement | null>,
  entry: number,
  /* The entry count. Offsets for entries a new visit cut are dropped, or a later
     entry taking their index would inherit their position. */
  count: number,
): void {
  const positions = useRef(new Map<number, number>());
  const current = useRef(entry);

  /* Record as the pane scrolls, on a frame so a fast drag writes once. */
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        positions.current.set(current.current, element.scrollTop);
      });
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [ref]);

  useLayoutEffect(() => {
    const element = ref.current;
    current.current = entry;

    for (const key of positions.current.keys()) {
      if (key >= count) positions.current.delete(key);
    }
    if (!element) return;

    const target = positions.current.get(entry) ?? 0;
    element.scrollTop = target;
    if (target === 0) return;

    let remaining = SETTLE_FRAMES;
    let frame = window.requestAnimationFrame(function settle() {
      const tallest = element.scrollHeight - element.clientHeight;
      if (element.scrollTop !== target && tallest >= target) element.scrollTop = target;
      remaining -= 1;
      frame = element.scrollTop === target || remaining <= 0
        ? 0
        : window.requestAnimationFrame(settle);
    });

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [ref, entry, count]);
}
