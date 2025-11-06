import { useState, useCallback, memo, useMemo } from "react";
import { CoverLightbox } from "@components";
import { useTextContrast } from "@hooks";
import styles from "./ArtistBanner.module.css";
import classNames from "classnames";
import { LuBadgeCheck } from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.png";

export interface ArtistBannerProps {
  bannerImageUrl?: string;
  artistImageUrl?: string;
  artistName: string;
  artistLocation?: string;
  isVerified?: boolean;
}

const ArtistBanner: React.FC<ArtistBannerProps> = ({
  bannerImageUrl,
  artistImageUrl,
  artistName,
  artistLocation,
  isVerified,
}) => {
  const { textColor, loading } = useTextContrast(bannerImageUrl);

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleTooltipShow = useCallback(() => setIsTooltipVisible(true), []);
  const handleTooltipHide = useCallback(() => setIsTooltipVisible(false), []);
  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const bannerStyle = useMemo(
    () =>
      ({
        "--dynamic-text-color":
          textColor === "white" ? "var(--color-white)" : "var(--color-black)",
      } as React.CSSProperties),
    [textColor]
  );

  return (
    <>
      <header className={styles.artistBanner} style={bannerStyle}>
        {bannerImageUrl && !loading && (
          <img
            src={bannerImageUrl}
            alt={`${artistName} Banner`}
            loading="lazy"
            className={styles.bannerImage}
          />
        )}
        <div className={styles.artistInfo}>
          <img
            src={artistImageUrl || artistPlaceholder}
            alt={`${artistName} Image`}
            className={classNames(styles.artistImage, {
              [styles.artistImageClickable]: !!artistImageUrl,
            })}
            loading="lazy"
            onClick={handleImageClick}
          />
          <div className={styles.artistInfoRight}>
            <div className={styles.artistNameContainer}>
              <h1 className={styles.artistName}>{artistName}</h1>
              {isVerified && (
                <div
                  className={styles.badgeWrapper}
                  onMouseEnter={handleTooltipShow}
                  onMouseLeave={handleTooltipHide}
                >
                  <LuBadgeCheck className={styles.verifiedBadge} />
                  {isTooltipVisible && (
                    <div className={styles.tooltip}>Verified by CoogMusic</div>
                  )}
                </div>
              )}
            </div>
            {artistLocation && (
              <span className={styles.artistLocation}>{artistLocation}</span>
            )}
          </div>
        </div>
      </header>

      {artistImageUrl && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleLightboxClose}
          imageUrl={artistImageUrl}
          altText={`${artistName} Image`}
        />
      )}
    </>
  );
};

export default memo(ArtistBanner);
