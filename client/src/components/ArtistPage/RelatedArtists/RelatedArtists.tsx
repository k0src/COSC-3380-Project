import { memo } from "react";
import { PuffLoader } from "react-spinners";
import { Link } from "react-router-dom";
import type { UUID } from "@types";
import { artistApi } from "@api";
import { useAsyncData } from "@hooks";
import styles from "./RelatedArtists.module.css";
import artistPlaceholder from "@assets/artist-placeholder.png";

export interface RelatedArtistsProps {
  artistId: UUID;
}

const RelatedArtists: React.FC<RelatedArtistsProps> = ({ artistId }) => {
  const { data, loading, error } = useAsyncData(
    {
      relatedArtists: () =>
        artistApi.getRelatedArtists(artistId, { includeUser: true, limit: 10 }),
    },
    [artistId],
    {
      cacheKey: `related_artists_${artistId}`,
      hasBlobUrl: true,
    }
  );

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="#D53131" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load related artists.</div>;
  }

  const relatedArtists = data?.relatedArtists;

  if (!relatedArtists || relatedArtists.length === 0) {
    return null;
  }

  return (
    <section className={styles.relatedArtistsContainer}>
      <h2 className={styles.sectionTitle}>Fans Also Like</h2>
      <div className={styles.relatedArtistsList}>
        {relatedArtists.map((related) => (
          <div key={related.id} className={styles.relatedArtistItem}>
            <Link to={`/artists/${related.id}`}>
              <img
                src={related.user?.profile_picture_url || artistPlaceholder}
                alt={`${related.display_name}'s profile picture`}
                className={styles.relatedArtistImage}
                loading="lazy"
              />
            </Link>
            <Link
              className={styles.relatedArtistName}
              to={`/artists/${related.id}`}
            >
              {related.display_name}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(RelatedArtists);
