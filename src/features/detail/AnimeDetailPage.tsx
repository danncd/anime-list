import type { AddToListTitle } from "../../contracts/lists";
import { describeError } from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { DetailAiring } from "./DetailAiring";
import { DetailBody } from "./DetailBody";
import { DetailHeader } from "./DetailHeader";
import { useAnimeDetail } from "./useAnimeDetail";

export interface AnimeDetailPageProps {
  readonly animeId: number;
  readonly onOpenAnime: (animeId: number) => void;
  readonly onAddToList: (title: AddToListTitle) => void;
}

export function AnimeDetailPage({
  animeId,
  onOpenAnime,
  onAddToList,
}: AnimeDetailPageProps) {
  const state = useAnimeDetail(animeId);

  if (state.status !== "ready") {
    return (
      <div className="detail-page">
        {state.status === "error" ? (
          <Note>{describeError(state.error)}</Note>
        ) : (
          <div className="detail-loading" aria-hidden="true">
            <span className="detail-loading-cover" />
            <span className="detail-loading-lines">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>
    );
  }

  const detail = state.detail;

  return (
    <div className="detail-page">
      <DetailHeader
        detail={detail}
        onAddToList={() => onAddToList({ id: detail.id, kind: detail.kind, label: detail.title })}
      />
      {detail.airing && <DetailAiring airing={detail.airing} />}
      <div className="detail-sep" />
      {/* Keyed by id so another title starts on the leading tab with fresh
          connection pages. */}
      <DetailBody key={detail.id} detail={detail} onOpenAnime={onOpenAnime} />
    </div>
  );
}
