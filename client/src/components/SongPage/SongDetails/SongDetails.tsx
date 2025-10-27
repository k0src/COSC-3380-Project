import { memo, useMemo } from "react";
import { formatDateString } from "@util";
import classNames from "classnames";
import styles from "./SongDetails.module.css";
import { LuMusic, LuCalendar } from "react-icons/lu";

export interface SongDetailsProps {
  genre: string;
  releaseDate: string;
}

const SongDetails: React.FC<SongDetailsProps> = ({ genre, releaseDate }) => {
  const formattedDate = useMemo(
    () => formatDateString(releaseDate),
    [releaseDate]
  );

  return (
    <div className={styles.detailsContainer}>
      <div className={styles.detailsColumn}>
        <span className={styles.detailLabel}>Genre</span>
        <div className={styles.detailWrapper}>
          <LuMusic className={styles.detailIcon} />
          {/* eventually this should link somewhere... */}
          <span className={classNames(styles.detailName, styles.genreName)}>
            {genre || "Unknown"}
          </span>
        </div>
      </div>
      <div className={styles.verticalRule}></div>
      <div className={styles.detailsColumn}>
        <span className={styles.detailLabel}>Release Date</span>
        <div className={styles.detailWrapper}>
          <LuCalendar className={styles.detailIcon} />
          <span className={styles.detailName}>
            {formattedDate || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(SongDetails);
