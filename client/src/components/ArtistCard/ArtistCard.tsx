import React from "react";
import type { Artist } from "../../types";
import styles from './ArtistCard.module.css'

interface ArtistCardProps {
    artist: Artist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
    artist,
}) => (
        <div className={styles.artistCircleCard}>
            <img src={artist?.user?.profile_picture_url} alt={artist.display_name} className={styles.artistImage} />
            <h3 className={styles.artistNameCentered}>{artist.display_name}</h3>
        </div>
)

// const ArtistCard: React.FC<ArtistCardProps> = ({
//     artist,
//     index,
// }) => (
//         <div key={index} className={styles.artistCircleCard}>
//             <img src={artist.image} alt={artist.name} className={styles.artistImage} />
//             <h3 className={styles.artistNameCentered}>{artist.name}</h3>
//         </div>
// )

export default ArtistCard;