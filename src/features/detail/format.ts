import type { AiringCountdown } from "../../contracts/anime";

/* AniList airs weekly; the fallback when the previous episode is unknown. */
const ASSUMED_INTERVAL_SECONDS = 7 * 24 * 60 * 60;

export function formatCount(value: number): string {
  return value.toLocaleString();
}

export function formatLongDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatCountdown(milliseconds: number): string {
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  return `in ${minutes}m`;
}

export interface AiringProgress {
  /* Progress through the wait, clamped to 0..1. */
  readonly fraction: number;
  readonly remainingMs: number;
}

/* Measured from the previous episode, so the bar reflects the real gap between
   releases. */
export function airingProgress(airing: AiringCountdown, nowMs: number): AiringProgress {
  const previous = airing.previousAt ?? airing.airsAt - ASSUMED_INTERVAL_SECONDS;
  const interval = Math.max(1, airing.airsAt - previous);
  const elapsed = nowMs / 1000 - previous;
  return {
    fraction: Math.min(1, Math.max(0, elapsed / interval)),
    remainingMs: Math.max(0, airing.airsAt * 1000 - nowMs),
  };
}
