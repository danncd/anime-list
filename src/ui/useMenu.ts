import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

interface Menu {
  readonly open: boolean;
  readonly toggle: () => void;
  readonly close: () => void;
  /* The field the menu belongs to; it is the positioning context. */
  readonly root: RefObject<HTMLDivElement | null>;
  /* The menu itself, measured to decide where it fits. */
  readonly menuRef: RefObject<HTMLDivElement | null>;
}

const GAP = 7;
const PAD = 10;

/*
Places an open menu inside the pane. The scroll container hides horizontal
overflow, so a menu that leaves its pane is clipped; a sidebar menu must therefore
be measured against the sidebar, not the content pane. Vertically the menu opens
upward only when it fits there.
*/
function paneOf(root: HTMLElement): HTMLElement {
  return (
    root.closest<HTMLElement>(".sidebar-scroll-region") ??
    root.closest<HTMLElement>(".editor-scroll") ??
    document.documentElement
  );
}

function place(root: HTMLElement, menu: HTMLElement): void {
  const scroller = paneOf(root);
  const bounds = scroller.getBoundingClientRect();
  const trigger = root.getBoundingClientRect();

  menu.style.left = "0px";
  menu.style.right = "auto";
  menu.style.top = "";
  menu.style.bottom = "auto";

  const size = menu.getBoundingClientRect();

  let left = 0;
  const pastRight = trigger.left + size.width - (bounds.right - PAD);
  if (pastRight > 0) left = -pastRight;
  const pastLeft = trigger.left + left - (bounds.left + PAD);
  if (pastLeft < 0) left -= pastLeft;
  menu.style.left = `${left}px`;

  const fitsBelow = trigger.bottom + GAP + size.height <= bounds.bottom - PAD;
  const fitsAbove = trigger.top - GAP - size.height >= bounds.top + PAD;
  if (!fitsBelow && fitsAbove) {
    menu.style.top = "auto";
    menu.style.bottom = `calc(100% + ${GAP}px)`;
  }
}

/* Open state for a dropdown, closed by an outside press or Escape, and kept
   inside the pane while it is open. */
export function useMenu(): Menu {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /* Placement can only be measured once the menu is in the DOM. */
  useLayoutEffect(() => {
    const rootElement = root.current;
    const menu = menuRef.current;
    if (!open || !rootElement || !menu) return;

    let frame = 0;
    const reposition = () => place(rootElement, menu);

    place(rootElement, menu);
    /* Again on the next frame: a menu measured before its layout has settled
       reports the wrong width and is placed against the wrong edge. */
    frame = window.requestAnimationFrame(reposition);

    window.addEventListener("resize", reposition);
    /* Scrolling the pane the menu is in moves its trigger out from under it. */
    const pane = paneOf(rootElement);
    const scroller = pane === document.documentElement ? null : pane;
    scroller?.addEventListener("scroll", reposition, { passive: true });
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", reposition);
      scroller?.removeEventListener("scroll", reposition);
    };
  }, [open]);

  return { open, toggle: () => setOpen((current) => !current), close, root, menuRef };
}
