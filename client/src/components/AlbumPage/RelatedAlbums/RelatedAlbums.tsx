import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import { albumApi, artistApi } from "@api";
import { EntityItem } from "@components";
import styles from "./RelatedAlbums.module.css";
import musicPlaceholder from "@assets/music-placeholder.png";
import { pluralize } from "@util";

export type RelatedAlbumsProps =
  | {
      mode: "artist";
      artistId: UUID;
      artistName: string;
      albumId: UUID;
    }
  | {
      mode: "related";
      albumId: UUID;
      artistId?: never;
      artistName?: never;
    };

const RelatedAlbums: React.FC<RelatedAlbumsProps> = ({
  artistId,
  artistName,
  albumId,
  mode,
}) => {
  const getApiFn = () => {
    switch (mode) {
      case "related":
        return () =>
          albumApi.getRelatedAlbums(albumId, {
            includeArtist: true,
            limit: 10,
          });
      case "artist":
        return () =>
          artistApi.getAlbums(artistId, { includeSongCount: true, limit: 10 });
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  };

  const { data, loading, error } = useAsyncData(
    {
      albums: getApiFn(),
    },
    [artistId, albumId, mode],
    {
      cacheKey:
        mode === "related"
          ? `related_albums_${albumId}`
          : `artist_albums_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const albums = data?.albums;
  const filteredAlbums = useMemo(
    () => albums?.filter((album) => album.id !== albumId) ?? [],
    [albums, albumId]
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load albums.</div>;
  }

  if (!filteredAlbums || filteredAlbums.length === 0) {
    return null;
  }

  return (
    <div className={styles.albumsContainer}>
      <span className={styles.sectionTitle}>
        {mode === "related" ? "Related Albums" : `More Albums by ${artistName}`}
      </span>
      <div className={styles.albumsList}>
        {filteredAlbums.map((album) => (
          <EntityItem
            key={album.id}
            type="list"
            author={
              mode === "related"
                ? album.artist?.display_name || "Unknown"
                : `${album.song_count ?? 0} ${pluralize(
                    album.song_count ?? 0,
                    "song"
                  )}`
            }
            linkTo={`/albums/${album.id}`}
            title={album.title}
            imageUrl={album.image_url || musicPlaceholder}
            entity={album}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(RelatedAlbums);
