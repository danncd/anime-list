/* How long ago a list changed: minutes under an hour, hours and minutes under a
   day, then the date. Seconds are never shown. */
export function formatUpdated(millis: number): string {
  const now = Date.now();
  const minutes = Math.max(0, Math.floor((now - millis) / 60_000));

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  }

  return new Date(millis).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
