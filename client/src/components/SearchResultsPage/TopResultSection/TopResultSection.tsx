import { memo } from "react";
import type { Song, Album, Artist, Playlist, User } from "@types";
import { TopResultCard } from "@components";
import { formatDateString, getArtistListString } from "@util";
import styles from "./TopResultSection.module.css";
import musicPlaceholder from "@assets/music-placeholder.webp";

interface TopResultSectionProps {
  topResult?: Song | Album | Artist | Playlist | User;
}

const TopResultSection: React.FC<TopResultSectionProps> = memo(
  ({ topResult }) => {
    if (!topResult) return null;

    const type = "type" in topResult ? topResult.type : "user";

    return (
      <div className={styles.topResultSection}>
        <span className={styles.sectionTitle}>Top Result</span>
        {type === "song" && (
          <TopResultCard
            type="song"
            entity={topResult as Song}
            linkTo={`/songs/${topResult.id}`}
            title={(topResult as Song).title}
            author={
              getArtistListString((topResult as Song).artists || []) ||
              "Unknown Artist"
            }
            subtitle={formatDateString((topResult as Song).release_date)}
            imageUrl={(topResult as Song).image_url || musicPlaceholder}
            blurHash={(topResult as Song).image_url_blurhash}
          />
        )}
        {type === "album" && (
          <TopResultCard
            type="album"
            entity={topResult as Album}
            linkTo={`/albums/${topResult.id}`}
            title={(topResult as Album).title}
            author={
              (topResult as Album).artist?.display_name || "Unknown Artist"
            }
            authorLinkTo={
              (topResult as Album).artist?.id
                ? `/artists/${(topResult as Album).artist?.id}`
                : undefined
            }
            subtitle={formatDateString((topResult as Album).release_date)}
            imageUrl={(topResult as Album).image_url || musicPlaceholder}
            blurHash={(topResult as Album).image_url_blurhash}
          />
        )}
        {type === "artist" && (
          <TopResultCard
            type="artist"
            entity={undefined as never}
            linkTo={`/artists/${topResult.id}`}
            title={(topResult as Artist).display_name}
            imageUrl={(topResult as Artist).user?.profile_picture_url}
          />
        )}
        {type === "playlist" && (
          <TopResultCard
            type="playlist"
            entity={topResult as Playlist}
            linkTo={`/playlists/${topResult.id}`}
            title={(topResult as Playlist).title}
            author={(topResult as Playlist).user?.username || "Unknown"}
            authorLinkTo={
              (topResult as Playlist).user?.id
                ? `/users/${(topResult as Playlist).user?.id}`
                : undefined
            }
            subtitle={`${(topResult as Playlist).song_count} songs`}
            imageUrl={(topResult as Playlist).image_url || musicPlaceholder}
            blurHash={(topResult as Playlist).image_url_blurhash}
          />
        )}
        {type === "user" && (
          <TopResultCard
            type="user"
            entity={undefined as never}
            linkTo={`/users/${topResult.id}`}
            title={(topResult as User).username}
            imageUrl={(topResult as User).profile_picture_url}
          />
        )}
      </div>
    );
  }
);

export default TopResultSection;
