import { memo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID } from "@types";
import { artistApi } from "@api";
import { useAsyncData } from "@hooks";
import { ArtistItem } from "@components";
import styles from "./ArtistRecommendations.module.css";

export interface ArtistRecommendationsProps {
  userId: UUID;
}

const ArtistRecommendations: React.FC<ArtistRecommendationsProps> = ({
  userId,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      recommendedArtists: () =>
        artistApi.getArtistRecommendations(userId, {
          includeUser: true,
          limit: 10,
        }),
    },
    [userId],
    {
      cacheKey: `home_artist_recommendations_${userId}`,
      hasBlobUrl: true,
    }
  );

  const recommendedArtists = data?.recommendedArtists;

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>Failed to load recommended artists.</div>
    );
  }

  return (
    <section className={styles.recommendedArtistsContainer}>
      <h2 className={styles.sectionTitle}>Artists For You</h2>
      <div className={styles.recommendedArtistsList}>
        {recommendedArtists.map((recommended) => (
          <div key={recommended.id} className={styles.recommendedArtistItem}>
            <ArtistItem artist={recommended} size={14} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(ArtistRecommendations);
