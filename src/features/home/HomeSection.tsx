import type { ReactNode } from "react";

export interface HomeSectionProps {
  readonly title: string;
  /* Absent when the section has nowhere to go. */
  readonly onSeeMore?: (() => void) | undefined;
  /* Rendered at the far side of the head. */
  readonly control?: ReactNode;
  readonly children: ReactNode;
}

export function HomeSection({ title, onSeeMore, control, children }: HomeSectionProps) {
  return (
    <section className="home-section">
      <div className="home-section-head">
        <h2 className="home-section-title">{title}</h2>
        {onSeeMore && (
          <>
            <span className="home-section-sep" aria-hidden="true">
              •
            </span>
            <button type="button" className="home-section-more" onClick={onSeeMore}>
              See More
            </button>
          </>
        )}
        {control}
      </div>
      {children}
    </section>
  );
}
