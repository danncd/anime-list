import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/*
Electron loads the built HTML from disk, so every asset URL has to be relative.
The dev server port is fixed so `npm run electron:dev` can point at it.
*/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  clearScreen: false,
});
