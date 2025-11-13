import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Blurhash } from "react-blurhash";
import styles from "./LazyImg.module.css";
import classNames from "classnames";
import blurPlaceholder from "@assets/blur-placeholder.webp";

export interface LazyImgProps {
  src: string;
  blurHash?: string;
  alt?: string;
  imgClassNames: string[];
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onClick?: () => void;
  size?: number;
}

const LazyImg: React.FC<LazyImgProps> = ({
  src,
  blurHash,
  alt,
  imgClassNames,
  loading = "lazy",
  onLoad,
  onClick,
  size,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hideBlur, setHideBlur] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleOnLoad = useCallback(() => {
    setLoaded(true);
    setTimeout(() => {
      setHideBlur(true);
    }, 300);
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
      handleOnLoad();
    }
  }, [handleOnLoad]);

  return (
    <div
      className={classNames(styles.container, ...imgClassNames)}
      style={size ? { width: `${size}rem`, height: `${size}rem` } : undefined}
    >
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
        className={classNames(styles.img, loaded && styles.loaded)}
        loading={loading}
        onLoad={handleOnLoad}
        onClick={onClick}
      />
    </div>
  );
};

export default memo(LazyImg);
