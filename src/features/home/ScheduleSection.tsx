import { useMemo } from "react";
import { useEntryValue } from "../../ui/entryState";
import type { AiringEntry } from "../../contracts/anime";
import { fetchSchedule } from "../../platform/anilist";
import { describeError } from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { ShowMore } from "../../ui/ShowMore";
import { useNow } from "../../ui/useNow";
import { usePagedConnection } from "../../ui/usePagedConnection";

/* Two days back covers yesterday, four ahead covers the week. */
const DAYS_BEFORE = 2;
const DAYS_AFTER = 4;

export interface ScheduleSectionProps {
  readonly onOpenAnime: (animeId: number) => void;
}

interface Day {
  readonly key: string;
  readonly start: number;
  readonly end: number;
  readonly isToday: boolean;
  readonly weekday: string;
  readonly dayNumber: number;
  readonly month: string;
}

function localKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function buildDays(now: Date): readonly Day[] {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const todayKey = localKey(base);

  const days: Day[] = [];
  for (let offset = -DAYS_BEFORE; offset <= DAYS_AFTER; offset += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + offset);
    /* Next midnight rather than start + 86400: a clock change would otherwise
       push the window off the day itself. */
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    days.push({
      key: localKey(day),
      start: Math.floor(day.getTime() / 1000),
      end: Math.floor(next.getTime() / 1000),
      isToday: localKey(day) === todayKey,
      weekday: day.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: day.getDate(),
      month: day.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  return days;
}

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ScheduleSection({ onOpenAnime }: ScheduleSectionProps) {
  /* Ticks so the strip rolls over at midnight and rows grey as they air. */
  const now = useNow(60_000);
  const todayKey = useMemo(() => localKey(new Date(now)), [now]);
  /* Keyed on the tick's instant rather than a value derived from it. */
  const days = useMemo(() => buildDays(new Date(now)), [now]);
  /* Per history entry: the selected day survives leaving and returning. */
  const [selectedKey, setSelectedKey] = useEntryValue("scheduleDay", todayKey);

  const selected = days.find((day) => day.key === selectedKey) ?? days[DAYS_BEFORE];
  const dayKey = selected?.key ?? "";
  const start = selected?.start ?? 0;
  const end = selected?.end ?? 0;

  const schedule = usePagedConnection<AiringEntry>(dayKey, null, (page) =>
    fetchSchedule(start, end, page),
  );

  /*
  Rows are labelled by the day they belong to, not the day requested, so a stale
  list is never given the new day's name. The previous list stays up until the new
  one arrives; a loading line collapsed the section and rebuilt every cover.
  */
  const showing = schedule.items;
  const shownKey = schedule.stale ? schedule.itemsKey : dayKey;
  const labelled = days.find((day) => day.key === shownKey);
  const when = labelled ? `${labelled.weekday} ${labelled.dayNumber} ${labelled.month}` : null;
  const nowSeconds = Math.floor(now / 1000);

  return (
    <section className="home-section schedule">
      <div className="home-section-head">
        <h2 className="home-section-title">Airing schedule</h2>
      </div>

      <div className="schedule-days">
        {days.map((day) => (
          <button
            type="button"
            key={day.key}
            className={`schedule-day${day.isToday ? " is-today" : ""}${
              day.key === dayKey ? " is-on" : ""
            }`}
            onClick={() => setSelectedKey(day.key)}
          >
            <span className="schedule-weekday">{day.isToday ? "Today" : day.weekday}</span>
            <span className="schedule-daynumber">{day.dayNumber}</span>
          </button>
        ))}
      </div>

      {schedule.status === "error" && showing.length === 0 ? (
        <Note>{describeError(schedule.error)}</Note>
      ) : showing.length === 0 ? (
        <p className="schedule-count">Loading…</p>
      ) : (
        <>
          <p className="schedule-count">
            {showing.length}
            {schedule.hasMore ? "+" : ""} {showing.length === 1 ? "episode" : "episodes"}
            {when ? ` on ${when}` : ""}
          </p>

          <div className={`schedule-list${schedule.stale ? " is-stale" : ""}`}>
            {showing.map((entry) => (
              /* Compared against the ticking clock, so rows grey out as they air. */
              <button
                type="button"
                className={`schedule-row${entry.airsAt <= nowSeconds ? " is-aired" : ""}`}
                key={entry.id}
                onClick={() => onOpenAnime(entry.animeId)}
              >
                <span className="schedule-time">{formatTime(entry.airsAt)}</span>
                <span className="schedule-art">
                  <img src={entry.cover} alt="" loading="lazy" draggable={false} />
                </span>
                <span className="schedule-body">
                  <span className="schedule-name">{entry.title}</span>
                  <span className="schedule-meta">
                    Episode {entry.episode}
                    {entry.formatLabel ? ` · ${entry.formatLabel}` : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <ShowMore
            hasMore={schedule.hasMore}
            loading={schedule.loading}
            count={showing.length}
            noun="episode"
            plural="episodes"
            onLoadMore={schedule.loadMore}
          />
        </>
      )}
    </section>
  );
}
