import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import type { UUID, Artist } from "@types";
import { LazyImg } from "@components";
import { useContextMenu } from "@contexts";
import styles from "./LibraryArtist.module.css";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface LibraryArtistProps {
  artistId: UUID;
  artistImageUrl?: string;
  artistBlurHash?: string;
  artistName: string;
  userId: UUID;
}

const LibraryArtist: React.FC<LibraryArtistProps> = ({
  artistId,
  artistImageUrl,
  artistBlurHash,
  artistName,
  userId,
}) => {
  const { openContextMenu } = useContextMenu();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const artistEntity = {
        id: artistId,
        display_name: artistName,
        type: "artist" as const,
        user_id: userId,
      };
      openContextMenu(e.clientX, e.clientY, artistEntity as Artist, "artist");
    },
    [artistId, artistName, userId, openContextMenu]
  );

  return (
    <Link
      key={artistId}
      className={styles.artistItem}
      to={`/artists/${artistId}`}
      onContextMenu={handleContextMenu}
    >
      <LazyImg
        src={artistImageUrl || artistPlaceholder}
        blurHash={artistBlurHash}
        alt={artistName}
        imgClassNames={[styles.artistImage]}
      />
      <span className={styles.artistName}>{artistName}</span>
    </Link>
  );
};

export default memo(LibraryArtist);
