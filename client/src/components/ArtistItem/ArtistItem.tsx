import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Artist } from "@types";
import { LazyImg } from "@components";
import { useContextMenu } from "@contexts";
import styles from "./ArtistItem.module.css";
import artistPlaceholder from "@assets/artist-placeholder.webp";

export interface ArtistItemProps {
  artist: Artist;
  size?: number;
}

const ArtistItem: React.FC<ArtistItemProps> = ({ artist, size = 18 }) => {
  const { openContextMenu } = useContextMenu();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const artistEntity = {
        id: artist.id,
        display_name: artist.display_name,
        type: "artist" as const,
        user_id: artist.user_id,
      };
      openContextMenu(e.clientX, e.clientY, artistEntity as Artist, "artist");
    },
    [artist.id, artist.display_name, artist.user_id, openContextMenu]
  );

  return (
    <Link
      className={styles.artistItem}
      to={`/artists/${artist.id}`}
      onContextMenu={handleContextMenu}
    >
      <LazyImg
        src={artist.user?.profile_picture_url || artistPlaceholder}
        blurHash={artist.user?.pfp_blurhash}
        alt={artist.display_name}
        imgClassNames={[styles.artistImage]}
        size={size}
      />
      <span className={styles.artistName}>{artist.display_name}</span>
    </Link>
  );
};

export default memo(ArtistItem);
