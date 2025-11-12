import {
  useState,
  Fragment,
  memo,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SongArtist } from "@types";
import { useAuth } from "@contexts";
import { useFollowStatus } from "@hooks";
import styles from "./ArtistInfo.module.css";
import { HorizontalRule, LazyImg } from "@components";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.webp";
import {
  LuUserRoundCheck,
  LuUserRoundPlus,
  LuBadgeCheck,
  LuUserRoundPen,
} from "react-icons/lu";

export interface ArtistInfoProps {
  mainArtist: SongArtist | undefined;
  otherArtists: SongArtist[];
}

const ArtistInfo: React.FC<ArtistInfoProps> = ({
  mainArtist,
  otherArtists,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const {
    isFollowed,
    toggleFollow,
    isLoading: isFollowLoading,
  } = useFollowStatus({
    userId: user?.id || "",
    followingUserId: mainArtist?.user_id || "",
    isAuthenticated,
  });

  useEffect(() => {
    if (user?.id && mainArtist?.user_id) {
      queryClient.invalidateQueries({
        queryKey: ["followStatus", user.id, mainArtist.user_id],
      });
    }
  }, [user?.id, mainArtist?.user_id, queryClient]);

  const handleFollowArtist = useCallback(async () => {
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

  const artistDisplayName = useMemo(
    () => mainArtist?.display_name || mainArtist?.user?.username,
    [mainArtist]
  );

  const artistImageUrl = useMemo(
    () => mainArtist?.user?.profile_picture_url || userPlaceholder,
    [mainArtist]
  );

  const OtherArtistItem = memo(({ artist }: { artist: SongArtist }) => (
    <div className={styles.otherArtistItem}>
      <LuUserRoundPen className={styles.otherArtistIcon} aria-hidden="true" />
      <div className={styles.otherArtistInfo}>
        <Link className={styles.otherArtistName} to={`/artists/${artist.id}`}>
          {artist.display_name}
        </Link>
        <span className={styles.otherArtistRole}>{artist.role}</span>
      </div>
    </div>
  ));

  if (!mainArtist) {
    return null;
  }

  return (
    <div className={styles.artistInfoLayout}>
      <div className={styles.artistInfoContainer}>
        <div className={styles.artistInfoLeft}>
          <LazyImg
            src={artistImageUrl}
            blurHash={mainArtist.user?.pfp_blurhash}
            alt={`${artistDisplayName} Image`}
            imgClassNames={[styles.artistImage]}
          />
          <button
            className={classNames(styles.artistFollowButton, {
              [styles.artistFollowButtonActive]: isFollowed,
            })}
            disabled={isFollowLoading}
            onClick={handleFollowArtist}
          >
            {isFollowed ? (
              <>
                Follow <LuUserRoundCheck />
              </>
            ) : (
              <>
                Follow <LuUserRoundPlus />
              </>
            )}
          </button>
        </div>
        <div className={styles.artistInfoRight}>
          <div className={styles.artistNameContainer}>
            <Link
              className={styles.artistInfoName}
              to={`/artists/${mainArtist?.id}`}
            >
              {artistDisplayName}
            </Link>
            {mainArtist?.verified && (
              <div
                className={styles.badgeWrapper}
                onMouseEnter={() => setIsTooltipVisible(true)}
                onMouseLeave={() => setIsTooltipVisible(false)}
              >
                <LuBadgeCheck className={styles.verifiedBadge} />
                {isTooltipVisible && (
                  <div className={styles.tooltip}>Verified by CoogMusic</div>
                )}
              </div>
            )}
          </div>
          <HorizontalRule />
          <div className={styles.artistBio}>
            {mainArtist?.bio || `${artistDisplayName} has no bio yet...`}
          </div>
        </div>
      </div>

      {otherArtists.length > 0 && (
        <div className={styles.otherArtistsContainer}>
          {otherArtists.map((artist: SongArtist, i: number) => (
            <Fragment key={artist.id}>
              <OtherArtistItem artist={artist} />
              {i < otherArtists.length - 1 && <HorizontalRule />}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ArtistInfo);
