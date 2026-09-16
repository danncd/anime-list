/*
Brand marks for the watch actions, inlined to avoid an icon dependency. Each
carries its own colour; an unknown site falls back to a neutral glyph.
*/

export function YouTubeMark() {
  return (
    <svg className="site-mark-youtube" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function CrunchyrollMark() {
  return (
    <svg className="site-mark-crunchyroll" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.933 13.467a10.55 10.55 0 1 1 21.067-.8V12c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12h.8a10.617 10.617 0 0 1-9.867-10.533zM19.2 14a3.85 3.85 0 0 1-1.333-7.467A7.89 7.89 0 0 0 14 5.6a8.4 8.4 0 1 0 8.4 8.4 6.492 6.492 0 0 0-.133-1.6A3.415 3.415 0 0 1 19.2 14z" />
    </svg>
  );
}

function ExternalMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M14 5h5v5M19 5l-8 8M10 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-4" />
    </svg>
  );
}

export function SiteMark({ site }: { readonly site: string }) {
  const key = site.toLowerCase();
  if (key.startsWith("crunchyroll")) return <CrunchyrollMark />;
  if (key.startsWith("youtube")) return <YouTubeMark />;
  return <ExternalMark />;
}
