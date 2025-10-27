import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi } from "../../api/song.api.js";
import { commentApi } from "../../api/comment.api.js";
import { artistApi } from "../../api/artist.api.js";
import type {
  Song,
  Artist,
  Comment,
  Album,
  SongArtist,
  UUID,
  CoverGradient,
  RGB,
  ArtistSong,
  SuggestedSong,
} from "../../types";
import styles from "./SongPage.module.css";
import { useAsyncData } from "../../hooks";
import { PageLoader } from "@components";
import {
  LuThumbsUp,
  LuPlay,
  LuMessageSquareText,
  LuCirclePlay,
  LuCirclePause,
  LuListPlus,
  LuShare,
  LuCircleAlert,
  LuMusic,
  LuChartLine,
  LuCalendar,
  LuUserRoundPlus,
  LuUserRoundCheck,
  LuBadgeCheck,
  LuSend,
  LuUserRoundPen,
  LuListEnd,
} from "react-icons/lu";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import WaveSurfer from "wavesurfer.js";
import classNames from "classnames";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import type { SparkLineChartProps } from "@mui/x-charts/SparkLineChart";
import {
  areaElementClasses,
  lineElementClasses,
} from "@mui/x-charts/LineChart";
import { chartsAxisHighlightClasses } from "@mui/x-charts/ChartsAxisHighlight";
import userPlaceholder from "@assets/user-placeholder.png";
import { useStreamTracking } from "../../hooks";
import musicPlaceholder from "../../../assets/music-placeholder.png";
import { useAuth } from "../../contexts/AuthContext.js";
import { useAudioQueue } from "../../contexts/AudioQueueContext.js";
import { ErrorPage, SongContainer, SongStats, SongDetails } from "@components";
import { formatRelativeDate, formatDateString } from "@util";

const DUMMY_PLAYS = [
  2, 4, 5, 10, 21, 24, 19, 28, 40, 48, 55, 60, 62, 61, 61, 60, 59, 60, 67, 34,
  57, 59, 67, 76, 78, 65, 89, 91, 121, 123,
];
const DUMMY_WEEKS = [
  "1/1",
  "1/8",
  "1/15",
  "1/22",
  "1/29",
  "2/5",
  "2/12",
  "2/19",
  "2/26",
  "3/5",
  "3/12",
  "3/19",
  "3/26",
  "4/2",
  "4/9",
  "4/16",
  "4/23",
  "4/30",
  "5/7",
  "5/14",
  "5/21",
  "5/28",
  "6/4",
  "6/11",
  "6/18",
  "6/25",
  "7/2",
  "7/9",
  "7/16",
  "7/23",
];

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // FIX LATER
  if (!id) {
    return (
      <ErrorPage
        title="Song Not Found"
        message="The requested song does not exist."
      />
    );
  }

  const { data, loading, error } = useAsyncData(
    {
      song: () =>
        songApi.getSongById(id, {
          includeAlbums: true,
          includeArtists: true,
          includeLikes: true,
        }),
      coverGradient: () => songApi.getCoverGradient(id),
      comments: () =>
        commentApi.getCommentsBySongId(id, {
          includeLikes: true,
          currentUserId: isAuthenticated && user ? user.id : undefined,
          limit: 25,
        }),
      moreSongsByArtist: async () =>
        artistApi.getSongs(
          "84a51edc-a38f-4659-974b-405b3e40f432", // test - pass artist as prop
          { limit: 5 }
        ),
      suggestedSongs: () =>
        songApi.getSuggestedSongs(id, {
          userId: isAuthenticated && user ? user.id : undefined,
          limit: 5,
        }),
    },
    [id],
    { cacheKey: `song_${id}`, hasBlobUrl: true }
  );

  const song = data?.song;
  const coverGradient = data?.coverGradient;
  const comments = data?.comments;
  const moreSongsByArtist = data?.moreSongsByArtist;
  const suggestedSongs = data?.suggestedSongs;

  const { mainArtist, otherArtists } = useMemo(() => {
    if (!song || !song?.artists || song.artists.length === 0) {
      return { mainArtist: null, otherArtists: [] };
    }

    const main = song.artists.find((artist) => artist.role === "Main") || null;
    const others =
      song.artists.filter((artist) => artist.role !== "Main") || [];

    return { mainArtist: main, otherArtists: others };
  }, [song]);

  // useStreamTracking({
  //   songId: id,
  //   wavesurferRef,
  //   onStream: (songId) => {
  //     if (isAuthenticated) {
  //       songApi.incrementSongStreams(songId);
  //     }
  //   },
  // });

  const handleToggleSongLike = async () => {
    try {
      if (isAuthenticated) {
        // send request here
        setIsLiked((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Toggling song like failed:", error);
    }
  };

  const handleAddToPlaylist = async () => {
    try {
      if (isAuthenticated) {
        // send request here
        console.log("added to playlist: " + song.id);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to playlist failed:", error);
    }
  };

  const handleAddToQueue = async () => {
    try {
      if (isAuthenticated) {
        // send request here
        console.log("added to queue: " + song.id);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding to queue failed:", error);
    }
  };

  const handleShare = () => {
    // open share modal...
  };

  const handleReport = () => {
    // open report modal...
  };

  const handleFollowArtist = async () => {
    try {
      if (isAuthenticated) {
        // send request here
        setIsFollowed((prev) => !prev);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Toggling follow artist failed:", error);
    }
  };

  const handleAddComment = async () => {
    try {
      if (isAuthenticated) {
        // send request here
        console.log("added comment to song: " + song.id);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Adding comment failed:", error);
    }
  };

  const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
    const [isLiked, setIsLiked] = useState(comment.user_liked ?? false);
    const [likeCount, setLikeCount] = useState(Number(comment.likes) || 0);

    const navigate = useNavigate();

    // send request here too
    const toggleCommentLike = () => {
      if (!isAuthenticated) {
        navigate("/login");
      }
      if (isLiked) {
        setLikeCount(likeCount - 1);
        setIsLiked(false);
      } else {
        setLikeCount(likeCount + 1);
        setIsLiked(true);
      }
    };

    const { comment_text, tags } = comment;

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    if (tags && tags.length > 0) {
      const sortedTags = [...tags].sort((a, b) => a.start - b.start);

      for (const tag of sortedTags) {
        if (tag.start > lastIndex) {
          segments.push(comment_text.slice(lastIndex, tag.start));
        }

        segments.push(
          <Link
            key={tag.user_id + tag.start}
            to={`/users/${tag.user_id}`}
            className={styles.commentTag}
          >
            {comment_text.slice(tag.start, tag.end)}
          </Link>
        );

        lastIndex = tag.end;
      }
    }

    if (lastIndex < comment_text.length) {
      segments.push(comment_text.slice(lastIndex));
    }

    return (
      <div key={comment.id} className={styles.comment}>
        <img
          src={
            comment.profile_picture_url
              ? comment.profile_picture_url
              : userPlaceholder
          }
          alt={comment.username}
          className={styles.commentListUserPfp}
        />
        <div className={styles.commentContentWrapper}>
          <div className={styles.commentContent}>
            <div className={styles.commentHeader}>
              <span className={styles.commentUsername}>{comment.username}</span>
              <span className={styles.commentSeparator}>&bull;</span>
              <span className={styles.commentTimestamp}>
                {formatRelativeDate(comment.commented_at)}
              </span>
            </div>
            <span className={styles.commentText}>{segments}</span>
          </div>
          <div
            className={classNames(styles.commentLikesContainer, {
              [styles.commentLikesContainerActive]: isLiked,
            })}
          >
            <span className={styles.commentLikeCount}>{likeCount}</span>
            <button
              className={classNames(styles.commentLikeButton, {
                [styles.commentLikeButtonActive]: isLiked,
              })}
              onClick={toggleCommentLike}
            >
              <LuThumbsUp />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <>
        <Helmet>
          <title>Internal Server Error</title>
        </Helmet>
        <p>{String(error)}</p> {/* fix */}
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{song ? `${song.title} - CoogMusic` : "CoogMusic"}</title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : (
        <div className={styles.songLayout}>
          <div className={styles.songLayoutTop}>
            <SongContainer
              song={song}
              coverGradient={coverGradient}
              comments={comments}
            />

            <div className={styles.songLayoutTopRight}>
              <SongStats
                playsData={{ weeks: DUMMY_WEEKS, plays: DUMMY_PLAYS }}
              />
              <SongDetails
                genre={song.genre || "Unknown"}
                releaseDate={song.release_date || "2025-01-01"}
              />
              <div className={styles.songActionsContainer}>
                <button
                  className={classNames(styles.actionButton, {
                    [styles.actionButtonActive]: isLiked,
                  })}
                  onClick={handleToggleSongLike}
                >
                  <LuThumbsUp />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleAddToPlaylist}
                >
                  <LuListPlus />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleAddToQueue}
                >
                  <LuListEnd />
                </button>
                <button className={styles.actionButton} onClick={handleShare}>
                  <LuShare />
                </button>
                <button className={styles.actionButton} onClick={handleReport}>
                  <LuCircleAlert />
                </button>
              </div>
            </div>
          </div>
          <div className={styles.songLayoutBottom}>
            <div className={styles.songLayoutBottomLeft}>
              <div className={styles.artistInfoContainer}>
                <div className={styles.artistInfoLeft}>
                  <img
                    src={
                      mainArtist?.user?.profile_picture_url
                        ? mainArtist?.user?.profile_picture_url
                        : userPlaceholder
                    }
                    alt={`${
                      mainArtist?.display_name
                        ? mainArtist.display_name
                        : mainArtist?.user?.username
                    } Image`}
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
                      {mainArtist?.display_name
                        ? mainArtist.display_name
                        : mainArtist?.user?.username}
                    </Link>
                    {mainArtist?.verified && (
                      <div
                        className={styles.badgeWrapper}
                        onMouseEnter={() => setIsTooltipVisible(true)}
                        onMouseLeave={() => setIsTooltipVisible(false)}
                      >
                        <LuBadgeCheck className={styles.verifiedBadge} />
                        {isTooltipVisible && (
                          <div className={styles.tooltip}>
                            Verified by CoogMusic
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.horizontalRule}></div>
                  <div className={styles.artistBio}>
                    {mainArtist?.bio
                      ? mainArtist.bio
                      : `${mainArtist?.display_name ?? ""} has no bio yet...`}
                  </div>
                </div>
              </div>

              {otherArtists.length > 0 && (
                <div className={styles.otherArtistsContainer}>
                  {otherArtists.map((artist: SongArtist, i: number) => (
                    <>
                      <div key={artist.id} className={styles.otherArtistItem}>
                        <LuUserRoundPen className={styles.otherArtistIcon} />
                        <div className={styles.otherArtistInfo}>
                          <Link
                            className={styles.otherArtistName}
                            to={`/artists/${artist.id}`}
                          >
                            {artist.display_name}
                          </Link>
                          <span className={styles.otherArtistRole}>
                            {artist.role}
                          </span>
                        </div>
                      </div>
                      {i < otherArtists.length - 1 && (
                        <div className={styles.horizontalRule}></div>
                      )}
                    </>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.commentsContainer}>
              <div className={styles.commentsContainerTop}>
                <img
                  src={userPlaceholder}
                  alt="username"
                  className={styles.commentUserPfp}
                />

                <div className={styles.commentInputContainer}>
                  <input
                    type="text"
                    placeholder="Leave a comment..."
                    className={styles.commentInput}
                  />
                  <button
                    className={styles.commentButton}
                    onClick={handleAddComment}
                  >
                    <LuSend />
                  </button>
                </div>
              </div>

              {comments && comments.length > 0 && (
                <>
                  <div className={styles.horizontalRule}></div>
                  <div className={styles.commentsList}>
                    {comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={styles.suggestionsContainer}>
              {song.albums && song.albums.length > 0 && (
                <div className={styles.suggestionsWrapper}>
                  {/* add links */}
                  <span className={styles.suggestionLabel}>On Albums</span>
                  <div className={styles.suggestionsSection}>
                    {song.albums.map((album: Album) => (
                      <div key={album.id} className={styles.suggestionItem}>
                        <img
                          src={
                            album.image_url ? album.image_url : musicPlaceholder
                          }
                          alt={`${album.title} Cover`}
                          className={styles.suggestionImage}
                        />
                        <div className={styles.suggestionInfo}>
                          <span className={styles.suggestionAuthor}>
                            {album.artist?.display_name}
                          </span>
                          <Link
                            className={styles.suggestionTitle}
                            to={`/albums/${album.id}`}
                          >
                            {album.title}
                          </Link>
                          <span className={styles.suggestionSubtitle}>
                            {formatDateString(album.release_date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {moreSongsByArtist && moreSongsByArtist.length > 0 && (
                <div className={styles.suggestionsWrapper}>
                  <span className={styles.suggestionLabel}>
                    More by {mainArtist?.display_name}
                  </span>
                  <div className={styles.suggestionsSection}>
                    {moreSongsByArtist
                      .filter((songItem: ArtistSong) => songItem.id !== id)
                      .map((songItem: ArtistSong) => (
                        <div
                          key={songItem.id}
                          className={styles.suggestionItem}
                        >
                          <img
                            src={
                              songItem.image_url
                                ? songItem.image_url
                                : musicPlaceholder
                            }
                            alt={`${songItem.title} Cover`}
                            className={styles.suggestionImage}
                          />
                          <div className={styles.suggestionInfo}>
                            <span className={styles.suggestionAuthor}>
                              {songItem.role}
                            </span>
                            <Link
                              className={styles.suggestionTitle}
                              to={`/songs/${songItem.id}`}
                            >
                              {songItem.title}
                            </Link>
                            <span className={styles.suggestionSubtitle}>
                              {formatDateString(songItem.release_date)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {suggestedSongs && suggestedSongs.length > 0 && (
                <div className={styles.suggestionsWrapper}>
                  <span className={styles.suggestionLabel}>Related Songs</span>
                  <div className={styles.suggestionsSection}>
                    {suggestedSongs.map((songItem: SuggestedSong) => (
                      <div key={songItem.id} className={styles.suggestionItem}>
                        <img
                          src={
                            songItem.image_url
                              ? songItem.image_url
                              : musicPlaceholder
                          }
                          alt={`${songItem.title} Cover`}
                          className={styles.suggestionImage}
                        />
                        <div className={styles.suggestionInfo}>
                          <span className={styles.suggestionAuthor}>
                            {songItem.main_artist.display_name}
                          </span>
                          <Link
                            className={styles.suggestionTitle}
                            to={`/songs/${songItem.id}`}
                          >
                            {songItem.title}
                          </Link>
                          <span className={styles.suggestionSubtitle}>
                            {formatDateString(songItem.release_date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SongPage;
