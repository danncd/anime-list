export interface PosterSkeletonProps {
  readonly count: number;
  /* The row or grid the placeholders stand in for. */
  readonly className: string;
}

/*
A poster-shaped placeholder for a row or grid that has not loaded yet.
*/
export function PosterSkeleton({ count, className }: PosterSkeletonProps) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="poster skeleton" key={index}>
          <span className="poster-art" />
          <span className="poster-skeleton-line" />
          <span className="poster-skeleton-pill" />
        </div>
      ))}
    </div>
  );
}
