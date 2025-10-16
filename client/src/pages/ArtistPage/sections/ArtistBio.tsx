import React from "react";
import styles from '../ArtistPage.module.css'

interface artistBioProps{
    bio: string;
    followerCount: number,
}

const ArtistBio: React.FC<artistBioProps> = ({
    bio,
    followerCount,
}) => (
    <div>
        <div className={[styles.interHeading2, styles.bioHeader].join(' ')}>
            <h2>{followerCount} Monthly Listeners</h2>
        </div>
        <div className={[styles.instrumentSansContent, styles.bioContent].join(' ')}>
            <p>{bio}</p>
        </div>
    
    </div>

)

export default ArtistBio;