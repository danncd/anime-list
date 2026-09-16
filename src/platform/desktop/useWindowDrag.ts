import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { ScreenPoint } from "./bridge";

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, input, textarea, a, [role="button"], [role="menu"], [contenteditable="true"]',
      ),
    )
  );
}

/*
Window dragging over IPC: pointer points go to the main process, which moves the
window, so the hidden title bar still feels native. Move events are coalesced to
one frame, and every exit path ends the drag so it cannot outlive the pointer.
*/
export function useWindowDrag() {
  const pointerIdRef = useRef<number | null>(null);
  const latestPointRef = useRef<ScreenPoint | null>(null);
  const frameRef = useRef<number | null>(null);

  const flushMove = useCallback(() => {
    frameRef.current = null;
    const point = latestPointRef.current;
    if (point) window.animeDesktop?.moveWindowDrag(point);
  }, []);

  const finishDrag = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      flushMove();
    }
    pointerIdRef.current = null;
    latestPointRef.current = null;
    window.animeDesktop?.endWindowDrag();
  }, [flushMove]);

  /* Ends a drag still running when the toolbar unmounts; with no drag in progress
     there is nothing to end. */
  useEffect(
    () => () => {
      if (pointerIdRef.current !== null) finishDrag();
    },
    [finishDrag],
  );

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!window.animeDesktop?.beginWindowDrag || event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    window.animeDesktop.beginWindowDrag({ x: event.screenX, y: event.screenY });
    event.preventDefault();
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      latestPointRef.current = { x: event.screenX, y: event.screenY };
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(flushMove);
      }
    },
    [flushMove],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag();
    },
    [finishDrag],
  );

  const onDoubleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    void window.animeDesktop?.doubleClickTitleBar();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onDoubleClick,
  };
}
