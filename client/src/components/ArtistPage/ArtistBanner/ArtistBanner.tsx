import { useState, useCallback, memo, useMemo } from "react";
import { CoverLightbox, LazyImg, LazyBannerImg } from "@components";
import { useTextContrast } from "@hooks";
import type { Artist } from "@types";
import styles from "./ArtistBanner.module.css";
import { LuBadgeCheck, LuPencil } from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface ArtistBannerProps {
  artist: Artist;
  isOwner?: boolean;
  onEditButtonClick?: () => void;
}

const ArtistBanner: React.FC<ArtistBannerProps> = ({
  artist,
  isOwner,
  onEditButtonClick,
}) => {
  const { textColor } = useTextContrast(artist.banner_image_url);

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const profilePicUrl = useMemo(
    () => artist.user?.profile_picture_url || artistPlaceholder,
    [artist.user?.profile_picture_url]
  );

  const imageClassNames = useMemo(
    () => [
      styles.artistImage,
      artist.user?.profile_picture_url ? styles.artistImageClickable : "",
    ],
    [artist.user?.profile_picture_url]
  );

  const bannerStyle = useMemo(
    () =>
      ({
        "--dynamic-text-color":
          textColor === "white" ? "var(--color-white)" : "var(--color-black)",
      } as React.CSSProperties),
    [textColor]
  );

  const handleTooltipShow = useCallback(() => setIsTooltipVisible(true), []);
  const handleTooltipHide = useCallback(() => setIsTooltipVisible(false), []);
  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    if (artist.user?.profile_picture_url) {
      setIsLightboxOpen(true);
    }
  }, [artist.user?.profile_picture_url]);

  return (
    <>
      <header className={styles.artistBanner} style={bannerStyle}>
        {artist.banner_image_url && (
          <LazyBannerImg
            src={artist.banner_image_url}
            blurHash={artist.banner_image_url_blurhash}
            alt={`${artist.display_name} Banner`}
          />
        )}
        <div className={styles.artistInfo}>
          <div className={styles.artistInfoWrapper}>
            <LazyImg
              src={profilePicUrl}
              blurHash={artist.user?.pfp_blurhash}
              alt={`${artist.display_name} Image`}
              imgClassNames={imageClassNames}
              loading="eager"
              onClick={handleImageClick}
            />

            <div className={styles.artistInfoRight}>
              <div className={styles.artistNameContainer}>
                <h1 className={styles.artistName}>{artist.display_name}</h1>
                {artist.verified && (
                  <div
                    className={styles.badgeWrapper}
                    onMouseEnter={handleTooltipShow}
                    onMouseLeave={handleTooltipHide}
                  >
                    <LuBadgeCheck className={styles.verifiedBadge} />
                    {isTooltipVisible && (
                      <div className={styles.tooltip}>
                        Verified by CoogMusic
                      </div>
                    )}
                  </div>
                )}
              </div>
              {artist.location && (
                <span className={styles.artistLocation}>{artist.location}</span>
              )}
            </div>
          </div>
          {isOwner && onEditButtonClick && (
            <button className={styles.ownerButton} onClick={onEditButtonClick}>
              <LuPencil />
            </button>
          )}
        </div>
      </header>

      {profilePicUrl && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleLightboxClose}
          imageUrl={profilePicUrl}
          altText={`${artist.display_name} Image`}
        />
      )}
    </>
  );
};

export default memo(ArtistBanner);
