/*
Season state markers shared by the picker and the page title: a star for a quarter
that has not started, and the poster cards' green dot for one airing now.
*/
export function UpcomingStar() {
  return (
    <span className="browse-star" title="Not aired yet">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" />
      </svg>
    </span>
  );
}

export function CurrentDot() {
  return <span className="browse-dot" title="Airing now" />;
}
