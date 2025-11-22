import { memo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID, AccessContext } from "@types";
import { artistApi } from "@api";
import { useAsyncData } from "@hooks";
import { useAuth } from "@contexts";
import { ArtistItem } from "@components";
import styles from "./RelatedArtists.module.css";

export interface RelatedArtistsProps {
  artistId: UUID;
}

const RelatedArtists: React.FC<RelatedArtistsProps> = ({ artistId }) => {
  const { user } = useAuth();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  const { data, loading, error } = useAsyncData(
    {
      relatedArtists: () =>
        artistApi.getRelatedArtists(artistId, accessContext, {
          includeUser: true,
          limit: 10,
        }),
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
        <PuffLoader color="var(--color-accent)" size={35} />
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
            <ArtistItem artist={related} size={14} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(RelatedArtists);
