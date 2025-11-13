import { memo, useCallback, useState, useMemo, useRef, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { Song, Album, Playlist, UUID } from "@types";
import { useAsyncData } from "@hooks";
import { EntityItemCard } from "@components";
import { formatDateString, getMainArtist } from "@util";
import styles from "./SlidingCardList.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

type CardEntityType = "song" | "album" | "playlist";

const CARD_WIDTH = 18;
const CARD_GAP = 2.4;
const SCROLL_TRANSITION_DURATION = 300;

export interface SlidingCardListProps {
  title: string;
  artistName?: string;
  artistId?: UUID;
  fetchData: () => Promise<Song[] | Album[] | Playlist[]>;
  type: CardEntityType;
  itemsPerView?: number;
  cacheKey: string;
  dependencies?: any[];
}

const SlidingCardList: React.FC<SlidingCardListProps> = ({
  title,
  artistName,
  artistId,
  fetchData,
  type,
  itemsPerView = 6,
  cacheKey,
  dependencies = [],
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const asyncConfig = useMemo(
    () => ({
      items: fetchData,
    }),
    [fetchData]
  );

  const { data, loading, error } = useAsyncData(asyncConfig, dependencies, {
    cacheKey,
    hasBlobUrl: true,
  });

  const items = data?.items || [];
  const scrollState = useMemo(() => {
    const totalItems = items.length;
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
  }, [items.length, itemsPerView, scrollPosition]);

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
  }, [cacheKey]);

  const songAuthor = useCallback(
    (song: Song) =>
      getMainArtist(song.artists ?? [])?.display_name || artistName || "",
    [artistName]
  );

  const songAuthorLink = useCallback((song: Song) => {
    const mainArtist = getMainArtist(song.artists ?? []);
    return mainArtist ? `/artists/${mainArtist.id}` : undefined;
  }, []);

  const albumAuthor = useCallback(
    (album: Album) => album.artist?.display_name || artistName || "",
    [artistName]
  );

  const albumAuthorLink = useMemo(
    () => `${artistId ? `/artists/${artistId}` : undefined}`,
    [artistId]
  );

  const playlistAuthor = useCallback(
    (playlist: Playlist) => playlist.user?.username || "Unknown",
    []
  );

  const playlistAuthorLink = useCallback(
    (playlist: Playlist) =>
      playlist.user ? `/users/${playlist.user.id}` : undefined,
    []
  );

  const getEntityProps = useCallback(
    (item: Song | Album | Playlist) => {
      switch (type) {
        case "song": {
          const song = item as Song;
          return {
            type: "song" as const,
            linkTo: `/songs/${song.id}`,
            author: songAuthor(song),
            authorLinkTo: songAuthorLink(song),
            title: song.title,
            subtitle: formatDateString(song.release_date),
            imageUrl: song.image_url || musicPlaceholder,
            blurHash: song.image_url_blurhash,
            entity: song,
          };
        }
        case "album": {
          const album = item as Album;
          return {
            type: "album" as const,
            linkTo: `/albums/${album.id}`,
            author: albumAuthor(album),
            authorLinkTo: albumAuthorLink,
            title: album.title,
            subtitle: formatDateString(album.release_date),
            imageUrl: album.image_url || musicPlaceholder,
            blurHash: album.image_url_blurhash,
            entity: album,
          };
        }
        case "playlist": {
          const playlist = item as Playlist;
          return {
            type: "playlist" as const,
            linkTo: `/playlists/${playlist.id}`,
            author: playlistAuthor(playlist),
            authorLinkTo: playlistAuthorLink(playlist),
            title: playlist.title,
            subtitle: "",
            imageUrl: playlist.image_url || musicPlaceholder,
            entity: playlist,
          };
        }
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }
    },
    [
      type,
      songAuthor,
      songAuthorLink,
      albumAuthor,
      albumAuthorLink,
      playlistAuthor,
      playlistAuthorLink,
    ]
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>Failed to load {title.toLowerCase()}.</div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <span className={styles.sectionTitle}>{title}</span>
      {scrollState.needsScrolling ? (
        <div className={styles.withNavigation}>
          <button
            className={styles.navButton}
            onClick={handleScrollPrevious}
            disabled={!scrollState.canScrollPrevious}
            aria-label="Scroll to previous items"
          >
            <LuChevronLeft />
          </button>
          <div className={styles.scrollContainer}>
            <div className={styles.list} style={transformStyle}>
              {items.map((item) => {
                const props = getEntityProps(item);
                return <EntityItemCard key={item.id} {...props} />;
              })}
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
            aria-label="Scroll to next items"
          >
            <LuChevronRight />
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => {
            const props = getEntityProps(item);
            return <EntityItemCard key={item.id} {...props} />;
          })}
        </div>
      )}
    </div>
  );
};

export default memo(SlidingCardList);
