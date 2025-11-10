import { memo } from "react";
import { formatRelativeDate } from "@util";
import { HorizontalRule } from "@components";
import styles from "./PlaylistDescription.module.css";

export interface PlaylistDescriptionProps {
  description?: string;
  updatedAt: string;
}

const PlaylistDescription: React.FC<PlaylistDescriptionProps> = ({
  description,
  updatedAt,
}) => {
  return (
    <div className={styles.descriptionContainer}>
      <span className={styles.descriptionText}>
        {description || "This playlist has no description yet."}
      </span>
      <HorizontalRule />
      <span className={styles.updatedText}>
        Updated {formatRelativeDate(updatedAt)}
      </span>
    </div>
  );
};

export default memo(PlaylistDescription);
