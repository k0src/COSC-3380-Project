import { memo, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Artist } from "@types";
import { useAuth } from "@contexts";
import { formatRelativeDate } from "@util";
import { useFollowStatus } from "@hooks";
import { LuUserRoundCheck, LuUserRoundPlus } from "react-icons/lu";
import { HorizontalRule } from "@components";
import styles from "./AlbumArtist.module.css";
import classNames from "classnames";
import artistPlaceholder from "@assets/artist-placeholder.png";

export interface AlbumArtistProps {
  artist: Artist;
  updatedAt: string;
}

const AlbumArtist: React.FC<AlbumArtistProps> = ({ artist, updatedAt }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    isFollowed,
    toggleFollow,
    isLoading: isFollowLoading,
  } = useFollowStatus({
    userId: user?.id || "",
    followingUserId: artist?.user_id || "",
    isAuthenticated,
  });

  useEffect(() => {
    if (user?.id && artist?.user_id) {
      queryClient.invalidateQueries({
        queryKey: ["followStatus", user.id, artist.user_id],
      });
    }
  }, [user?.id, artist?.user_id, queryClient]);

  const artistImageUrl = useMemo(
    () => artist.user?.profile_picture_url || artistPlaceholder,
    [artist.user?.profile_picture_url]
  );

  const handleFollow = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      await toggleFollow();
    } catch (error) {
      console.error("Toggling follow artist failed:", error);
    }
  }, [isAuthenticated, navigate, toggleFollow]);

  return (
    <div className={styles.artistContainer}>
      <div className={styles.artistContainerTop}>
        <img
          src={artistImageUrl}
          alt={`${artist.display_name} Image`}
          className={styles.artistImage}
          onClick={handleFollow}
          loading="lazy"
        />
        <div className={styles.artistNameContainer}>
          <Link className={styles.artistNameText} to={`/artists/${artist.id}`}>
            {artist.display_name}
          </Link>
          <button
            className={classNames(styles.followButton, {
              [styles.followButtonActive]: isFollowed,
            })}
            disabled={isFollowLoading}
            onClick={handleFollow}
          >
            {isFollowed ? <LuUserRoundCheck /> : <LuUserRoundPlus />}
          </button>
        </div>
      </div>
      <HorizontalRule />
      <span className={styles.updatedText}>
        Updated {formatRelativeDate(updatedAt)}
      </span>
    </div>
  );
};

export default memo(AlbumArtist);
