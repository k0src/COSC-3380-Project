import { useState, memo, useMemo, useCallback, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { useAudioQueue } from "@contexts";
import { useAsyncData, useFollowStatus } from "@hooks";
import { formatNumber } from "@util";
import { artistApi } from "@api";
import { ShareModal } from "@components";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./ArtistActions.module.css";
import classNames from "classnames";
import {
  LuCirclePlay,
  LuUserRoundPlus,
  LuShare,
  LuCircleAlert,
  LuUsersRound,
  LuMusic,
  LuAudioLines,
  LuUserRoundCheck,
} from "react-icons/lu";

const StatItem = memo(
  ({
    icon: Icon,
    value,
    label,
  }: {
    icon: React.ElementType;
    value: string;
    label: string;
  }) => (
    <div className={styles.artistStat}>
      <div className={styles.artistStatLarge}>
        <Icon aria-hidden="true" /> {value}
      </div>
      <span className={styles.artistStatLabel}>{label}</span>
    </div>
  )
);

export interface ArtistActionsProps {
  artistId: string;
  userId: string;
  artistName: string;
  shareLink: string;
}

const ArtistActions: React.FC<ArtistActionsProps> = ({
  artistId,
  userId,
  artistName,
  shareLink,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { actions } = useAudioQueue();
  const queryClient = useQueryClient();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const {
    isFollowed,
    toggleFollow,
    isLoading: isFollowLoading,
  } = useFollowStatus({
    userId: user?.id || "",
    followingUserId: userId,
    isAuthenticated,
  });

  useEffect(() => {
    if (user?.id && userId) {
      queryClient.invalidateQueries({
        queryKey: ["followStatus", user.id, userId],
      });
    }
  }, [user?.id, userId, queryClient]);

  const asyncConfig = useMemo(
    () => ({
      followingCount: () => artistApi.getFollowingCount(userId),
      followerCount: () => artistApi.getFollowerCount(userId),
      numberOfSongs: () => artistApi.getNumberOfSongs(artistId),
      totalStreams: () => artistApi.getTotalStreams(artistId),
    }),
    [artistId, userId]
  );

  const { data, loading, error } = useAsyncData(asyncConfig, [artistId], {
    cacheKey: `artist_actions_${artistId}`,
    hasBlobUrl: true,
  });

  const stats = useMemo(
    () => ({
      followers: formatNumber(data?.followerCount ?? 0),
      following: formatNumber(data?.followingCount ?? 0),
      tracks: formatNumber(data?.numberOfSongs ?? 0),
      streams: formatNumber(data?.totalStreams ?? 0),
    }),
    [data]
  );

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

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleReport = useCallback(() => {
    // TODO: open report modal...
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const handlePlayAll = useCallback(async () => {
    try {
      await actions.playArtist(artistId);
    } catch (error) {
      console.error("Failed to play artist:", error);
    }
  }, [actions, artistId]);

  return loading ? (
    <div className={styles.loaderContainer}>
      <PuffLoader color="#D53131" size={35} />
    </div>
  ) : (
    <>
      <div className={styles.artistActionsContainer}>
        <div className={styles.actionsLayout}>
          <button className={styles.actionButton} onClick={handlePlayAll}>
            Play <LuCirclePlay />
          </button>
          <button
            className={classNames(styles.actionButton, {
              [styles.followed]: isFollowed,
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
          <button className={styles.actionButtonAlt} onClick={handleShare}>
            Share <LuShare />
          </button>
          <button className={styles.actionButtonAlt} onClick={handleReport}>
            Report <LuCircleAlert />
          </button>

          {!error && (
            <>
              <StatItem
                icon={LuUsersRound}
                value={stats.followers}
                label="Followers"
              />
              <StatItem
                icon={LuUsersRound}
                value={stats.following}
                label="Following"
              />
              <StatItem icon={LuMusic} value={stats.tracks} label="Tracks" />
              <StatItem
                icon={LuAudioLines}
                value={stats.streams}
                label="Total Streams"
              />
            </>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        pageUrl={shareLink}
        pageTitle={artistName}
      />
    </>
  );
};

export default memo(ArtistActions);
