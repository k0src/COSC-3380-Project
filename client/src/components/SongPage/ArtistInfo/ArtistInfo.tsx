import { useState, Fragment, memo, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SongArtist } from "@types";
import { useAuth } from "@contexts";
import styles from "./ArtistInfo.module.css";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.png";
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
  //! user
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isFollowed, setIsFollowed] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleFollowArtist = useCallback(async () => {
    try {
      if (isAuthenticated) {
        //! send request here
        setIsFollowed((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Toggling follow artist failed:", error);
    }
  }, [isAuthenticated, navigate]);

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
          <img
            src={artistImageUrl}
            alt={`${artistDisplayName} Image`}
            className={styles.artistImage}
          />
          <button
            className={classNames(styles.artistFollowButton, {
              [styles.artistFollowButtonActive]: isFollowed,
            })}
            onClick={handleFollowArtist}
          >
            {isFollowed ? (
              <>
                Followed <LuUserRoundCheck />
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
          <div className={styles.horizontalRule}></div>
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
              {i < otherArtists.length - 1 && (
                <div className={styles.horizontalRule}></div>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ArtistInfo);
