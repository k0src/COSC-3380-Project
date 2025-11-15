import { memo, useCallback, useState, useMemo, useRef, useEffect } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type {
  Song,
  Album,
  Playlist,
  LibraryPlaylist,
  UUID,
  LibrarySong,
  LibraryAlbum,
  LibraryArtist,
} from "@types";
import { EntityItemCard } from "@components";
import { libraryApi } from "@api";
import { formatRelativeDate, getMainArtist } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./UserRecentActivity.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const CARD_WIDTH = 18;
const CARD_GAP = 2.4;
const SCROLL_TRANSITION_DURATION = 300;

const UserRecentActivity: React.FC<{
  userId: UUID;
  maxItems: number;
  itemsPerView?: number;
}> = ({ userId, maxItems, itemsPerView = 5 }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { data, loading, error } = useAsyncData(
    {
      recentActivity: () => libraryApi.getRecentlyPlayedArray(userId, maxItems),
    },
    [userId, maxItems],
    {
      cacheKey: `user_recent_activity_${userId}_${maxItems}`,
      hasBlobUrl: true,
    }
  );

  const recentActivity = data?.recentActivity ?? [];

  const scrollState = useMemo(() => {
    const totalItems = recentActivity.length;
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
  }, [recentActivity.length, itemsPerView, scrollPosition]);

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
  }, [userId, maxItems]);

  const songAuthor = useCallback(
    (song: LibrarySong) =>
      getMainArtist(song.artists ?? [])?.display_name || "",
    []
  );

  const songAuthorLink = useCallback((song: LibrarySong) => {
    const mainArtist = getMainArtist(song.artists ?? []);
    return mainArtist ? `/artists/${mainArtist.id}` : undefined;
  }, []);

  const albumAuthor = useCallback(
    (album: LibraryAlbum) => album.artist?.display_name || "",
    []
  );

  const albumAuthorLink = useCallback(
    (album: LibraryAlbum) =>
      album.artist ? `/artists/${album.artist.id}` : undefined,
    []
  );

  const playlistAuthor = useCallback(
    (playlist: LibraryPlaylist) => playlist.user?.username || "Unknown",
    []
  );

  const playlistAuthorLink = useCallback(
    (playlist: LibraryPlaylist) =>
      playlist.user ? `/users/${playlist.user.id}` : undefined,
    []
  );

  const getEntityProps = useCallback(
    (item: LibrarySong | LibraryAlbum | LibraryPlaylist | LibraryArtist) => {
      switch (item.type) {
        case "song": {
          const song = item as LibrarySong;
          return {
            type: "song" as const,
            linkTo: `/songs/${song.id}`,
            author: songAuthor(song),
            authorLinkTo: songAuthorLink(song),
            title: song.title,
            subtitle: song.played_at ? formatRelativeDate(song.played_at) : "",
            imageUrl: song.image_url || musicPlaceholder,
            blurHash: song.image_url_blurhash,
            entity: song as Song,
          };
        }
        case "album": {
          const album = item as LibraryAlbum;
          return {
            type: "album" as const,
            linkTo: `/albums/${album.id}`,
            author: albumAuthor(album),
            authorLinkTo: albumAuthorLink(album),
            title: album.title,
            subtitle: album.played_at
              ? formatRelativeDate(album.played_at)
              : "",
            imageUrl: album.image_url || musicPlaceholder,
            blurHash: album.image_url_blurhash,
            entity: album as Album,
          };
        }
        case "playlist": {
          const playlist = item as LibraryPlaylist;
          return {
            type: "playlist" as const,
            linkTo: `/playlists/${playlist.id}`,
            author: playlistAuthor(playlist),
            authorLinkTo: playlistAuthorLink(playlist),
            title: playlist.title,
            subtitle: playlist.played_at
              ? formatRelativeDate(playlist.played_at)
              : "",
            imageUrl: playlist.image_url || musicPlaceholder,
            entity: playlist as Playlist,
          };
        }
        case "artist": {
          return null;
        }
        default:
          throw new Error(`Unknown entity type`);
      }
    },
    [
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
        <PuffLoader color="var(--color-accent)" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading recent activity.</div>;
  }

  if (!recentActivity || recentActivity.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <span className={styles.sectionTitle}>Recent Activity</span>

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
              {recentActivity.map((item) => {
                const props = getEntityProps(item);
                return props ? (
                  <EntityItemCard key={item.id} {...props} />
                ) : null;
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
          >
            <LuChevronRight />
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {recentActivity.map((item) => {
            const props = getEntityProps(item);
            return props ? <EntityItemCard key={item.id} {...props} /> : null;
          })}
        </div>
      )}
    </div>
  );
};

export default memo(UserRecentActivity);
