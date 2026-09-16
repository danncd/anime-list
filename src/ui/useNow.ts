import { useEffect, useState } from "react";

/*
The current time, re-read on an interval. A label derived from an absolute timestamp
such as AniList's `airingAt` is otherwise frozen at render, and refetching the
schedule to move it would cost 60 requests a minute against a 30/min ceiling.
*/
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
