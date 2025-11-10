import { memo, useCallback, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Playlist } from "@types";
import { formatRuntime, pluralize } from "@util";
import { CoverLightbox, PlaylistPlayButton, LazyImg } from "@components";
import { LuAudioLines, LuClock, LuThumbsUp } from "react-icons/lu";
import styles from "./PlaylistContainer.module.css";
import classNames from "classnames";
import musicPlaceholder from "@assets/music-placeholder.png";

const PlaylistStat = memo(
  ({
    icon: Icon,
    value,
  }: {
    icon: React.ElementType;
    value: number | string;
  }) => (
    <div className={styles.playlistStat}>
      <Icon />
      <span className={styles.statText}>{value}</span>
    </div>
  )
);

export interface PlaylistContainerProps {
  playlist: Playlist;
}

const PlaylistContainer: React.FC<PlaylistContainerProps> = ({ playlist }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const imageUrl = useMemo(
    () => playlist.image_url || musicPlaceholder,
    [playlist.image_url]
  );

  const formattedRuntime = useMemo(
    () => formatRuntime(playlist.runtime ?? 0),
    [playlist.runtime]
  );

  const songCountText = useMemo(
    () =>
      `${playlist.song_count ?? 0} ${pluralize(
        playlist.song_count ?? 0,
        "song"
      )}`,
    [playlist.song_count]
  );

  return (
    <>
      <div className={styles.playlistContainer}>
        <LazyImg
          src={imageUrl}
          alt={`${playlist.title} Cover`}
          imgClassNames={[
            styles.coverImage,
            imageUrl !== musicPlaceholder ? styles.coverImageClickable : "",
          ]}
          onClick={handleImageClick}
          loading="eager"
        />
        <div className={styles.playlistRight}>
          <div className={styles.playlistInfoContainer}>
            <Link
              to={`/users/${playlist.user?.id}`}
              className={styles.infoUsername}
            >
              {playlist.user?.username}
            </Link>
            <span className={styles.playlistTitle}>{playlist.title}</span>
            <div className={styles.statsContainer}>
              <PlaylistStat icon={LuAudioLines} value={songCountText} />
              <PlaylistStat icon={LuClock} value={formattedRuntime} />
              <PlaylistStat icon={LuThumbsUp} value={playlist.likes ?? 0} />
            </div>
          </div>
          <PlaylistPlayButton playlist={playlist} />
        </div>
      </div>

      {imageUrl && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleLightboxClose}
          imageUrl={imageUrl}
          altText={`${playlist.title} Cover`}
        />
      )}
    </>
  );
};

export default memo(PlaylistContainer);
