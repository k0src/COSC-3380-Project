import { memo } from "react";
import styles from "./ArtistCtaBanner.module.css";
import { Link } from "react-router-dom";
import Waveform from "@assets/waveform.svg?react";

const ArtistCtaBanner: React.FC = () => {
  return (
    <div className={styles.ctaBanner}>
      <div className={styles.ctaBannerLeft}>
        <div className={styles.ctaBannerTextContainer}>
          <span className={styles.ctaBannerTitle}>Become an Artist</span>
          <span className={styles.ctaBannerSubtitle}>
            Join a community of creators and share your music with the world.
          </span>
        </div>
        <Link to="/settings/me" className={styles.ctaBannerButton}>
          Sign Up as an Artist
        </Link>
      </div>
      <Waveform className={styles.waveformImage} />
    </div>
  );
};

export default memo(ArtistCtaBanner);
