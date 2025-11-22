import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { getMainArtist } from "@util";
import { EntityItemCard } from "@components";
import type { AccessContext, Song, UUID } from "@types";
import { adminApi } from "@api";
import styles from "./NewFromArtistsList.module.css";

export interface NewFromArtistsListProps {
  userId: UUID;
  accessContext: AccessContext;
}

const NewFromArtistsList: React.FC<NewFromArtistsListProps> = ({
  userId,
  accessContext,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      newFromArtists: () =>
        adminApi.getNewFromFollowedArtists(userId, accessContext, 8),
    },
    [userId],
    {
      cacheKey: `new_from_artists_${userId}`,
      hasBlobUrl: true,
    }
  );

  const newFromArtists = data?.newFromArtists;

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
    return (
      <div className={styles.error}>
        Failed to load new songs from followed artists.
      </div>
    );
  }

  if (!newFromArtists || newFromArtists.length === 0) {
    return (
      <div className={styles.error}>
        No new songs from followed artists available.
      </div>
    );
  }

  return (
    <div className={styles.newFromArtistsContainer}>
      <span className={styles.sectionTitle}>New From Artists You Follow</span>

      <div className={styles.newFromArtistsList}>
        {newFromArtists.map((song: Song) => (
          <EntityItemCard
            key={song.id}
            type="song"
            linkTo={`/songs/${song.id}`}
            author={songAuthor(song)}
            authorLinkTo={songAuthorLink(song)}
            subtitle={song.albums?.[0]?.title || ""}
            title={song.title}
            imageUrl={song.image_url}
            blurHash={song.image_url_blurhash}
            entity={song}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(NewFromArtistsList);
