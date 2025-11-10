import { memo, useCallback, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Album } from "@types";
import { formatRuntime, pluralize } from "@util";
import { CoverLightbox, AlbumPlayButton } from "@components";
import { LuAudioLines, LuClock, LuThumbsUp } from "react-icons/lu";
import styles from "./AlbumContainer.module.css";
import classNames from "classnames";
import musicPlaceholder from "@assets/music-placeholder.png";

const AlbumStat = memo(
  ({
    icon: Icon,
    value,
  }: {
    icon: React.ElementType;
    value: number | string;
  }) => (
    <div className={styles.albumStat}>
      <Icon />
      <span className={styles.statText}>{value}</span>
    </div>
  )
);

export interface AlbumContainerProps {
  album: Album;
}

const AlbumContainer: React.FC<AlbumContainerProps> = ({ album }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const imageUrl = useMemo(
    () => album.image_url || musicPlaceholder,
    [album.image_url]
  );

  const formattedRuntime = useMemo(
    () => formatRuntime(album.runtime ?? 0),
    [album.runtime]
  );

  const songCountText = useMemo(
    () =>
      `${album.song_count ?? 0} ${pluralize(album.song_count ?? 0, "song")}`,
    [album.song_count]
  );

  return (
    <>
      <div className={styles.albumContainer}>
        <img
          src={imageUrl}
          alt={`${album.title} Cover`}
          className={classNames(styles.coverImage, {
            [styles.coverImageClickable]: !!imageUrl,
          })}
          loading="lazy"
          onClick={handleImageClick}
        />
        <div className={styles.albumRight}>
          <div className={styles.albumInfoContainer}>
            <Link
              to={`/users/${album.artist?.id}`}
              className={styles.infoArtist}
            >
              {album.artist?.display_name}
            </Link>
            <span className={styles.albumTitle}>{album.title}</span>
            <div className={styles.statsContainer}>
              <AlbumStat icon={LuAudioLines} value={songCountText} />
              <AlbumStat icon={LuClock} value={formattedRuntime} />
              <AlbumStat icon={LuThumbsUp} value={album.likes ?? 0} />
            </div>
          </div>
          <AlbumPlayButton album={album} />
        </div>
      </div>

      {imageUrl && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleLightboxClose}
          imageUrl={imageUrl}
          altText={`${album.title} Cover`}
        />
      )}
    </>
  );
};

export default memo(AlbumContainer);
