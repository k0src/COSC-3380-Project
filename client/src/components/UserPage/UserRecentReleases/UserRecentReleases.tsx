import { memo, useCallback, useState, useMemo, useRef, useEffect } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID, Song, AccessContext } from "@types";
import { useAuth } from "@contexts";
import { EntityItemCard } from "@components";
import { artistApi } from "@api";
import { formatRelativeDate, getMainArtist } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./UserRecentReleases.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const CARD_WIDTH = 18;
const CARD_GAP = 2.4;
const SCROLL_TRANSITION_DURATION = 300;

const UserRecentReleases: React.FC<{
  artistId: UUID;
  maxItems: number;
  itemsPerView?: number;
}> = ({ artistId, maxItems, itemsPerView = 6 }) => {
  const { user } = useAuth();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  const { data, loading, error } = useAsyncData(
    {
      recentSongs: () =>
        artistApi.getSongs(artistId, accessContext, {
          orderByColumn: "release_date",
          orderByDirection: "DESC",
          limit: maxItems,
        }),
    },
    [artistId, maxItems],
    {
      cacheKey: `user_recent_releases_${artistId}_${maxItems}`,
      hasBlobUrl: true,
    }
  );

  const recentSongs = data?.recentSongs ?? [];

  const scrollState = useMemo(() => {
    const totalItems = recentSongs.length;
    const maxScrollPosition = Math.max(0, totalItems - itemsPerView);
    const needsScrolling = totalItems > itemsPerView;
    const canScrollNext = scrollPosition < maxScrollPosition;
    const canScrollPrevious = scrollPosition > 0;

    return {
      totalItems,
      maxScrollPosition,
      needsScrolling,
      canScrollNext,
      canScrollPrevious,
    };
  }, [recentSongs.length, itemsPerView, scrollPosition]);

  const transformStyle = useMemo(
    () => ({
      transform: `translateX(-${scrollPosition * (CARD_WIDTH + CARD_GAP)}rem)`,
    }),
    [scrollPosition]
  );

  const handleScrollNext = useCallback(() => {
    setIsScrolling(true);
    setScrollPosition((prev) =>
      Math.min(prev + itemsPerView, scrollState.maxScrollPosition)
    );
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setIsScrolling(false),
      SCROLL_TRANSITION_DURATION
    );
  }, [scrollState.maxScrollPosition, itemsPerView]);

  const handleScrollPrevious = useCallback(() => {
    setIsScrolling(true);
    setScrollPosition((prev) => Math.max(prev - itemsPerView, 0));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setIsScrolling(false),
      SCROLL_TRANSITION_DURATION
    );
  }, [itemsPerView]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setScrollPosition(0);
  }, [artistId, maxItems]);

  const songAuthor = useCallback(
    (song: Song) => getMainArtist(song.artists ?? [])?.display_name || "",
    []
  );

  const songAuthorLink = useCallback((song: Song) => {
    const mainArtist = getMainArtist(song.artists ?? []);
    return mainArtist ? `/artists/${mainArtist.id}` : undefined;
  }, []);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading recent activity.</div>;
  }

  if (!recentSongs || recentSongs.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <span className={styles.sectionTitle}>Recent Tracks</span>

      {scrollState.needsScrolling ? (
        <div className={styles.withNavigation}>
          <button
            className={styles.navButton}
            onClick={handleScrollPrevious}
            disabled={!scrollState.canScrollPrevious}
          >
            <LuChevronLeft />
          </button>
          <div className={styles.scrollContainer}>
            <div className={styles.list} style={transformStyle}>
              {recentSongs.map((song) => (
                <EntityItemCard
                  key={song.id}
                  type="song"
                  linkTo={`/songs/${song.id}`}
                  author={songAuthor(song)}
                  authorLinkTo={songAuthorLink(song)}
                  title={song.title}
                  subtitle={
                    song.release_date
                      ? formatRelativeDate(song.release_date)
                      : ""
                  }
                  imageUrl={song.image_url || musicPlaceholder}
                  blurHash={song.image_url_blurhash}
                  entity={song}
                />
              ))}
            </div>
            <div
              className={styles.scrollGradient}
              style={{ opacity: isScrolling ? 1 : 0 }}
            />
          </div>
          <button
            className={styles.navButton}
            onClick={handleScrollNext}
            disabled={!scrollState.canScrollNext}
          >
            <LuChevronRight />
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {recentSongs.map((song) => (
            <EntityItemCard
              key={song.id}
              type="song"
              linkTo={`/songs/${song.id}`}
              author={songAuthor(song)}
              authorLinkTo={songAuthorLink(song)}
              title={song.title}
              subtitle={
                song.release_date ? formatRelativeDate(song.release_date) : ""
              }
              imageUrl={song.image_url || musicPlaceholder}
              blurHash={song.image_url_blurhash}
              entity={song}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(UserRecentReleases);
