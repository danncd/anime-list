/*
Inline paths keep the sidebar free of an icon dependency. The coordinates match
`app/shell/Sidebar.tsx` at a 24px viewBox and 1.8 stroke.
*/
const paths = {
  home: "M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z",
  season: "M3 9h18M3 13.5h18M3 18h11",
  user: "M12 4.4a3.6 3.6 0 100 7.2 3.6 3.6 0 000-7.2M4.5 20.5a7.5 7.5 0 0115 0",
  heart: "M12 20s-7-4.4-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.6 12 20 12 20z",
  list: "M4 6.5h16M4 12h16M4 17.5h9",
  grid: "M4 4.5h6.5V11H4zM13.5 4.5H20V11h-6.5zM4 13h6.5v6.5H4zM13.5 13H20v6.5h-6.5z",
} as const;

export type NavIconName = keyof typeof paths;

export function NavIcon({ name }: { readonly name: NavIconName }) {
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
      <path d={paths[name]} />
    </svg>
  );
}
