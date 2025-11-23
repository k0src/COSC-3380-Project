import { memo } from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { useAsyncData } from "@hooks";
import { HorizontalRule, LazyImg, TopArtistBannerButtons } from "@components";
import { artistApi } from "@api";
import { formatNumber, pluralize } from "@util";
import styles from "./TopArtistBanner.module.css";
import {
  LuTrendingUp,
  LuThumbsUp,
  LuAudioLines,
  LuUserRoundCheck,
} from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface TopArtistBannerProps {
  days?: number;
}

const TopArtistBanner: React.FC<TopArtistBannerProps> = ({ days = 30 }) => {
  const { data, loading, error } = useAsyncData(
    {
      topArtist: () => artistApi.getTopArtist(days),
    },
    [days],
    {
      cacheKey: `home_top_artist_${days}`,
    }
  );

  const topArtist = data?.topArtist;

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <PuffLoader color="var(--color-accent)" size={35} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Failed to load top artist.</div>;
  }

  if (!topArtist) {
    return null;
  }

  return (
    <div className={styles.topArtistBanner}>
      <LazyImg
        src={topArtist.user?.profile_picture_url || artistPlaceholder}
        alt={`${topArtist.display_name} Image`}
        blurHash={topArtist.user?.pfp_blurhash}
        imgClassNames={[styles.artistImage]}
      />
      <div className={styles.topArtistRight}>
        <div className={styles.topArtistTitle}>
          <LuTrendingUp className={styles.topArtistTitleIcon} />
          <span className={styles.topArtistTitleText}>Top Artist</span>
        </div>

        <div className={styles.topArtistInfo}>
          <Link
            to={`/artists/${topArtist.id}`}
            className={styles.topArtistName}
          >
            {topArtist.display_name}
          </Link>
          <div className={styles.topArtistInfoBottom}>
            <div className={styles.topArtistStats}>
              <div className={styles.topArtistStatItem}>
                <LuThumbsUp className={styles.topArtistStatIcon} />
                <span className={styles.topArtistStatLabel}>
                  {formatNumber(topArtist.likes ?? 0)}{" "}
                  {pluralize(Number(topArtist.likes ?? 0), "Like")}
                </span>
              </div>
              <div className={styles.statsBull}>&bull;</div>
              <div className={styles.topArtistStatItem}>
                <LuAudioLines className={styles.topArtistStatIcon} />
                <span className={styles.topArtistStatLabel}>
                  {formatNumber(topArtist.streams ?? 0)}{" "}
                  {pluralize(Number(topArtist.streams ?? 0), "Stream")}
                </span>
              </div>
              <div className={styles.statsBull}>&bull;</div>
              <div className={styles.topArtistStatItem}>
                <LuUserRoundCheck className={styles.topArtistStatIcon} />
                <span className={styles.topArtistStatLabel}>
                  {formatNumber(topArtist.followers ?? 0)}{" "}
                  {pluralize(Number(topArtist.followers ?? 0), "Follower")}
                </span>
              </div>
            </div>
            <HorizontalRule />
            <TopArtistBannerButtons
              artistId={topArtist.id}
              userId={topArtist.user_id}
            />
          </div>
        </div>

        <span className={styles.topArtistBio}>
          {topArtist.bio ?? `${topArtist.display_name} has no bio yet...`}
        </span>
      </div>
    </div>
  );
};

export default memo(TopArtistBanner);
