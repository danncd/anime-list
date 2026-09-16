import type { AnimeDetail, LibraryBucket, ScoreBucket } from "../../../contracts/anime";
import { DetailEntry } from "../../shared/DetailEntry";
import { formatCount } from "../format";

/* A grey ramp, not semantic colours; the app palette is monochrome. */
const RAMP: readonly string[] = [
  "var(--ramp-1)",
  "var(--ramp-2)",
  "var(--ramp-3)",
  "var(--ramp-4)",
  "var(--ramp-5)",
];

function rampColour(index: number): string {
  return RAMP[index % RAMP.length] ?? "#c9ccd2";
}

function ScoreHistogram({ buckets }: { readonly buckets: readonly ScoreBucket[] }) {
  const peak = buckets.reduce((max, bucket) => Math.max(max, bucket.amount), 0);

  return (
    <div className="detail-hist">
      {buckets.map((bucket) => (
        <div
          className={`detail-hist-col${bucket.amount === peak ? " is-peak" : ""}`}
          key={bucket.score}
        >
          <span className="detail-hist-count">{formatCount(bucket.amount)}</span>
          <span className="detail-hist-area">
            <i style={{ height: `${peak === 0 ? 0 : Math.max(2, (bucket.amount / peak) * 100)}%` }} />
          </span>
          <span className="detail-hist-tick">{bucket.score}</span>
        </div>
      ))}
    </div>
  );
}

function LibrarySplit({ buckets }: { readonly buckets: readonly LibraryBucket[] }) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);

  return (
    <>
      <div className="detail-split" aria-hidden="true">
        {buckets.map((bucket, index) => (
          <i
            key={bucket.label}
            style={{
              width: `${total === 0 ? 0 : (bucket.amount / total) * 100}%`,
              background: rampColour(index),
            }}
          />
        ))}
      </div>
      <div className="detail-legend">
        {buckets.map((bucket, index) => (
          <span key={bucket.label}>
            <i style={{ background: rampColour(index) }} aria-hidden="true" />
            {bucket.label} <b>{formatCount(bucket.amount)}</b>
          </span>
        ))}
      </div>
    </>
  );
}

export interface StatsPanelProps {
  readonly detail: AnimeDetail;
}

export function StatsPanel({ detail }: StatsPanelProps) {
  const readout = [
    detail.score === null ? null : { label: "★ " + detail.score + "%", note: "average" },
    detail.meanScore === null ? null : { label: detail.meanScore + "%", note: "mean" },
    { label: formatCount(detail.popularity), note: "members" },
    { label: formatCount(detail.favourites), note: "favourites" },
  ].filter((item): item is { label: string; note: string } => item !== null);

  return (
    <>
      <div className="detail-readout">
        {readout.map((item) => (
          <span className="detail-pill detail-pill-readout" key={item.note}>
            {item.label}
            <small>{item.note}</small>
          </span>
        ))}
      </div>

      {detail.scores.length > 0 && (
        <section className="detail-block detail-block-tight">
          <h2 className="detail-block-title">Score distribution</h2>
          <ScoreHistogram buckets={detail.scores} />
        </section>
      )}

      {detail.libraries.length > 0 && (
        <section className="detail-block">
          <h2 className="detail-block-title">Where people are with it</h2>
          <LibrarySplit buckets={detail.libraries} />
        </section>
      )}

      {detail.ranks.length > 0 && (
        <section className="detail-block">
          <h2 className="detail-block-title">Rankings</h2>
          <div className="detail-entries">
            {detail.ranks.map((rank) => (
              <DetailEntry
                key={`${rank.basis}-${rank.rank}-${rank.label}`}
                art={null}
                rank={rank.rank}
                title={rank.label}
                score={null}
                facts={rank.formatLabel ? [rank.basis, rank.formatLabel] : [rank.basis]}
                blurb={null}
                side={null}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
