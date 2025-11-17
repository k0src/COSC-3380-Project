import { memo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import type { UUID } from "@types";
import { useAsyncData, useErrorCheck } from "@hooks";
import { albumApi } from "@api";
import {
  ErrorPage,
  PageLoader,
  AlbumContainer,
  SongsList,
  LikeProfiles,
  AlbumArtist,
  AlbumInfo,
  AlbumActions,
  RelatedAlbums,
} from "@components";
import styles from "./AlbumPage.module.css";

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  if (!id) {
    return (
      <ErrorPage
        title="Album Not Found"
        message="The requested album does not exist."
      />
    );
  }

  const { data, loading, error } = useAsyncData(
    {
      album: () =>
        albumApi.getAlbumById(id, {
          includeArtist: true,
          includeLikes: true,
          includeSongCount: true,
          includeRuntime: true,
          includeSongIds: true,
        }),
    },
    [id],
    {
      cacheKey: `album_${id}`,
      hasBlobUrl: true,
    }
  );

  const album = data?.album;

  const fetchSongs = useCallback(
    () => albumApi.getSongs(id, { includeArtists: true }),
    [id]
  );

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
    {
      condition: !album && !loading,
      title: "Album Not Found",
      message: "The requested album does not exist.",
    },
  ]);

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowError) {
    return <ErrorPage title={errorTitle} message={errorMessage} />;
  }

  return (
    <>
      <Helmet>
        <title>{album ? `${album.title} - CoogMusic` : "CoogMusic"}</title>
      </Helmet>

      <div className={styles.albumLayout}>
        <div className={styles.albumLayoutTop}>
          <AlbumContainer album={album} />
          <div className={styles.albumLayoutTopRight}>
            <AlbumArtist artist={album.artist} updatedAt={album.updated_at} />
            <AlbumInfo releaseDate={album.release_date} genre={album.genre} />
            <AlbumActions
              album={album}
              albumUrl={window.location.href}
              songIds={album.song_ids ?? []}
            />
          </div>
        </div>
        <div className={styles.albumLayoutBottom}>
          {(album.song_count ?? 0) > 0 ? (
            <SongsList
              fetchData={fetchSongs}
              cacheKey={`album_${id}_songs`}
              dependencies={[id]}
            />
          ) : (
            <div className={styles.noSongsMessage}>
              This album has no songs.
            </div>
          )}
          <div className={styles.suggestionsContainer}>
            <LikeProfiles
              title="Liked By"
              entityId={album.id}
              entityType="album"
              profileMin={4}
              profileLimit={6}
            />
            <RelatedAlbums
              mode="artist"
              artistId={album.artist?.id}
              artistName={album.artist?.display_name}
              albumId={album.id}
            />

            <RelatedAlbums mode="related" albumId={album.id} />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(AlbumPage);
