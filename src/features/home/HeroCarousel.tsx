import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { AnimePoster } from "../../contracts/anime";
import { Chevron, InfoGlyph, PlusGlyph } from "../../ui/icons";
import { useListActions } from "../shared/ListActionsContext";

/* Drives the advance timer and the current dot's fill, exposed as --hero-interval. */
const ADVANCE_MS = 7000;

export interface HeroCarouselProps {
  readonly items: readonly AnimePoster[];
  readonly onOpen: (animeId: number) => void;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function HeroCarousel({ items, onOpen }: HeroCarouselProps) {
  /* Present only where list actions are in scope. */
  const listActions = useListActions();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  /* Start of the current run, paired with remainingRef to keep the fill and the
     advance timer on one clock. */
  const startedAtRef = useRef(0);
  const remainingRef = useRef(ADVANCE_MS);

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    remainingRef.current = ADVANCE_MS;
  }, [index]);

  useEffect(() => {
    if (count < 2) return;
    if (paused) {
      remainingRef.current = Math.max(
        120,
        remainingRef.current - (performance.now() - startedAtRef.current),
      );
      return;
    }

    startedAtRef.current = performance.now();
    const timer = window.setTimeout(() => {
      remainingRef.current = ADVANCE_MS;
      setIndex((current) => (current + 1) % count);
    }, remainingRef.current);
    return () => window.clearTimeout(timer);
  }, [paused, count, index]);

  const item = items[index];
  if (!item) return null;

  return (
    <section
      className={`hero${paused ? " is-paused" : ""}`}
      style={{ "--hero-interval": `${ADVANCE_MS}ms` } as CSSProperties}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Trending anime"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1);
        }
      }}
    >
      <div className="hero-stage">
        {items.map((entry, position) => (
          <img
            key={entry.id}
            className={`hero-frame${position === index ? " is-on" : ""}`}
            src={entry.banner ?? entry.cover}
            alt=""
            aria-hidden={position !== index}
          />
        ))}
        <div className="hero-scrim" aria-hidden="true" />

        <div className="hero-body">
          <span className="hero-kicker">
            <span className={`hero-release ${item.release}`} aria-hidden="true" />
            Trending #{index + 1}
          </span>
          <h2 className="hero-title">{item.title}</h2>
          <div className="hero-pills">
            {item.formatLabel && <span className="hero-pill">{item.formatLabel}</span>}
            {item.seasonYear !== null && <span className="hero-pill">{item.seasonYear}</span>}
            {item.count !== null && (
              <span className="hero-pill">
                {item.count} {item.unit}
              </span>
            )}
            {item.score !== null && (
              <span className="hero-pill hero-score">★ {item.score}</span>
            )}
          </div>
        </div>

        <div className="hero-controls">
          <div className="hero-arrows">
            <button
              type="button"
              className="hero-arrow"
              aria-label="Previous"
              onClick={() => go(index - 1)}
            >
              <Chevron dir="left" weight={1.7} />
            </button>
            <button
              type="button"
              className="hero-arrow"
              aria-label="Next"
              onClick={() => go(index + 1)}
            >
              <Chevron dir="right" weight={1.7} />
            </button>
          </div>

          <div className="hero-nav-dots" role="tablist" aria-label="Choose a title">
            {items.map((entry, position) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={position === index}
                aria-label={entry.title}
                className={position === index ? "is-on" : ""}
                onClick={() => go(position)}
              />
            ))}
          </div>

          <span className="hero-count">
            {pad(index + 1)}
            <em>/</em>
            {pad(count)}
          </span>

          <div className="hero-actions">
            {listActions && (
              <button
                type="button"
                onClick={() =>
                  listActions.addToList({ id: item.id, kind: item.kind, label: item.title })
                }
              >
                <PlusGlyph />
                Add to list
              </button>
            )}
            <button type="button" onClick={() => item && onOpen(item.id)}>
              <InfoGlyph />
              Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
