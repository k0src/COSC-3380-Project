import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { EntityItemCard, LibraryArtist } from "@components";
import { libraryApi } from "@api";
import { formatDateString, getMainArtist } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./LibraryRecent.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuPin } from "react-icons/lu";

const RecentSection = memo(
  ({
    title,
    items,
    renderItem,
  }: {
    title: string;
    items: any[];
    renderItem: (item: any) => React.ReactNode;
  }) => {
    if (!items?.length) return null;

    return (
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.itemsGrid}>{items.map(renderItem)}</div>
      </div>
    );
  }
);

const LibraryRecent: React.FC<{
  userId: UUID;
  maxItems: number;
  searchFilter?: string;
}> = ({ userId, maxItems, searchFilter = "" }) => {
  const { data, loading, error } = useAsyncData(
    {
      recentlyPlayed: () => libraryApi.getRecentlyPlayed(userId, maxItems),
    },
    [userId, maxItems],
    {
      cacheKey: `library_recently_played_${userId}_${maxItems}`,
      hasBlobUrl: true,
    }
  );

  const recentlyPlayed = data?.recentlyPlayed ?? {};

  const filteredRecentlyPlayed = useMemo(() => {
    if (!searchFilter.trim()) {
      return recentlyPlayed;
    }

    const lowerFilter = searchFilter.toLowerCase();

    return {
      playlists:
        recentlyPlayed.playlists?.filter((playlist) =>
          playlist.title.toLowerCase().includes(lowerFilter)
        ) || [],
      songs:
        recentlyPlayed.songs?.filter((song) =>
          song.title.toLowerCase().includes(lowerFilter)
        ) || [],
      albums:
        recentlyPlayed.albums?.filter((album) =>
          album.title.toLowerCase().includes(lowerFilter)
        ) || [],
      artists:
        recentlyPlayed.artists?.filter((artist) =>
          artist.display_name.toLowerCase().includes(lowerFilter)
        ) || [],
    };
  }, [recentlyPlayed, searchFilter]);

  const noRecent = useMemo(
    () => Object.keys(recentlyPlayed).length === 0,
    [recentlyPlayed]
  );

  const noFilteredResults = useMemo(() => {
    return (
      !filteredRecentlyPlayed.playlists?.length &&
      !filteredRecentlyPlayed.songs?.length &&
      !filteredRecentlyPlayed.albums?.length &&
      !filteredRecentlyPlayed.artists?.length
    );
  }, [filteredRecentlyPlayed]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>Error loading recently played items.</div>
    );
  }

  return (
    <>
      {noRecent ? (
        <span className={styles.noRecent}>No recently played items.</span>
      ) : noFilteredResults ? (
        <span className={styles.noRecent}>
          No recently played items match your search.
        </span>
      ) : (
        <div className={styles.recentContainer}>
          {filteredRecentlyPlayed.playlists &&
            filteredRecentlyPlayed.playlists.length > 0 && (
              <RecentSection
                title="Recent Playlists"
                items={filteredRecentlyPlayed.playlists}
                renderItem={(playlist) => (
                  <div className={styles.playlistContainer}>
                    {playlist.is_pinned && (
                      <div className={styles.pinnedIconContainer}>
                        <LuPin className={styles.pinnedIcon} />
                      </div>
                    )}
                    <EntityItemCard
                      key={playlist.id}
                      entity={playlist}
                      type="playlist"
                      linkTo={`/playlists/${playlist.id}`}
                      author={playlist.user?.username || "Unknown"}
                      authorLinkTo={
                        playlist.user?.id
                          ? `/users/${playlist.user.id}`
                          : undefined
                      }
                      title={playlist.title}
                      subtitle={`${playlist.song_count} songs`}
                      imageUrl={playlist.image_url || musicPlaceholder}
                    />
                  </div>
                )}
              />
            )}

          {filteredRecentlyPlayed.songs &&
            filteredRecentlyPlayed.songs.length > 0 && (
              <RecentSection
                title="Recent Songs"
                items={filteredRecentlyPlayed.songs}
                renderItem={(song) => {
                  const mainArtist = getMainArtist(song.artists || []);

                  return (
                    <EntityItemCard
                      key={song.id}
                      entity={song}
                      type="song"
                      linkTo={`/songs/${song.id}`}
                      author={mainArtist?.display_name || "Unknown Artist"}
                      authorLinkTo={
                        mainArtist?.id ? `/artists/${mainArtist.id}` : undefined
                      }
                      title={song.title}
                      subtitle={formatDateString(song.release_date)}
                      imageUrl={song.image_url || musicPlaceholder}
                      blurHash={song.image_url_blurhash}
                    />
                  );
                }}
              />
            )}

          {filteredRecentlyPlayed.albums &&
            filteredRecentlyPlayed.albums.length > 0 && (
              <RecentSection
                title="Recent Albums"
                items={filteredRecentlyPlayed.albums}
                renderItem={(album) => (
                  <EntityItemCard
                    key={album.id}
                    entity={album}
                    type="album"
                    linkTo={`/albums/${album.id}`}
                    author={album.artist?.display_name || "Unknown"}
                    authorLinkTo={
                      album.artist?.id
                        ? `/artists/${album.artist.id}`
                        : undefined
                    }
                    title={album.title}
                    subtitle={formatDateString(album.release_date)}
                    imageUrl={album.image_url || musicPlaceholder}
                    blurHash={album.image_url_blurhash}
                  />
                )}
              />
            )}

          {filteredRecentlyPlayed.artists &&
            filteredRecentlyPlayed.artists.length > 0 && (
              <RecentSection
                title="Recent Artists"
                items={filteredRecentlyPlayed.artists}
                renderItem={(artist) => (
                  <LibraryArtist
                    key={artist.id}
                    artistId={artist.id}
                    artistImageUrl={artist.user?.profile_picture_url}
                    artistBlurHash={artist.user?.pfp_blurhash}
                    artistName={artist.display_name}
                  />
                )}
              />
            )}
        </div>
      )}
    </>
  );
};

export default memo(LibraryRecent);
