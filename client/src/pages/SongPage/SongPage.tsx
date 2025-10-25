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
import musicPlaceholder from "../../assets/music-placeholder.png";
import { useAuth } from "../../contexts/AuthContent.js";

const formatDate = (dateString: string): string => dateString.split("T")[0];

const formatRelativeDate = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
};

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

const sparkLineSettings: SparkLineChartProps = {
  data: DUMMY_PLAYS,
  baseline: "min",
  xAxis: { id: "week-axis", data: DUMMY_WEEKS },
  yAxis: {
    domainLimit: (_, maxValue: number) => ({
      min: -maxValue / 6,
      max: maxValue,
    }),
  },
  sx: {
    [`& .${areaElementClasses.root}`]: { opacity: 0.2 },
    [`& .${lineElementClasses.root}`]: { strokeWidth: 3 },
    [`& .${chartsAxisHighlightClasses.root}`]: {
      stroke: "rgb(213, 49, 49)",
      strokeDasharray: "none",
      strokeWidth: 2,
    },
  },
  slotProps: {
    lineHighlight: { r: 4 },
  },
  clipAreaOffset: { top: 2, bottom: 2 },
  axisHighlight: { x: "line" },
};

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // FIX LATER
  if (!id) {
    return <div>Invalid song ID</div>;
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

  const [wavesurfer, setWavesurfer] = useState<{
    playPause: () => void;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  interface OnReadyEvent {
    playPause: () => void;
  }

  const onReady = (ws: OnReadyEvent): void => {
    setWavesurfer(ws);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (wavesurfer) wavesurfer.playPause();
  };

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyPress, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyPress, { capture: true });
    };
  }, [wavesurferRef.current]);

  useEffect(() => {
    if (!waveformRef.current || !song.audio_url) return;
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 80,
      waveColor: "#F6F6F6",
      progressColor: "#d53131",
      barWidth: 3,
      barRadius: 6,
      barGap: 5,
      normalize: true,
      backend: "MediaElement",
      sampleRate: 44100,
      url: song.audio_url,
      autoplay: false,
      plugins: [
        Hover.create({
          lineColor: "#B22323",
          lineWidth: 2,
          labelBackground: "#B22323",
          labelColor: "#F6F6F6",
          labelSize: "11px",
        }),
      ],
    });

    ws.on("ready", () => {
      onReady(ws);
      setIsPlaying(false);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [song?.audio_url]);

  useStreamTracking({
    songId: id,
    wavesurferRef,
    onStream: (songId) => {
      if (isAuthenticated) {
        songApi.incrementSongStreams(songId);
      }
    },
  });

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
            <div
              className={styles.songContainer}
              style={
                {
                  "--cover-gradient-color1": `rgba(${coverGradient.color1.r}, ${coverGradient.color1.g}, ${coverGradient.color1.b}, 0.2)`,
                  "--cover-gradient-color2": `rgba(${coverGradient.color2.r}, ${coverGradient.color2.g}, ${coverGradient.color2.b}, 0.2)`,
                } as React.CSSProperties
              }
            >
              <img
                src={song.image_url ? song.image_url : musicPlaceholder}
                alt={`${song.title} Cover`}
                className={styles.coverImage}
              />
              <div className={styles.songRight}>
                <div className={styles.songInfoContainer}>
                  <span className={styles.artistName}>
                    {mainArtist?.display_name}
                  </span>
                  <span className={styles.songTitle}>{song.title}</span>
                  <div className={styles.interactionsContainer}>
                    <div className={styles.interactionStat}>
                      <LuPlay />
                      <span className={styles.interactionText}>
                        {song?.streams ?? 0}
                      </span>
                    </div>
                    <div className={styles.interactionStat}>
                      <LuThumbsUp />
                      <span className={styles.interactionText}>
                        {song?.likes ?? 0}
                      </span>
                    </div>
                    <div className={styles.interactionStat}>
                      <LuMessageSquareText />
                      <span className={styles.interactionText}>
                        {comments ? comments.length : 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.playerContainer}>
                  <button
                    onClick={togglePlay}
                    className={classNames(styles.playerPlayBtn, {
                      [styles.playerPlayBtnActive]: isPlaying,
                    })}
                  >
                    {isPlaying ? <LuCirclePause /> : <LuCirclePlay />}
                  </button>
                  <div
                    ref={waveformRef}
                    className={styles.playerWaveform}
                  ></div>
                </div>
              </div>
            </div>
            <div className={styles.songLayoutTopRight}>
              <div className={styles.songStatsContainer}>
                <span className={styles.statsText}>Weekly Plays</span>
                <SparkLineChart
                  height={80}
                  width={330}
                  area
                  showHighlight
                  color="rgb(213, 49, 49)"
                  className={styles.playsChart}
                  {...sparkLineSettings}
                />
              </div>
              <div className={styles.detailsContainer}>
                <div className={styles.detailsColumn}>
                  <span className={styles.detailLabel}>Genre</span>
                  <div className={styles.detailWrapper}>
                    <LuMusic className={styles.detailIcon} />
                    <span
                      className={classNames(
                        styles.detailName,
                        styles.genreName
                      )}
                    >
                      {song.genre}
                    </span>
                  </div>
                </div>
                <div className={styles.verticalRule}></div>
                <div className={styles.detailsColumn}>
                  <span className={styles.detailLabel}>Release Date</span>
                  <div className={styles.detailWrapper}>
                    <LuCalendar className={styles.detailIcon} />
                    <span className={styles.detailName}>
                      {formatDate(song.release_date)}
                    </span>
                  </div>
                </div>
              </div>
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
                            {formatDate(album.release_date)}
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
                              {formatDate(songItem.release_date)}
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
                            {formatDate(songItem.release_date)}
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
