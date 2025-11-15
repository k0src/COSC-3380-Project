import { useState, useCallback, memo, useMemo } from "react";
import { CoverLightbox, LazyImg, LazyBannerImg } from "@components";
import { useTextContrast } from "@hooks";
import styles from "./ArtistBanner.module.css";
import { LuBadgeCheck } from "react-icons/lu";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface ArtistBannerProps {
  bannerImageUrl?: string;
  artistImageUrl?: string;
  artistImgBlurHash?: string;
  bannerImgBlurHash?: string;
  artistName: string;
  artistLocation?: string;
  isVerified?: boolean;
}

const ArtistBanner: React.FC<ArtistBannerProps> = ({
  bannerImageUrl,
  bannerImgBlurHash,
  artistImageUrl,
  artistImgBlurHash,
  artistName,
  artistLocation,
  isVerified,
}) => {
  const { textColor } = useTextContrast(bannerImageUrl);

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleTooltipShow = useCallback(() => setIsTooltipVisible(true), []);
  const handleTooltipHide = useCallback(() => setIsTooltipVisible(false), []);
  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  //! fix me!!!
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
        {bannerImageUrl && (
          <LazyBannerImg
            src={bannerImageUrl}
            blurHash={bannerImgBlurHash}
            alt={`${artistName} Banner`}
          />
        )}
        <div className={styles.artistInfo}>
          <LazyImg
            src={artistImageUrl || artistPlaceholder}
            blurHash={artistImgBlurHash}
            alt={`${artistName} Image`}
            imgClassNames={[
              styles.artistImage,
              artistImageUrl ? styles.artistImageClickable : "",
            ]}
            loading="eager"
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
