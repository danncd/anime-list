import { useEffect } from "react";
import { EMPTY_FILTERS } from "../../contracts/filters";
import {
  currentSeason,
  fetchCurrentSeasonAnime,
  fetchExplorePage,
  fetchPopularAnime,
  fetchTrendingAnime,
  describeError,
} from "../../platform/anilist";
import { Note } from "../../ui/Note";
import { HeroCarousel } from "./HeroCarousel";
import { HomeSection } from "./HomeSection";
import { MangaShelf } from "./MangaShelf";
import { PosterShelf } from "./PosterShelf";
import { ScheduleSection } from "./ScheduleSection";
import { useAnimeList } from "./useAnimeList";

/* The hero rotates the top ten only; the full list stays on the Popular view. */
const HERO_COUNT = 10;

export interface HomePageProps {
  readonly onNavigate: (itemId: string) => void;
  readonly onOpenAnime: (animeId: number) => void;
}

export function HomePage({ onNavigate, onOpenAnime }: HomePageProps) {
  const trending = useAnimeList(fetchTrendingAnime);
  const popular = useAnimeList(fetchPopularAnime);
  const season = useAnimeList(fetchCurrentSeasonAnime);

  /*
  Warms the two views a reader is most likely to open next, once this page is idle.
  Idle keeps the requests from competing with what is on screen. Skipped when the
  connection asks to save data.
  */
  useEffect(() => {
    const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData === true) return;

    const idle = window.requestIdleCallback;
    if (typeof idle !== "function") return;

    const handle = idle(() => {
      void fetchExplorePage(1, EMPTY_FILTERS).catch(() => undefined);
    });
    return () => window.cancelIdleCallback?.(handle);
  }, []);
  const seasonLabel = currentSeason().label;

  return (
    <div className="home">
      {trending.status === "ready" ? (
        <HeroCarousel items={trending.items.slice(0, HERO_COUNT)} onOpen={onOpenAnime} />
      ) : trending.status === "error" ? (
        <Note>{describeError(trending.error)}</Note>
      ) : (
        <div className="hero hero-loading" aria-hidden="true" />
      )}

      <HomeSection title={seasonLabel} onSeeMore={() => onNavigate("seasonal-anime")}>
        <PosterShelf state={season} onOpen={onOpenAnime} />
      </HomeSection>

      <HomeSection title="Popular Anime" onSeeMore={() => onNavigate("explore")}>
        <PosterShelf state={popular} onOpen={onOpenAnime} />
      </HomeSection>

      {/* The schedule closes the page. */}
      <MangaShelf onSeeMore={() => onNavigate("explore")} onOpenAnime={onOpenAnime} />

      <ScheduleSection onOpenAnime={onOpenAnime} />
    </div>
  );
}
