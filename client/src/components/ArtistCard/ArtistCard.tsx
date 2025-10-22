import React from "react";
import styles from './ArtistCard.module.css'

interface ArtistCardProps {
    artist: {
    name: string;
    image: string;
    };
    index: number;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
    artist,
    index,
}) => (
        <div key={index} className={styles.artistCircleCard}>
            <img src={artist.image} alt={artist.name} className={styles.artistImage} />
            <h3 className={styles.artistNameCentered}>{artist.name}</h3>
        </div>
)

export default ArtistCard;