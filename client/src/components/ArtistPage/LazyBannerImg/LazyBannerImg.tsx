import { memo, useState, useCallback, useRef } from "react";
import { Blurhash } from "react-blurhash";
import styles from "./LazyBannerImg.module.css";
import classNames from "classnames";
import blurPlaceholder from "@assets/banner-blur-placeholder.webp";

export interface LazyBannerImgProps {
  src: string;
  blurHash?: string;
  alt?: string;
  className?: string;
}

const LazyBannerImg: React.FC<LazyBannerImgProps> = ({
  src,
  blurHash,
  alt,
  className,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hideBlur, setHideBlur] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleOnLoad = useCallback(() => {
    setLoaded(true);
    setTimeout(() => {
      setHideBlur(true);
    }, 300);
  }, []);

  return (
    <>
      {!hideBlur && (
        <div
          className={classNames(styles.placeholder, loaded && styles.hidden)}
        >
          {blurHash ? (
            <Blurhash
              hash={blurHash}
              width="100%"
              height="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
              className={styles.blur}
            />
          ) : (
            <img src={blurPlaceholder} className={styles.blur} alt="" />
          )}
        </div>
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt || ""}
        className={classNames(styles.img, className, loaded && styles.loaded)}
        loading="lazy"
        onLoad={handleOnLoad}
      />
    </>
  );
};

export default memo(LazyBannerImg);
