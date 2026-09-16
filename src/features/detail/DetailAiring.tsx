import type { AiringCountdown } from "../../contracts/anime";
import { useNow } from "../../ui/useNow";
import { airingProgress, formatCountdown, formatLongDate } from "./format";

export interface DetailAiringProps {
  readonly airing: AiringCountdown;
}

/* Rendered only when AniList knows the next episode time, which is not true of
   every airing title. */
export function DetailAiring({ airing }: DetailAiringProps) {
  const now = useNow(30_000);
  const { fraction, remainingMs } = airingProgress(airing, now);

  return (
    <div className="detail-airing">
      <span className="detail-dot airing" aria-hidden="true" />
      <b>Episode {airing.episode}</b>
      <span className="detail-airing-when">{formatLongDate(airing.airsAt)}</span>
      <span className="detail-airing-track">
        <i style={{ width: `${(fraction * 100).toFixed(1)}%` }} />
      </span>
      <span className="detail-airing-left">{formatCountdown(remainingMs)}</span>
    </div>
  );
}
