import type { AnimeDetail } from "../../../contracts/anime";

export interface InformationPanelProps {
  readonly detail: AnimeDetail;
}

export function InformationPanel({ detail }: InformationPanelProps) {
  return (
    <>
      <dl className="detail-specs">
        {detail.facts.map((fact) => (
          <div className="detail-spec" key={fact.label}>
            <dt className="detail-spec-key">{fact.label}</dt>
            <dd className="detail-spec-value">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {detail.tags.length > 0 && (
        <section className="detail-block">
          <h2 className="detail-block-title">Tags</h2>
          <div className="detail-tags">
            {detail.tags.map((tag) => (
              <span className="detail-tag" key={tag.name}>
                {tag.name}
                {tag.spoiler && (
                  <span className="detail-tag-flag" title="Spoiler">
                    ⚠
                  </span>
                )}
                <em>{tag.rank}</em>
              </span>
            ))}
          </div>
        </section>
      )}

      {detail.links.length > 0 && (
        <section className="detail-block">
          <h2 className="detail-block-title">Links</h2>
          <div className="detail-links">
            {detail.links.map((link) => (
              <a
                className="detail-link"
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
              >
                {link.site}
              </a>
            ))}
          </div>
        </section>
      )}

      {detail.trailer && (
        <section className="detail-block">
          <h2 className="detail-block-title">Trailer</h2>
          <a
            className="detail-trailer"
            href={detail.trailer.url}
            target="_blank"
            rel="noreferrer"
          >
            <img src={detail.trailer.thumbnail} alt="" loading="lazy" />
            <span className="detail-trailer-play" aria-hidden="true">
              <span>▶</span>
            </span>
            <span className="visually-hidden">Watch the trailer</span>
          </a>
        </section>
      )}
    </>
  );
}
