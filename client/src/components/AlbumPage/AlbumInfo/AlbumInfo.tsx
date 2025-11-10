import { memo, useMemo } from "react";
import { formatDateString } from "@util";
import { VerticalRule } from "@components";
import styles from "./AlbumInfo.module.css";
import classNames from "classnames";
import { LuMusic, LuCalendar } from "react-icons/lu";

export interface AlbumInfoProps {
  genre: string;
  releaseDate: string;
}

const AlbumInfo: React.FC<AlbumInfoProps> = ({ genre, releaseDate }) => {
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
          <span className={classNames(styles.detailName, styles.genreName)}>
            {genre || "Unknown"}
          </span>
        </div>
      </div>
      <VerticalRule />
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

export default memo(AlbumInfo);
