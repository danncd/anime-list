/*
The host boundary. The renderer reaches Electron only through the object the
preload script exposes on `window`, so this is a type-only module plus one global
declaration.
*/

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

interface AnimeDesktopBridge {
  readonly platform: string;
  readonly beginWindowDrag: (point: ScreenPoint) => void;
  readonly moveWindowDrag: (point: ScreenPoint) => void;
  readonly endWindowDrag: () => void;
  readonly doubleClickTitleBar: () => Promise<void>;
  /* Tells the host the first frame is on screen so it can show the window. */
  readonly signalReady: () => void;
}

declare global {
  interface Window {
    readonly animeDesktop?: AnimeDesktopBridge;
  }
}
