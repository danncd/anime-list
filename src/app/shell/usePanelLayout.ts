import { useCallback, useEffect, useRef, useState } from "react";

/*
Sidebar geometry: drag to resize between the minimum and the maximum, with
resistance below the resting width and a collapse threshold that closes the panel.
Closing remembers the width and reopening restores it. Keyboard resize is arrows
for 10px, Shift for 25px, Home and End to snap.
*/
const MIN_SIDEBAR_WIDTH = 190;
const MAX_SIDEBAR_WIDTH = 360;
const MIN_EDITOR_SPACE = 320;
const COLLAPSE_THRESHOLD = 150;
const RESISTANCE_LIMIT = 210;
const DEFAULT_SIDEBAR_WIDTH = 252;

const MAIN_WIDTH_KEY = "anime-2.layout.main-width";

function resistedWidth(next: number, startWidth: number, maximum: number): number {
  const resistanceStart = Math.min(RESISTANCE_LIMIT, startWidth || RESISTANCE_LIMIT);
  return Math.min(
    maximum,
    next < resistanceStart ? resistanceStart - (resistanceStart - next) * 0.25 : next,
  );
}

function readStoredWidth(key: string, fallback: number, min: number, max: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

function storeWidth(key: string, width: number) {
  try {
    window.localStorage.setItem(key, String(Math.round(width)));
  } catch {
    /* localStorage can throw; the layout still works for the session. */
  }
}

export interface PanelLayoutOptions {
  readonly mainOpen: boolean;
  readonly onMainOpenChange: (open: boolean) => void;
}

export function usePanelLayout({ mainOpen, onMainOpenChange }: PanelLayoutOptions) {
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => resizeCleanupRef.current?.(), []);

  /* One sidebar means one divider, which occupies space only while open. */
  const dividerWidth = mainOpen ? 0.5 : 0;

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [mainWidth, setMainWidth] = useState(() =>
    readStoredWidth(MAIN_WIDTH_KEY, DEFAULT_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH),
  );
  const [savedMainWidth, setSavedMainWidth] = useState(() =>
    readStoredWidth(MAIN_WIDTH_KEY, DEFAULT_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH),
  );
  const [mainDragging, setMainDragging] = useState(false);

  useEffect(() => {
    if (!mainDragging) storeWidth(MAIN_WIDTH_KEY, savedMainWidth);
  }, [mainDragging, savedMainWidth]);

  useEffect(() => {
    let frameId: number | null = null;

    /* Shrink the sidebar to keep the editor's minimum space, before the window
       clips it. */
    const fitPanelsToWindow = () => {
      frameId = null;
      setViewportWidth(window.innerWidth);
      let main = mainOpen ? mainWidth : 0;
      const excess = Math.max(0, main + MIN_EDITOR_SPACE + dividerWidth - window.innerWidth);
      main -= Math.min(excess, mainOpen ? Math.max(0, main - MIN_SIDEBAR_WIDTH) : 0);
      if (mainOpen && main !== mainWidth) setMainWidth(main);
    };

    const onWindowResize = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(fitPanelsToWindow);
    };

    fitPanelsToWindow();
    window.addEventListener("resize", onWindowResize);
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onWindowResize);
    };
  }, [dividerWidth, mainOpen, mainWidth]);

  const startMainResize = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      resizeCleanupRef.current?.();
      setMainDragging(true);
      const startX = event.clientX;
      const startWidth = mainOpen ? mainWidth : 0;
      let frameId: number | null = null;
      let latestX = startX;
      let panelOpen = mainOpen;

      const applyResize = () => {
        frameId = null;
        const next = startWidth + latestX - startX;
        if (next < COLLAPSE_THRESHOLD) {
          if (panelOpen) {
            panelOpen = false;
            onMainOpenChange(false);
          }
          return;
        }

        if (!panelOpen) {
          panelOpen = true;
          onMainOpenChange(true);
        }
        const maxAllowed = window.innerWidth - MIN_EDITOR_SPACE - dividerWidth;
        const boundedMax = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, maxAllowed));

        const width = resistedWidth(next, startWidth, boundedMax);
        setMainWidth(width);
        if (next >= Math.max(MIN_SIDEBAR_WIDTH, Math.min(RESISTANCE_LIMIT, startWidth))) {
          setSavedMainWidth(width);
        }
      };

      const onMove = (moveEvent: PointerEvent) => {
        latestX = moveEvent.clientX;
        if (frameId === null) frameId = requestAnimationFrame(applyResize);
      };

      const onUp = () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          applyResize();
        }
        setMainDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("blur", onUp);
        resizeCleanupRef.current = null;
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("blur", onUp);
      resizeCleanupRef.current = onUp;
    },
    [dividerWidth, mainOpen, mainWidth, onMainOpenChange],
  );

  const toggleMain = useCallback(() => {
    if (mainOpen) {
      onMainOpenChange(false);
      return;
    }
    const available = Math.max(
      MIN_SIDEBAR_WIDTH,
      window.innerWidth - MIN_EDITOR_SPACE - dividerWidth,
    );
    setMainWidth(Math.min(savedMainWidth, available));
    onMainOpenChange(true);
  }, [dividerWidth, mainOpen, onMainOpenChange, savedMainWidth]);

  const mainMaximum = Math.min(
    MAX_SIDEBAR_WIDTH,
    Math.max(MIN_SIDEBAR_WIDTH, viewportWidth - MIN_EDITOR_SPACE - dividerWidth),
  );

  const resizeWithKeyboard = (event: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? MIN_SIDEBAR_WIDTH
        : event.key === "End"
          ? mainMaximum
          : Math.max(
              MIN_SIDEBAR_WIDTH,
              Math.min(
                mainMaximum,
                mainWidth + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 25 : 10),
              ),
            );
    setMainWidth(next);
    setSavedMainWidth(next);
  };

  return {
    mainMaximum,
    mainWidth: mainOpen ? mainWidth : 0,
    mainContentWidth: mainWidth,
    mainDragging: mainDragging && mainOpen,
    startMainResize,
    toggleMain,
    resizeWithKeyboard,
  };
}
