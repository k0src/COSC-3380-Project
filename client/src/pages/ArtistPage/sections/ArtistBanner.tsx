import React from "react";
import styles from '../ArtistPage.module.css'

interface ArtistBannerProps {
    artistName: string;
    location: string;
    imageURL: string;
}

const ArtistBanner: React.FC<ArtistBannerProps> = ({
    artistName,
    location,
    imageURL
}) => (
    <section className={styles.bannerSection}>
        <div className={styles.artistPFPDiv}>
            <img className={styles.artistPFP} src={imageURL}></img>
        </div>
        <section>
            <h2 className={[styles.interHeading1, styles.artistName].join(' ')}>{artistName}</h2>
            <p className={[styles.interHeading2, styles.locationName].join(' ')}>{location}</p>
        </section>
    </section>
)

export default ArtistBanner;