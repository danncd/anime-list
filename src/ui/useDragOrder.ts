import { useCallback, useEffect, useRef, type RefObject } from "react";

export type DragOrderStyle = "reflow" | "line";

export interface DragOrderOptions {
  /* Off whenever the rows on screen are a subset of the whole set, such as while
     a search is active: a drop among them has no unambiguous place in the order. */
  readonly enabled: boolean;
  /*
  How the drag reads. "reflow" holds the row's place open at full height, so the
  rows around it move aside; "line" marks the same place with a hairline instead,
  which suits a narrow column of short rows.
  */
  readonly style: DragOrderStyle;
  /* A selector: when given, only that part of a row starts a drag. Otherwise the
     whole row does. */
  readonly handle?: string | undefined;
  /* A selector: a press inside one of these belongs to that control, such as the
     row's own menu, and does not start a drag. */
  readonly ignore?: string | undefined;
  /*
  Runs once the press has become a drag, for callers that need to put the list
  into the order the drag is about to change. Not on the press itself: a press
  that turns out to be a click must change nothing.
  */
  readonly onDragStart?: (() => void) | undefined;
  /* Called once on drop: what moved, and the id it now sits before, or null for
     last. */
  readonly onDrop: (id: string, beforeId: string | null) => void;
}

export interface DragOrder {
  /* Attach to the element whose children are the rows. */
  readonly containerRef: RefObject<HTMLDivElement | null>;
}

/* A press becomes a drag only after this much movement, so a click stays a click. */
const THRESHOLD_PX = 4;
/* Distance from a scroller's edge at which a drag starts scrolling it. */
const EDGE_PX = 44;
const SCROLL_STEP_PX = 10;
const ROW = "[data-drag-id]";
/* Rows fixed in place: neither draggable nor passable. */
const FIXED = '[data-drag-fixed="true"]';

function idOf(element: Element | null): string | null {
  return element?.getAttribute("data-drag-id") ?? null;
}

/* The nearest ancestor that actually scrolls, so a long drag can reach past the
   viewport without letting go. */
function scrollParent(from: HTMLElement): HTMLElement | null {
  let node = from.parentElement;
  while (node) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

interface DragState {
  readonly id: string;
  readonly style: DragOrderStyle;
  readonly startY: number;
  readonly grab: number;
  readonly scroller: HTMLElement | null;
  pointerY: number;
  moved: boolean;
  row: HTMLElement | null;
  ghost: HTMLElement | null;
  marker: HTMLElement | null;
  frame: number;
}

/*
Drag-to-reorder for rows carrying `data-drag-id`; a row marked
`data-drag-fixed="true"` is neither draggable nor passable, which is what keeps a
pinned block in place without a special case. Nothing React owns moves mid-drag.
*/
export function useDragOrder(options: DragOrderOptions): DragOrder {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<DragState | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const suppressClickRef = useRef(false);

  const passable = useCallback((container: HTMLElement, skip: Element | null): HTMLElement[] => {
    return [...container.querySelectorAll<HTMLElement>(ROW)].filter(
      (element) => element !== skip && !element.matches(FIXED),
    );
  }, []);

  const place = useCallback(() => {
    const state = stateRef.current;
    if (!state?.moved || !state.marker) return;
    const container = containerRef.current;
    if (!container) return;

    if (state.ghost) state.ghost.style.top = `${state.pointerY - state.grab}px`;

    for (const candidate of passable(container, state.row)) {
      const rect = candidate.getBoundingClientRect();
      if (state.pointerY < rect.top + rect.height / 2) {
        if (candidate.previousElementSibling !== state.marker) {
          container.insertBefore(state.marker, candidate);
        }
        return;
      }
    }
    container.appendChild(state.marker);
  }, [passable]);

  const tick = useCallback(() => {
    const state = stateRef.current;
    if (!state) return;
    if (state.scroller) {
      const rect = state.scroller.getBoundingClientRect();
      if (state.pointerY < rect.top + EDGE_PX) state.scroller.scrollTop -= SCROLL_STEP_PX;
      else if (state.pointerY > rect.bottom - EDGE_PX) state.scroller.scrollTop += SCROLL_STEP_PX;
    }
    place();
    state.frame = window.requestAnimationFrame(tick);
  }, [place]);

  const clean = useCallback(() => {
    const state = stateRef.current;
    stateRef.current = null;
    document.body.classList.remove("is-dragging");
    if (!state) return;
    if (state.frame !== 0) window.cancelAnimationFrame(state.frame);
    state.ghost?.remove();
    state.marker?.remove();
    state.row?.classList.remove("is-dragging", "is-ghost");
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const settings = optionsRef.current;
      if (!settings.enabled || event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target) return;
      /* Looked up on each press, not at registration: a caller's rows can mount
         later, and a drag that stopped working once they did would only have
         worked once. */
      const container = containerRef.current;
      if (!container) return;
      if (settings.handle && !target.closest(settings.handle)) return;
      if (settings.ignore && target.closest(settings.ignore)) return;
      const row = target.closest<HTMLElement>(ROW);
      if (!row || row.matches(FIXED) || !container.contains(row)) return;

      /* Only the pointer geometry is kept here: the caller may reorder once the
         drag begins, so the row itself is looked up again then. */
      const rect = row.getBoundingClientRect();
      stateRef.current = {
        id: idOf(row) ?? "",
        style: settings.style,
        startY: event.clientY,
        grab: event.clientY - rect.top,
        scroller: scrollParent(container),
        pointerY: event.clientY,
        moved: false,
        row: null,
        ghost: null,
        marker: null,
        frame: 0,
      };
    };

    const begin = () => {
      const state = stateRef.current;
      const container = containerRef.current;
      if (!state || !container) return false;
      const row = container.querySelector<HTMLElement>(
        `${ROW}[data-drag-id="${CSS.escape(state.id)}"]`,
      );
      if (!row) {
        stateRef.current = null;
        return false;
      }
      state.moved = true;
      state.row = row;
      document.body.classList.add("is-dragging");

      /* Lifted from where it was grabbed, before the caller is given the chance
         to reorder the list out from under it. */
      const rect = row.getBoundingClientRect();
      const ghost = row.cloneNode(true) as HTMLElement;
      ghost.classList.add("drag-ghost");
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      ghost.style.width = `${rect.width}px`;
      document.body.appendChild(ghost);
      state.ghost = ghost;

      optionsRef.current.onDragStart?.();

      const marker = document.createElement("div");
      marker.className = state.style === "line" ? "drop-line" : "drag-placeholder";
      if (state.style === "line") marker.style.height = "2px";
      else marker.style.height = `${rect.height}px`;
      row.parentElement?.insertBefore(marker, row);
      state.marker = marker;

      row.classList.add(state.style === "line" ? "is-ghost" : "is-dragging");
      state.frame = window.requestAnimationFrame(tick);
      return true;
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = stateRef.current;
      if (!state) return;
      state.pointerY = event.clientY;
      if (!state.moved) {
        if (Math.abs(event.clientY - state.startY) < THRESHOLD_PX) return;
        if (!begin()) return;
      }
      event.preventDefault();
      place();
    };

    const onPointerUp = () => {
      const state = stateRef.current;
      if (!state) return;
      if (!state.moved) {
        clean();
        return;
      }
      /* What the marker sits before, or null when it is last. */
      let next = (state.marker ?? state.row)?.nextElementSibling ?? null;
      while (next && !next.matches(ROW)) next = next.nextElementSibling;
      const id = state.id;
      const beforeId = idOf(next);
      suppressClickRef.current = true;
      /* The caller re-renders from this; the marker goes on the next frame so the
         two orders are never on screen at once. */
      optionsRef.current.onDrop(id, beforeId);
      window.requestAnimationFrame(clean);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      clean();
    };
  }, [clean, place, tick]);

  /* A drag is not a click on the row it started from. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.stopPropagation();
      event.preventDefault();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /*
  The keyboard's equivalent is not here: a move is expressed in the order the
  caller keeps, and only the caller knows it. `moveList` in the lists contract
  says which row a move lands before, on any surface.
  */
  return { containerRef };
}
