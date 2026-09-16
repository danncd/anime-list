/*
The app's own glyphs, drawn once as inline paths: a 24px box, round caps, and a
stroke weight the call site chooses rather than an icon library's.
*/

type ChevronDir = "left" | "right" | "down";

const CHEVRON_PATHS: Readonly<Record<ChevronDir, string>> = {
  left: "M14.5 6L9 12l5.5 6",
  right: "M9.5 6L15 12l-5.5 6",
  down: "M6 9.5l6 6 6-6",
};

/* `weight` is the stroke width: the toolbar and the hero use a lighter stroke than
   the rows and the pills. */
export function Chevron({ dir, weight = 2 }: { readonly dir: ChevronDir; readonly weight?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CHEVRON_PATHS[dir]} />
    </svg>
  );
}

export function PlusGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Tick() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

/* The order in force, pointing the way it runs. */
export function SortArrow({ descending }: { readonly descending: boolean }) {
  const shaft = descending ? "M6.5 1.4V11" : "M6.5 11.6V2";
  const head = descending ? "M2.6 7.1L6.5 11l3.9-3.9" : "M2.6 5.9L6.5 2l3.9 3.9";
  return (
    <svg
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={shaft} />
      <path d={head} />
    </svg>
  );
}

export function Sliders() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}

export function InfoGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GripGlyph() {
  return (
    <svg viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
      {[3, 8, 13].map((y) => (
        <g key={y}>
          <circle cx="3" cy={y} r="1.3" />
          <circle cx="9" cy={y} r="1.3" />
        </g>
      ))}
    </svg>
  );
}

export function PinGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

/* The overflow mark: more actions for one row. */
export function MoreGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
  );
}
