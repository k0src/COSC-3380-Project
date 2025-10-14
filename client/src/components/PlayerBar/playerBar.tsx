import React from 'react';
import styles from './playerBar.module.css';

const PlayerBar: React.FC = () => {
    return (
        <div className={styles.PlayerBar}>
            {/* Left: Song Info */}
            <div className={styles.playerInfo}>
                <img src="/PlayerBar/Mask group.png" alt="Song Cover" className={styles.playerImage}/>
                <div className={styles.playerSong}>
                    <p>Song Name</p>
                    <span>Artist Name</span>
                </div>
            </div>

            {/* Center: Player Controls */}
            <div className={styles.playerControls}>
                <div className={styles.playButtons}>
                    <button className={styles.iconButton}>
                        <img src="/PlayerBar/Replay.svg" alt="Replay"/>
                    </button>
                    <button className={styles.iconButton}>
                        <img src="/PlayerBar/BackSong.svg" alt="Previous"/>
                    </button>
                    <button className={styles.iconButton}>
                        <img src="/PlayerBar/Play.svg" alt="Play" className={styles.playButton}/>
                    </button>
                    <button className={styles.iconButton}>
                        <img src="/PlayerBar/NextSong.svg" alt="Next"/>
                    </button>
                    <button className={styles.iconButton}>
                        <img src="/PlayerBar/MixSong.svg" alt="Shuffle"/>
                    </button>
                </div>
                
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}></div>
                </div>
            </div>

            {/* Right: Volume & Extra Controls */}
            <div className={styles.playerExtra}>
                <button className={styles.iconButton}>
                    <img src="/PlayerBar/Playlist.svg" alt="Playlist"/>
                </button>
                <button className={styles.iconButton}>
                    <img src="/PlayerBar/Like.svg" alt="Like"/>
                </button>
                <div className={styles.volumeControl}>
                    <img src="/PlayerBar/Volume.svg" alt="Volume"/>
                </div>
            </div>
        </div>
    );
};

export default PlayerBar;