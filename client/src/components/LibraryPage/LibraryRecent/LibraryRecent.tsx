import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import { Link } from "react-router-dom";
import type { UUID } from "@types";
import { EntityItemCard, LibraryArtist } from "@components";
import { libraryApi } from "@api";
import { formatDateString, getMainArtist } from "@util";
import { useAsyncData } from "@hooks";
import styles from "./LibraryRecent.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";
import { LuPin } from "react-icons/lu";

const LibraryRecent: React.FC<{ userId: UUID; maxItems: number }> = ({
  userId,
  maxItems,
}) => {
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

  const recentlyPlayed = data?.recentlyPlayed || {};

  const noRecent = useMemo(
    () => Object.keys(recentlyPlayed).length === 0,
    [recentlyPlayed]
  );

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
      ) : (
        <div className={styles.recentContainer}>
          {recentlyPlayed.playlists && recentlyPlayed.playlists.length > 0 && (
            <div className={styles.sectionContainer}>
              <span className={styles.sectionTitle}>Recent Playlists</span>
              <div className={styles.itemsGrid}>
                {recentlyPlayed.playlists.map((playlist) => (
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
                      authorLinkTo={`/users/${playlist.user?.id}`}
                      title={playlist.title}
                      subtitle={`${playlist.song_count} songs`}
                      imageUrl={playlist.image_url || musicPlaceholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentlyPlayed.songs && recentlyPlayed.songs.length > 0 && (
            <div className={styles.sectionContainer}>
              <span className={styles.sectionTitle}>Recent Songs</span>
              <div className={styles.itemsGrid}>
                {recentlyPlayed.songs.map((song) => (
                  <EntityItemCard
                    key={song.id}
                    entity={song}
                    type="song"
                    linkTo={`/songs/${song.id}`}
                    author={
                      getMainArtist(song.artists || [])?.display_name ||
                      "Unknown"
                    }
                    authorLinkTo={`/artists/${
                      getMainArtist(song.artists || [])?.id
                    }`}
                    title={song.title}
                    subtitle={formatDateString(song.release_date)}
                    imageUrl={song.image_url || musicPlaceholder}
                    blurHash={song.image_url_blurhash}
                  />
                ))}
              </div>
            </div>
          )}

          {recentlyPlayed.albums && recentlyPlayed.albums.length > 0 && (
            <div className={styles.sectionContainer}>
              <span className={styles.sectionTitle}>Recent Albums</span>
              <div className={styles.itemsGrid}>
                {recentlyPlayed.albums.map((album) => (
                  <EntityItemCard
                    key={album.id}
                    entity={album}
                    type="album"
                    linkTo={`/albums/${album.id}`}
                    author={album.artist?.display_name || "Unknown"}
                    authorLinkTo={`/artists/${album.artist?.id}`}
                    title={album.title}
                    subtitle={formatDateString(album.release_date)}
                    imageUrl={album.image_url || musicPlaceholder}
                    blurHash={album.image_url_blurhash}
                  />
                ))}
              </div>
            </div>
          )}

          {recentlyPlayed.artists && recentlyPlayed.artists.length > 0 && (
            <div className={styles.sectionContainer}>
              <span className={styles.sectionTitle}>Recent Artists</span>
              <div className={styles.itemsGrid}>
                {recentlyPlayed.artists.map((artist) => (
                  <LibraryArtist
                    key={artist.id}
                    artistId={artist.id}
                    artistImageUrl={artist.user?.profile_picture_url}
                    artistBlurHash={artist.user?.pfp_blurhash}
                    artistName={artist.display_name}
                  />
                ))}
              </div>
            </div>
          )}

          <Link className={styles.historyLink} to="/library/history">
            View Full History
          </Link>
        </div>
      )}
    </>
  );
};

export default memo(LibraryRecent);
