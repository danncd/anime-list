const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("animeDesktop", {
  platform: process.platform,
  beginWindowDrag: (point) => ipcRenderer.send("anime:window-drag-start", point),
  moveWindowDrag: (point) => ipcRenderer.send("anime:window-drag-move", point),
  endWindowDrag: () => ipcRenderer.send("anime:window-drag-end"),
  doubleClickTitleBar: () => ipcRenderer.invoke("anime:double-click-title-bar"),
  signalReady: () => ipcRenderer.send("anime:ready"),
});

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("electron-shell");
});
