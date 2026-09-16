const { BrowserWindow, ipcMain, screen, systemPreferences } = require("electron");

/*
Window gestures live in the main process rather than in CSS `-webkit-app-region`
because the frame is hidden. The renderer forwards pointer points and the window is
moved with `setPosition`, which keeps dragging smooth and lets a double click
follow the macOS "double-click title bar" preference.
*/
let activeWindowDrag = null;
const restoreBoundsByWindow = new WeakMap();

function windowForEvent(event) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || event.senderFrame !== window.webContents.mainFrame) return null;
  return window;
}

function validPoint(point) {
  return Boolean(point) && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function installWindowGestures() {
  ipcMain.on("anime:window-drag-start", (event, point) => {
    const window = windowForEvent(event);
    if (!window || !validPoint(point)) return;
    activeWindowDrag = {
      window,
      senderId: event.sender.id,
      origin: window.getBounds(),
      pointer: point,
    };
  });

  ipcMain.on("anime:window-drag-move", (event, point) => {
    const drag = activeWindowDrag;
    if (!drag || drag.senderId !== event.sender.id || !validPoint(point)) return;
    drag.window.setPosition(
      Math.round(drag.origin.x + point.x - drag.pointer.x),
      Math.round(drag.origin.y + point.y - drag.pointer.y),
      false,
    );
  });

  ipcMain.on("anime:window-drag-end", (event) => {
    if (activeWindowDrag?.senderId === event.sender.id) activeWindowDrag = null;
  });

  ipcMain.handle("anime:double-click-title-bar", (event) => {
    const window = windowForEvent(event);
    if (!window) return;

    if (process.platform === "darwin") {
      const action = systemPreferences.getUserDefault("AppleActionOnDoubleClick", "string");
      if (action === "Minimize") {
        window.minimize();
        return;
      }
      if (action === "None") return;
    }

    const restoreBounds = restoreBoundsByWindow.get(window);
    if (restoreBounds) {
      restoreBoundsByWindow.delete(window);
      window.setBounds(restoreBounds, true);
      return;
    }

    const currentBounds = window.getBounds();
    restoreBoundsByWindow.set(window, currentBounds);
    window.setBounds(screen.getDisplayMatching(currentBounds).workArea, true);
  });
}

module.exports = { installWindowGestures };
