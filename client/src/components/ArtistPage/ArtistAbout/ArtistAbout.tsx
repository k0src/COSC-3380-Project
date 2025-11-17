import { memo, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import type { UUID } from "@types";
import { formatNumber } from "@util";
import { useAsyncData } from "@hooks";
import { artistApi } from "@api";
import styles from "./ArtistAbout.module.css";

export interface ArtistAboutProps {
  artistId: UUID;
  artistName: string;
  artistBio?: string;
}

const ArtistAbout: React.FC<ArtistAboutProps> = ({
  artistId,
  artistName,
  artistBio,
}) => {
  const { data, loading, error } = useAsyncData(
    {
      monthlyListeners: () => artistApi.getMonthlyListeners(artistId),
    },
    [artistId],
    {
      cacheKey: `about_${artistId}`,
    }
  );

  const monthlyListeners = useMemo(() => {
    const count = formatNumber(data?.monthlyListeners ?? 0);
    return count;
  }, [data]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load about section.</div>;
  }

  return (
    <div className={styles.aboutContainer}>
      <span className={styles.aboutTitle}>About</span>
      <span className={styles.monthlyListenersText}>
        {monthlyListeners} monthly listeners
      </span>
      <span className={styles.artistBio}>
        {artistBio || `${artistName} has no bio yet...`}
      </span>
    </div>
  );
};

export default memo(ArtistAbout);
