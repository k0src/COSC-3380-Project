import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { artistApi } from "@api";
import type { AccessContext, Song, UUID } from "@types";
import { useAsyncData } from "@hooks";
import { getMainArtist } from "@util";
import { EntityItemCard } from "@components";
import styles from "./MyUploadsList.module.css";

export interface MyUploadsListProps {
  artistId: UUID;
  accessContext: AccessContext;
}

const MyUploadsList: React.FC<MyUploadsListProps> = ({
  artistId,
  accessContext,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      artistSongs: () =>
        artistApi.getSongs(artistId, accessContext, {
          includeAlbums: true,
          includeArtists: true,
          orderByColumn: "release_date",
          orderByDirection: "DESC",
          limit: 8,
        }),
    },
    [artistId],
    {
      cacheKey: `home_my_uploads_${artistId}`,
      hasBlobUrl: true,
    }
  );

  const artistSongs = data?.artistSongs;

  const songAuthor = useMemo(
    () => (song: Song) => getMainArtist(song.artists ?? [])?.display_name || "",
    []
  );

  const songAuthorLink = useMemo(
    () => (song: Song) => {
      const artist = getMainArtist(song.artists ?? []);
      return artist ? `/artists/${artist.id}` : undefined;
    },
    []
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load your uploads.</div>;
  }

  if (!artistSongs || artistSongs.length === 0) {
    return <div className={styles.error}>No uploads available.</div>;
  }
  return (
    <div className={styles.uploadsContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Your Uploads</span>
        <Link to="/artist-dashboard/manage" className={styles.viewMoreLink}>
          Manage Uploads
        </Link>
      </div>

      <div className={styles.uploadsList}>
        {artistSongs.map((song: Song) => (
          <EntityItemCard
            key={song.id}
            type="song"
            linkTo={`/songs/${song.id}`}
            author={songAuthor(song)}
            authorLinkTo={songAuthorLink(song)}
            title={song.title}
            subtitle={song.albums?.[0]?.title || ""}
            imageUrl={song.image_url}
            blurHash={song.image_url_blurhash}
            entity={song}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(MyUploadsList);
