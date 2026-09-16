const path = require("node:path");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const { installWindowGestures } = require("./window-gestures.cjs");

/* The renderer reaches the host only through the preload bridge. */
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const NAME = "Anime List";

/* The renderer gets this long to report its first frame before the window is
   shown anyway. */
const SHOW_FALLBACK_MS = 2500;

/*
The name the window, the menu bar and the About panel use. The dock takes its
name from the bundle, which `scripts/brand-electron.cjs` renames.
*/
app.setName(NAME);

/*
The folder the user's lists have lived in since before the app was called this,
pinned so a rename can never move them: an app's data directory is derived from
its name.
*/
app.setPath("userData", path.join(app.getPath("appData"), "Anime"));

/*
The mark, shared with the renderer's copy in `public/` so there is one file rather
than two that can drift apart. Run unpackaged, Electron shows its own icon without
it.
*/
const LOGO = path.join(__dirname, "..", "public", "logo.png");

/*
The menu bar. Electron's default carries Reload, Force Reload and Toggle Developer
Tools, which are scaffolding rather than this app's; what it keeps are the items a
desktop app is expected to have. The development menu returns only when the app
runs against the dev server.
*/
function installMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: "appMenu" },
      { role: "editMenu" },
      ...(DEV_SERVER_URL ? [{ role: "viewMenu" }] : []),
      { role: "windowMenu" },
    ]),
  );
}

function createWindow() {
  const window = new BrowserWindow({
    title: NAME,
    icon: LOGO,
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 650,
    show: false,
    backgroundColor: "#ffffff",
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 17, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  /*
  The window is shown when the renderer reports its first frame on screen, not as
  soon as one is ready to be painted: earlier means a white frame, a reflow when
  the font swaps in, or half the interface. The timer is the other half, since a
  renderer that never gets there must not leave an invisible window behind.
  */
  const show = () => {
    if (!window.isDestroyed()) window.show();
  };
  const fallback = setTimeout(show, SHOW_FALLBACK_MS);
  const onReady = (event) => {
    if (BrowserWindow.fromWebContents(event.sender) !== window) return;
    clearTimeout(fallback);
    show();
  };
  ipcMain.on("anime:ready", onReady);
  window.on("closed", () => {
    clearTimeout(fallback);
    ipcMain.removeListener("anime:ready", onReady);
  });

  /* Without this a bundle that cannot load leaves a white window and no
     diagnostic. */
  window.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (!isMainFrame) return;
    console.error(`the renderer failed to load (${code} ${description}) from ${url}`);
  });

  /* The detail page links out to streaming sites and AniList; those belong in the
     user's browser. */
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });

  if (DEV_SERVER_URL) {
    void window.loadURL(DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

/*
One window at a time. The lists are one array in one data folder, saved whole on
every change, so a second window would quietly overwrite the first one's work. The
packaged app and the development window deliberately share that folder. A second
launch brings the open window to the front instead.
*/
if (!app.requestSingleInstanceLock()) {
  console.log(`${NAME} is already running`);
  app.quit();
} else {
  app.on("second-instance", () => {
    const [window] = BrowserWindow.getAllWindows();
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });

  app.whenReady().then(() => {
    /* The dock's icon is the app's face while it runs; a packaged build takes it
       from the bundle. */
    if (process.platform === "darwin" && app.dock) app.dock.setIcon(LOGO);

    installMenu();
    installWindowGestures();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else BrowserWindow.getAllWindows()[0]?.focus();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
