import { memo } from "react";
import { Link } from "react-router-dom";
import type { UUID } from "@types";
import { LazyImg } from "@components";
import styles from "./LibraryArtist.module.css";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface LibraryArtistProps {
  artistId: UUID;
  artistImageUrl?: string;
  artistBlurHash?: string;
  artistName: string;
}

const LibraryArtist: React.FC<LibraryArtistProps> = ({
  artistId,
  artistImageUrl,
  artistBlurHash,
  artistName,
}) => {
  return (
    <Link
      key={artistId}
      className={styles.artistItem}
      to={`/artists/${artistId}`}
    >
      <LazyImg
        src={artistImageUrl || artistPlaceholder}
        blurHash={artistBlurHash}
        alt={artistName}
        imgClassNames={[styles.artistImage]}
      />
      <Link className={styles.artistName} to={`/artists/${artistId}`}>
        {artistName}
      </Link>
    </Link>
  );
};

export default memo(LibraryArtist);
