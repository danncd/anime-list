/*
Packages the built app into a standalone `Anime List.app`: its own name, bundle
identifier and icon, with no dependency on this checkout or on `node_modules` at run
time. Signed ad-hoc, because Apple Silicon refuses a bundle whose signature no
longer matches its contents. Run with `npm run package`.
*/
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packager } from "@electron/packager";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAME = "Anime List";
const BUNDLE_ID = "dev.danny.animelist";
const OUT = path.join(ROOT, "release");
const PNG = path.join(ROOT, "public", "logo.png");
const ICNS = path.join(ROOT, "build", "logo.icns");

const RUNTIME = new Set(["dist", "electron", "public", "package.json"]);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

/* Apple's list of iconset sizes, largest last; `iconutil` refuses a set with a
   hole in it. */
function buildIcon() {
  if (fs.existsSync(ICNS) && fs.statSync(ICNS).mtimeMs >= fs.statSync(PNG).mtimeMs) {
    return ICNS;
  }

  const iconset = path.join(ROOT, "build", "logo.iconset");
  fs.rmSync(iconset, { recursive: true, force: true });
  fs.mkdirSync(iconset, { recursive: true });

  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const pixels = size * scale;
      const file = `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`;
      run("sips", ["-z", String(pixels), String(pixels), PNG, "--out", path.join(iconset, file)]);
    }
  }

  run("iconutil", ["-c", "icns", iconset, "-o", ICNS]);
  fs.rmSync(iconset, { recursive: true, force: true });
  return ICNS;
}

const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
const icon = buildIcon();

const [output] = await packager({
  dir: ROOT,
  name: NAME,
  executableName: NAME,
  platform: "darwin",
  arch: process.arch === "arm64" ? "arm64" : "x64",
  out: OUT,
  overwrite: true,
  asar: true,
  prune: true,
  icon,
  appBundleId: BUNDLE_ID,
  appCategoryType: "public.app-category.entertainment",
  appVersion: version,
  buildVersion: version,
  extendInfo: {
    CFBundleDisplayName: NAME,
    NSHumanReadableCopyright: "",
  },
  ignore: (file) => {
    /*
    The walker hands over paths relative to the app directory ("" for the
    directory itself, then "dist/index.html"), so a regex ignore would be matching
    a leading "/". Absolute paths are accepted too; this holds either way.
    */
    const relative =
      file === ROOT || file.startsWith(ROOT + path.sep)
        ? path.relative(ROOT, file)
        : file.replace(/^[/\\]+/, "");
    if (relative === "") return false;
    return !RUNTIME.has(relative.split(/[/\\]/)[0]);
  },
});

/*
The packager answers with the directory it built into, which holds the bundle
beside Electron's licence files.
*/
const app = output.endsWith(".app") ? output : path.join(output, `${NAME}.app`);
if (!fs.existsSync(app)) {
  throw new Error(`No app bundle was produced at ${app}`);
}

/* Ad-hoc: `--deep` is the shortcut, and the bundle is verified afterwards, which
   is what Apple Silicon insists on. */
run("codesign", ["--force", "--deep", "--sign", "-", app]);
run("codesign", ["--verify", "--deep", "--strict", app]);

const size = Number(run("du", ["-sk", app]).split("\t")[0]) / 1024;
console.log(`\n${app}`);
console.log(`${size.toFixed(0)} MB, signed ad-hoc, bundle id ${BUNDLE_ID}`);
