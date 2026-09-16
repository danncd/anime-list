export interface ShowMoreProps {
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly count: number;
  /* Singular and plural nouns for the count line, e.g. "person" / "people". */
  readonly noun: string;
  readonly plural: string;
  readonly onLoadMore: () => void;
}

/*
AniList reports a capped total rather than a real one, so this states what is
loaded and offers the next page instead of promising a number.
*/
export function ShowMore({ hasMore, loading, count, noun, plural, onLoadMore }: ShowMoreProps) {
  const label = count === 1 ? noun : plural;

  if (!hasMore) {
    return (
      <p className="detail-count">
        All {count.toLocaleString()} {label}
      </p>
    );
  }

  return (
    <div className="detail-more">
      <span className="detail-count">
        Showing {count.toLocaleString()}+ {label}
      </span>
      <button
        type="button"
        className="detail-more-button"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? "Loading…" : "Show more"}
      </button>
    </div>
  );
}
