import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import { App } from "./app/App";
import { revealApp } from "./app/startup";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element was not found");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Paints, waits for the fonts, then tells the host to show the window. */
revealApp();
