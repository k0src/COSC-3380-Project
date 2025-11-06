import { memo, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import { playlistApi } from "@api";
import { ErrorPage, PageLoader } from "@components";
import styles from "./PlaylistPage.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";

const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  if (!id) {
    return (
      <ErrorPage
        title="Playlist Not Found"
        message="The requested playlist does not exist."
      />
    );
  }

  const { data, loading, error } = useAsyncData(
    {
      playlist: () =>
        playlistApi.getPlaylistById(id, {
          includeUser: true,
          includeSongCount: true,
          includeLikes: true,
        }),
      songs: () =>
        playlistApi.getSongs(id, {
          includeAlbums: true,
          includeArtists: true,
          //! paginate me
        }),
    },
    [id],
    {
      cacheKey: `playlist_${id}`,
      hasBlobUrl: true,
    }
  );

  const playlist = data?.playlist;
  const songs = data?.songs || [];

  if (error) {
    return (
      <ErrorPage
        title="Internal Server Error"
        message="An unexpected error occurred. Please try again later."
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {playlist ? `${playlist.title} - CoogMusic` : "CoogMusic"}
        </title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : !playlist ? (
        <ErrorPage
          title="Playlist Not Found"
          message="The requested playlist does not exist."
        />
      ) : (
        <div className={styles.playlistLayout}>
          <div className={styles.playlistLayoutTop}>
            <div className={styles.playlistContainer}>
              <img
                src={playlist.image_url || musicPlaceholder}
                alt={`${playlist.title} Cover`}
                className={styles.coverImage}
                loading="lazy"
              />
            </div>
            <div className={styles.playlistLayoutTopRight}>
              {/* info and actions */}
            </div>
          </div>
          <div className={styles.playlistLayoutBottom}>
            {/* song list */}
            <div className={styles.playlistLayoutBottomRight}>
              {/* other playlists by user, related playlists */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(PlaylistPage);
