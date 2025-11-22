import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { libraryApi } from "@api";
import type { AccessContext, Song, UUID } from "@types";
import { useAsyncData } from "@hooks";
import { getMainArtist } from "@util";
import { EntityItem } from "@components";
import styles from "./UserLikesList.module.css";

export interface UserLikesListProps {
  userId: UUID;
  accessContext: AccessContext;
}

const UserLikesList: React.FC<UserLikesListProps> = ({
  userId,
  accessContext,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      likes: () =>
        libraryApi.getLibrarySongs(userId, accessContext, {
          limit: 4,
        }),
    },
    [userId],
    {
      cacheKey: `home_user_likes_${userId}`,
      hasBlobUrl: true,
    }
  );

  const likes = data?.likes || [];

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
    return <div className={styles.error}>Failed to load liked songs.</div>;
  }

  if (!likes || likes.length === 0) {
    return <div className={styles.error}>No liked songs available.</div>;
  }
  return (
    <div className={styles.likesContainer}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Your Likes</span>
        <Link to="/library/songs" className={styles.viewMoreLink}>
          View More
        </Link>
      </div>

      <div className={styles.likesList}>
        {likes.map((song: Song) => (
          <EntityItem
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
            size="medium"
          />
        ))}
      </div>
    </div>
  );
};

export default memo(UserLikesList);
