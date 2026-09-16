/*
Paint the app, then let the host show the window: the boot screen in `index.html` is
on screen before the bundle parses or the stylesheet applies, and the window stays
hidden until `revealApp`. The host shows it on a timer if the renderer never does.
*/
const FADE_MS = 220;

function bootScreen(): HTMLElement | null {
  return document.getElementById("boot");
}

/* One frame for React to render into, one for that render to be painted. */
function afterPaint(): Promise<void> {
  return new Promise((done) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => done()));
  });
}

export function revealApp(): void {
  void (async () => {
    /*
    Fonts first: Sora arrives after the bundle, and text that reflows once it
    lands is the flicker this exists to avoid. A font set that never arrives must
    not hold the window, so the wait is not allowed to reject.
    */
    try {
      await document.fonts.ready;
    } catch {
      /* No font set to wait for. */
    }

    await afterPaint();

    const boot = bootScreen();
    if (!boot) {
      window.animeDesktop?.signalReady();
      return;
    }

    /*
    The screen fades rather than vanishes, and the window is shown as it starts to
    go: the app is already painted behind it. A host that showed the window on its
    own timer gets the same fade, since the screen is removed either way.
    */
    boot.classList.add("is-gone");
    window.animeDesktop?.signalReady();
    window.setTimeout(() => boot.remove(), FADE_MS);
  })();
}
