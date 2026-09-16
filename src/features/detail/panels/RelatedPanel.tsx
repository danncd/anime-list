import type { RelatedEntry } from "../../../contracts/anime";
import { DetailEntry } from "../../shared/DetailEntry";

export interface RelatedPanelProps {
  readonly entries: readonly RelatedEntry[];
  readonly onOpenAnime: (animeId: number) => void;
}

function Row({
  entry,
  onOpenAnime,
}: {
  readonly entry: RelatedEntry;
  readonly onOpenAnime: (animeId: number) => void;
}) {
  const facts = [entry.formatLabel, entry.relationLabel].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <DetailEntry
      art={entry.cover}
      rank={null}
      title={entry.title}
      score={null}
      facts={facts}
      blurb={null}
      side={null}
      /* Both kinds open: the detail page reads whatever id it is given. */
      onOpen={() => onOpenAnime(entry.id)}
    />
  );
}

/* AniList returns anime and manga relations in one connection, so they are split
   into two groups. Relation labels are not known ahead, so each row prints its
   own. */
export function RelatedPanel({ entries, onOpenAnime }: RelatedPanelProps) {
  const anime = entries.filter((entry) => entry.kind === "anime");
  const manga = entries.filter((entry) => entry.kind === "manga");

  return (
    <>
      {anime.length > 0 && (
        <section className="detail-related-group">
          <h3 className="detail-related-heading">Related Anime</h3>
          <div className="detail-entries detail-entries-two-up">
            {anime.map((entry) => (
              <Row key={`anime-${entry.id}-${entry.relationLabel}`} entry={entry} onOpenAnime={onOpenAnime} />
            ))}
          </div>
        </section>
      )}

      {manga.length > 0 && (
        <section className="detail-related-group">
          <h3 className="detail-related-heading">Related Manga</h3>
          <div className="detail-entries detail-entries-two-up">
            {manga.map((entry) => (
              <Row key={`manga-${entry.id}-${entry.relationLabel}`} entry={entry} onOpenAnime={onOpenAnime} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
