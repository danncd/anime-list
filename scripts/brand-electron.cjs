/*
macOS reads an app's identity from its bundle, and an unpackaged run's bundle is
Electron's own: the menu bar and About panel take its display name, the dock tooltip
takes the executable's name. This renames both and points `electron/path.txt` at the
result. `@electron/packager` does the same for a packaged build.
*/
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const NAME = "Anime List";

/* Only macOS has this bundle to reach into; everywhere else this is a no-op. */
if (process.platform !== "darwin") process.exit(0);

const DIST = path.join(__dirname, "..", "node_modules", "electron", "dist");
const BUNDLE = path.join(DIST, "Electron.app");
const PLIST = path.join(BUNDLE, "Contents", "Info.plist");
const PATH_FILE = path.join(__dirname, "..", "node_modules", "electron", "path.txt");

if (!fs.existsSync(PLIST)) process.exit(0);

const changes = [];

/* ---- the executable, which the dock's tooltip names ---- */
const OLD_EXECUTABLE = path.join(BUNDLE, "Contents", "MacOS", "Electron");
const NEW_EXECUTABLE = path.join(BUNDLE, "Contents", "MacOS", NAME);

if (fs.existsSync(OLD_EXECUTABLE) && !fs.existsSync(NEW_EXECUTABLE)) {
  fs.renameSync(OLD_EXECUTABLE, NEW_EXECUTABLE);
  changes.push("renamed the executable");
}

if (fs.existsSync(NEW_EXECUTABLE)) {
  const relative = path.relative(DIST, NEW_EXECUTABLE);
  if (fs.readFileSync(PATH_FILE, "utf8") !== relative) {
    /* No trailing newline: this file is read whole and used as a path. */
    fs.writeFileSync(PATH_FILE, relative);
    changes.push("pointed electron/path.txt at it");
  }
}

/* ---- the names the menu bar and LaunchServices read ---- */
let plist = fs.readFileSync(PLIST, "utf8");
const set = (key, value) => {
  const existing = new RegExp(`(<key>${key}</key>\\s*<string>)[^<]*(</string>)`);
  if (existing.test(plist)) {
    plist = plist.replace(existing, `$1${value}$2`);
    return;
  }
  plist = plist.replace(/(\n\t<\/dict>)/, `\n\t<key>${key}</key>\n\t<string>${value}</string>$1`);
};

for (const [key, value] of [
  ["CFBundleName", NAME],
  ["CFBundleDisplayName", NAME],
  ["CFBundleExecutable", NAME],
]) {
  set(key, value);
}

/* The identifier stays Electron's own: it is invisible to the user, and
   changing it would throw away the Dock's record of this app. */
if (plist !== fs.readFileSync(PLIST, "utf8")) {
  fs.writeFileSync(PLIST, plist);
  changes.push("named the bundle");
}

if (changes.length === 0) process.exit(0);

/* A bundle edited in place keeps its old LaunchServices record until it is
   re-registered, and the Dock reads that record. */
const now = new Date();
fs.utimesSync(BUNDLE, now, now);

const REGISTER =
  "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister";
if (fs.existsSync(REGISTER)) {
  spawnSync(REGISTER, ["-f", BUNDLE], { stdio: "ignore" });
}

console.log(`Electron's bundle is now ${NAME}: ${changes.join(", ")}`);
