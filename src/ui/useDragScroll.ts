import { useCallback, useEffect, useRef, useState } from "react";

/* A press only becomes a drag after this much movement, so a plain click still
   activates whatever is under it. */
const DRAG_THRESHOLD = 4;
/* Pointer history used to measure the release velocity. */
const SAMPLE_WINDOW = 100;
const SAMPLE_LIMIT = 10;
/* Fraction of velocity kept per 60fps frame while coasting, and the speed at
   which coasting stops. Velocity is px per millisecond. */
const FRICTION = 0.94;
const MIN_VELOCITY = 0.02;

interface Sample {
  readonly x: number;
  readonly t: number;
}

/*
Click-and-drag scrolling for a horizontal row, alongside native touch and wheel
input. A press becomes a drag only past the threshold, and the release coasts on the
sampled velocity until friction stops it.
*/
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const stateRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const samplesRef = useRef<readonly Sample[]>([]);
  const draggedRef = useRef(false);
  const inertiaRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const stopInertia = useCallback(() => {
    if (inertiaRef.current !== null) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
  }, []);

  useEffect(() => stopInertia, [stopInertia]);

  /* Velocity of the pointer over the last SAMPLE_WINDOW, in px/ms, flipped into
     scroll space. */
  const releaseVelocity = useCallback((): number => {
    const samples = samplesRef.current;
    const last = samples[samples.length - 1];
    if (!last || samples.length < 2) return 0;

    let first = last;
    for (let index = samples.length - 1; index >= 0; index -= 1) {
      const sample = samples[index];
      if (!sample || last.t - sample.t > SAMPLE_WINDOW) break;
      first = sample;
    }

    const elapsed = last.t - first.t;
    if (elapsed <= 0) return 0;
    return -((last.x - first.x) / elapsed);
  }, []);

  const coast = useCallback(
    (element: T, velocity: number) => {
      stopInertia();
      let current = velocity;
      let previous = performance.now();

      const step = (now: number) => {
        const elapsed = now - previous;
        previous = now;

        element.scrollLeft += current * elapsed;
        current *= Math.pow(FRICTION, elapsed / 16.6667);

        const limit = element.scrollWidth - element.clientWidth;
        const hitEdge = element.scrollLeft <= 0 || element.scrollLeft >= limit;
        if (hitEdge || Math.abs(current) < MIN_VELOCITY) {
          inertiaRef.current = null;
          return;
        }
        inertiaRef.current = requestAnimationFrame(step);
      };

      inertiaRef.current = requestAnimationFrame(step);
    },
    [stopInertia],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<T>) => {
      const element = ref.current;
      if (!element || event.button !== 0 || !event.isPrimary) return;

      stopInertia();
      stateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: element.scrollLeft,
        moved: false,
      };
      samplesRef.current = [{ x: event.clientX, t: performance.now() }];
      draggedRef.current = false;
      /* No pointer capture on press: capturing retargets the click to the row, so
         the cards inside would never receive one. */
    },
    [stopInertia],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<T>) => {
    const element = ref.current;
    const state = stateRef.current;
    if (!element || !state || state.pointerId !== event.pointerId) return;

    const delta = event.clientX - state.startX;
    if (!state.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      state.moved = true;
      draggedRef.current = true;
      setDragging(true);

      /* Now that this is a drag rather than a click, capture keeps it alive
         outside the row. It is optional, so a pointer that cannot be captured
         still drags. */
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        /* no active pointer to capture */
      }
    }

    samplesRef.current = [
      ...samplesRef.current,
      { x: event.clientX, t: performance.now() },
    ].slice(-SAMPLE_LIMIT);
    element.scrollLeft = state.startScroll - delta;
    event.preventDefault();
  }, []);

  const endDrag = useCallback(
    (event: React.PointerEvent<T>) => {
      const element = ref.current;
      const state = stateRef.current;
      if (!element || !state || state.pointerId !== event.pointerId) return;

      try {
        if (element.hasPointerCapture(state.pointerId)) {
          element.releasePointerCapture(state.pointerId);
        }
      } catch {
        /* capture already released */
      }

      const velocity = state.moved ? releaseVelocity() : 0;
      stateRef.current = null;
      setDragging(false);

      /*
      A mouse drag's click is dispatched with the pointerup, so it is already
      suppressed by the time a zero-delay timer runs. Clearing the flag here stops
      a drag that ended without a click from swallowing the next activation, which
      can come from the keyboard with no pointerdown to reset it.
      */
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);

      if (Math.abs(velocity) > MIN_VELOCITY) {
        coast(element, velocity);
      }
    },
    [coast, releaseVelocity],
  );

  const onWheel = useCallback(() => {
    stopInertia();
  }, [stopInertia]);

  const onClickCapture = useCallback((event: React.MouseEvent<T>) => {
    if (!draggedRef.current) return;
    draggedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    ref,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onWheel,
      onClickCapture,
    },
  };
}
