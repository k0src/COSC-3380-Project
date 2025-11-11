import { memo, useMemo } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import { formatDateString, getMainArtist } from "@util";
import { userApi } from "@api";
import { EntityItemCard } from "@components";
import styles from "./UserInfoLiked.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

const UserInfoLiked: React.FC<{ userId: UUID }> = ({ userId }) => {
  const { data, loading, error } = useAsyncData(
    {
      likedSongs: () => userApi.getLikedSongs(userId, { includeArtists: true }),
      likedAlbums: () =>
        userApi.getLikedAlbums(userId, { includeArtist: true }),
      likedPlaylists: () =>
        userApi.getLikedPlaylists(userId, {
          includeUser: true,
          includeSongCount: true,
        }),
    },
    [userId],
    {
      cacheKey: `user_liked_${userId}`,
      hasBlobUrl: true,
    }
  );

  const likedSongs = data?.likedSongs || [];
  const likedAlbums = data?.likedAlbums || [];
  const likedPlaylists = data?.likedPlaylists || [];

  const noLiked = useMemo(
    () =>
      likedSongs.length === 0 &&
      likedAlbums.length === 0 &&
      likedPlaylists.length === 0,
    [likedSongs, likedAlbums, likedPlaylists]
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading liked items.</div>;
  }

  return (
    <div className={styles.likedContainer}>
      {likedSongs && likedSongs.length > 0 && (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Songs</span>
          <div className={styles.itemsGrid}>
            {likedSongs.map((song) => (
              <EntityItemCard
                key={song.id}
                entity={song}
                type="song"
                linkTo={`/songs/${song.id}`}
                author={
                  getMainArtist(song.artists || [])?.display_name ||
                  "Unknown Artist"
                }
                title={song.title}
                subtitle={formatDateString(song.release_date)}
                imageUrl={song.image_url || musicPlaceholder}
                blurHash={song.image_url_blurhash}
              />
            ))}
          </div>
        </div>
      )}
      {likedAlbums && likedAlbums.length > 0 && (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Albums</span>
          <div className={styles.itemsGrid}>
            {likedAlbums.map((album) => (
              <EntityItemCard
                key={album.id}
                entity={album}
                type="album"
                linkTo={`/albums/${album.id}`}
                author={album.artist?.display_name || "Unknown Artist"}
                title={album.title}
                subtitle={formatDateString(album.release_date)}
                imageUrl={album.image_url || musicPlaceholder}
                blurHash={album.image_url_blurhash}
              />
            ))}
          </div>
        </div>
      )}
      {likedPlaylists && likedPlaylists.length > 0 && (
        <div className={styles.sectionContainer}>
          <span className={styles.sectionTitle}>Playlists</span>
          <div className={styles.itemsGrid}>
            {likedPlaylists.map((playlist) => (
              <EntityItemCard
                key={playlist.id}
                entity={playlist}
                type="playlist"
                linkTo={`/playlists/${playlist.id}`}
                author={playlist.user?.username || "Unknown User"}
                title={playlist.title}
                subtitle={`${playlist.song_count} songs`}
                imageUrl={playlist.image_url || musicPlaceholder}
              />
            ))}
          </div>
        </div>
      )}
      {noLiked && (
        <div className={styles.noLiked}>
          This user has not liked any songs, albums, or playlists yet.
        </div>
      )}
    </div>
  );
};

export default memo(UserInfoLiked);
