import { useEffect, useRef, useState, type CSSProperties } from "react";

/* A fixed speed makes a long title take longer than a short one; these bound the
   duration. */
const PIXELS_PER_SECOND = 34;
const MIN_DURATION = 2.6;
const MAX_DURATION = 12;

/*
Measures how far a single-line title overflows its box and exposes the distance
and a matching duration as custom properties. The CSS only animates while the
card is hovered.
*/
export function useOverflowingTitle(text: string) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const node = textRef.current;
    if (!viewport || !node) return;

    const measure = () => {
      const distance = Math.ceil(node.scrollWidth - viewport.clientWidth);
      setOverflow(distance > 1 ? distance : 0);
    };

    measure();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(viewport);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [text]);

  const seconds = Math.min(
    MAX_DURATION,
    Math.max(MIN_DURATION, overflow / PIXELS_PER_SECOND),
  );

  const style = {
    "--title-shift": `-${overflow}px`,
    "--title-duration": `${seconds.toFixed(2)}s`,
  } as CSSProperties;

  return { viewportRef, textRef, isOverflowing: overflow > 0, style };
}
