import React from "react";
import { Link } from "react-router-dom";
import styles from "./FeaturedSection.module.css";
import type { Playlist } from "@types";

interface FeaturedSectionProps {
  // New preferred shape: pass the full playlist object from the API
  playlist?: Playlist | null;

  // Backwards-compatible props (optional) in case other pages use the component
  title?: string;
  description?: string;
  image?: string;
  likes?: number;
  tracks?: number;
  duration?: string;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = (props) => {
  const {
    playlist,
    title: titleProp,
    description: descriptionProp,
    image: imageProp,
    likes: likesProp,
    tracks: tracksProp,
    duration: durationProp,
  } = props;

  // Prefer values from playlist if provided, otherwise fall back to explicit props
  const title = playlist?.title || titleProp || "Untitled Playlist";
  const description = playlist?.description || descriptionProp || "";
  const image = playlist?.image_url || imageProp || "/PlayerBar/Mask group.png";
  const likes = playlist?.likes ?? likesProp ?? 0;
  const tracks = playlist?.song_count ?? tracksProp ?? 0;
  const duration = durationProp || "";

  return (
    <section className={styles.featuredSection}>
      <div className={styles.featuredLeft}>
        {playlist?.id ? (
          <Link to={`/playlists/${playlist.id}`} className={styles.playlistLink}>
            <h2 className={styles.featuredTitle}>{title}</h2>
          </Link>
        ) : (
          <h2 className={styles.featuredTitle}>{title}</h2>
        )}

        <p className={styles.featuredDescription}>{description}</p>
        <div className={styles.featuredMeta}>
          <img className={styles.metaIcon} alt="" />
          <span>{likes.toLocaleString()} likes</span>
          <span>• {tracks} tracks</span>
          <span>• {duration}</span>
        </div>
      </div>

      <div className={styles.featuredRight}>
        <div className={styles.featuredImageContainer}>
          {playlist?.id ? (
            <Link to={`/playlists/${playlist.id}`} className={styles.playlistLink}>
              <img src={image} alt={title} className={styles.featuredImage} />
            </Link>
          ) : (
            <img src={image} alt={title} className={styles.featuredImage} />
          )}
          <button className={styles.playButton}>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;