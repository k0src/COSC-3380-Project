import { useMemo, useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAudioQueue, useAuth } from "@contexts";
import { artistApi } from "@api";
import type { UUID, Artist } from "@types";
import { useAsyncData, useTextContrast } from "@hooks";
import {
  ErrorPage,
  SongContainer,
  SongStats,
  SongDetails,
  SongActions,
  ArtistInfo,
  SongComments,
  SongSuggestions,
  EntityItem,
  EntityItemCard,
  PageLoader,
  CoverLightbox,
  ShareModal,
  ArtistBanner,
} from "@components";
import { formatDateString, getMainArtist } from "@util";
import styles from "./ArtistPage.module.css";
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
  LuAudioLines,
  LuChevronRight,
  LuChevronLeft,
} from "react-icons/lu";
import classNames from "classnames";
import artistPlaceholder from "@assets/artist-placeholder.png";
import musicPlaceholder from "@assets/music-placeholder.png";

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { actions } = useAudioQueue();

  const [isFollowed, setIsFollowed] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [albumsScrollPosition, setAlbumsScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [singlesScrollPosition, setSinglesScrollPosition] = useState(0);
  const [isSinglesScrolling, setIsSinglesScrolling] = useState(false);

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

  if (!id) {
    return (
      <ErrorPage
        title="Artist Not Found"
        message="The requested artist does not exist."
      />
    );
  }

  const asyncConfig = useMemo(
    () => ({
      artist: () => artistApi.getArtistById(id, { includeUser: true }),
      popularSongs: () =>
        artistApi.getSongs(id, {
          includeAlbums: true,
          includeArtists: true,
          orderByColumn: "streams",
          orderByDirection: "DESC",
          limit: 10,
        }),
      singles: () =>
        artistApi.getSongs(id, {
          includeArtists: true,
          onlySingles: true,
          limit: 10,
        }),
      albums: () =>
        artistApi.getAlbums(id, {
          limit: 10,
        }),
      relatedArtists: () =>
        artistApi.getRelatedArtists(id, { includeUser: true, limit: 7 }),
      numberOfSongs: () => artistApi.getNumberOfSongs(id),
      totalStreams: () => artistApi.getTotalStreams(id),
      followers: () => artistApi.getFollowers(id), //! NEEDS TO BE ARTIST.USER.ID
      following: () => artistApi.getFollowing(id), //! NEEDS TO BE ARTIST.USER.ID
      playlists: () =>
        artistApi.getPlaylists(id, { includeUser: true, limit: 10 }),
      monthlyListeners: () => artistApi.getMonthlyListeners(id),
    }),
    [id]
  );

  const { data, loading, error } = useAsyncData(asyncConfig, [id], {
    cacheKey: `artist_${id}`,
    hasBlobUrl: true,
  });

  const artist = data?.artist;
  const popularSongs = data?.popularSongs;
  const albums = data?.albums || [];
  const singles = data?.singles || [];
  const relatedArtists = data?.relatedArtists;
  const numberOfSongs = data?.numberOfSongs;
  const totalStreams = data?.totalStreams;
  const followers = data?.followers;
  const following = data?.following;
  const playlists = data?.playlists;
  const monthlyListeners = data?.monthlyListeners;

  const { textColor } = useTextContrast(artist?.banner_image_url);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleReport = () => {
    //! open report modal...
  };

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const handlePlayAll = useCallback(() => {
    //todo: make new action - playArtist + make util function to get all songs by artist sorted by streams
  }, []);

  const totalAlbums = albums.length;
  const albumsPerView = 6; // Number of albums visible at once
  // Calculate max scroll position: we can scroll until the last group of albums is visible
  const maxScrollPosition = Math.max(0, totalAlbums - albumsPerView);
  const needsScrolling = totalAlbums > albumsPerView;

  const handleAlbumsScrollNext = useCallback(() => {
    setIsScrolling(true);
    setAlbumsScrollPosition((prev) =>
      Math.min(prev + albumsPerView, maxScrollPosition)
    );
    setTimeout(() => setIsScrolling(false), 300); // Match CSS transition duration
  }, [maxScrollPosition, albumsPerView]);

  const handleAlbumsScrollPrevious = useCallback(() => {
    setIsScrolling(true);
    setAlbumsScrollPosition((prev) => Math.max(prev - albumsPerView, 0));
    setTimeout(() => setIsScrolling(false), 300); // Match CSS transition duration
  }, [albumsPerView]);

  const canScrollNext = albumsScrollPosition < maxScrollPosition;
  const canScrollPrevious = albumsScrollPosition > 0;

  // Calculate singles scroll logic (same as albums)
  const totalSingles = singles.length;
  const singlesPerView = 6; // Number of singles visible at once
  const maxSinglesScrollPosition = Math.max(0, totalSingles - singlesPerView);
  const needsSinglesScrolling = totalSingles > singlesPerView;

  const handleSinglesScrollNext = useCallback(() => {
    setIsSinglesScrolling(true);
    setSinglesScrollPosition((prev) =>
      Math.min(prev + singlesPerView, maxSinglesScrollPosition)
    );
    setTimeout(() => setIsSinglesScrolling(false), 300); // Match CSS transition duration
  }, [maxSinglesScrollPosition, singlesPerView]);

  const handleSinglesScrollPrevious = useCallback(() => {
    setIsSinglesScrolling(true);
    setSinglesScrollPosition((prev) => Math.max(prev - singlesPerView, 0));
    setTimeout(() => setIsSinglesScrolling(false), 300); // Match CSS transition duration
  }, [singlesPerView]);

  const canScrollSinglesNext = singlesScrollPosition < maxSinglesScrollPosition;
  const canScrollSinglesPrevious = singlesScrollPosition > 0;

  if (error) {
    return (
      <ErrorPage
        title="Internal Server Error"
        message="An unexpected error occurred. Please try again later."
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {artist ? `${artist.display_name} - CoogMusic` : "CoogMusic"}
        </title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className={styles.artistLayout}>
            <ArtistBanner
              bannerImageUrl={artist.banner_image_url}
              artistImageUrl={artist.user?.profile_picture_url}
              artistName={artist.display_name}
              artistLocation={artist.location}
              isVerified={artist.verified}
            />

            <div className={styles.artistLayoutBottom}>
              <div className={styles.artistLayoutBottomLeft}>
                {popularSongs && popularSongs.length > 0 && (
                  <div className={styles.popularSongsContainer}>
                    <span className={styles.sectionTitle}>Popular</span>
                    <div className={styles.popularSongsList}>
                      {popularSongs?.map((song, i) => (
                        <EntityItem
                          key={song.id}
                          type="song"
                          linkTo={`/songs/${song.id}`}
                          author={
                            getMainArtist(song.artists ?? [])?.display_name ||
                            ""
                          }
                          title={song.title}
                          subtitle={song.albums ? song.albums[0]?.title : ""}
                          imageUrl={song.image_url}
                          entity={song}
                          isSmall={false}
                          index={i + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {albums && albums.length > 0 && (
                  <div className={styles.albumsContainer}>
                    <span className={styles.sectionTitle}>Albums</span>
                    {needsScrolling ? (
                      <div className={styles.albumsWithNavigation}>
                        <button
                          className={styles.albumsNavButton}
                          onClick={handleAlbumsScrollPrevious}
                          disabled={!canScrollPrevious}
                        >
                          <LuChevronLeft />
                        </button>
                        <div className={styles.albumsScrollContainer}>
                          <div
                            className={styles.albumsList}
                            style={{
                              transform: `translateX(-${
                                albumsScrollPosition * (18 + 2.4)
                              }rem)`,
                            }}
                          >
                            {albums.map((album) => (
                              <EntityItemCard
                                key={album.id}
                                type="list"
                                linkTo={`/albums/${album.id}`}
                                author={artist.display_name}
                                title={album.title}
                                subtitle={formatDateString(album.release_date)}
                                imageUrl={album.image_url}
                                entity={album}
                              />
                            ))}
                          </div>
                          <div
                            className={styles.albumsScrollGradient}
                            style={{ opacity: isScrolling ? 1 : 0 }}
                          />
                        </div>
                        <button
                          className={styles.albumsNavButton}
                          onClick={handleAlbumsScrollNext}
                          disabled={!canScrollNext}
                        >
                          <LuChevronRight />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.albumsList}>
                        {albums.map((album) => (
                          <EntityItemCard
                            key={album.id}
                            type="list"
                            linkTo={`/albums/${album.id}`}
                            author={artist.display_name}
                            title={album.title}
                            subtitle={formatDateString(album.release_date)}
                            imageUrl={album.image_url}
                            entity={album}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {singles && singles.length > 0 && (
                  <div className={styles.singlesContainer}>
                    <span className={styles.sectionTitle}>Singles</span>
                    {needsSinglesScrolling ? (
                      <div className={styles.singlesWithNavigation}>
                        <button
                          className={styles.singlesNavButton}
                          onClick={handleSinglesScrollPrevious}
                          disabled={!canScrollSinglesPrevious}
                        >
                          <LuChevronLeft />
                        </button>
                        <div className={styles.singlesScrollContainer}>
                          <div
                            className={styles.singlesList}
                            style={{
                              transform: `translateX(-${
                                singlesScrollPosition * (18 + 2.4)
                              }rem)`,
                            }}
                          >
                            {singles.map((single) => (
                              <EntityItemCard
                                key={single.id}
                                type="song"
                                linkTo={`/songs/${single.id}`}
                                author={
                                  getMainArtist(single.artists ?? [])
                                    ?.display_name || ""
                                }
                                title={single.title}
                                subtitle={formatDateString(single.release_date)}
                                imageUrl={single.image_url}
                                entity={single}
                              />
                            ))}
                          </div>
                          <div
                            className={styles.singlesScrollGradient}
                            style={{ opacity: isSinglesScrolling ? 1 : 0 }}
                          />
                        </div>
                        <button
                          className={styles.singlesNavButton}
                          onClick={handleSinglesScrollNext}
                          disabled={!canScrollSinglesNext}
                        >
                          <LuChevronRight />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.singlesList}>
                        {singles.map((single) => (
                          <EntityItemCard
                            key={single.id}
                            type="song"
                            linkTo={`/songs/${single.id}`}
                            author={
                              getMainArtist(single.artists ?? [])
                                ?.display_name || ""
                            }
                            title={single.title}
                            subtitle={formatDateString(single.release_date)}
                            imageUrl={single.image_url}
                            entity={single}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {relatedArtists && relatedArtists.length > 0 && (
                  <div className={styles.relatedArtistsContainer}>
                    <span className={styles.sectionTitle}>Fans Also Like</span>
                    <div className={styles.relatedArtistsList}>
                      {relatedArtists?.map((related) => (
                        <div
                          key={related.id}
                          className={styles.relatedArtistItem}
                        >
                          <Link to={`/artists/${related.id}`}>
                            <img
                              src={
                                related.user?.profile_picture_url ||
                                artistPlaceholder
                              }
                              alt={`${related.display_name} Image`}
                              className={styles.relatedArtistImage}
                              loading="lazy"
                            />
                          </Link>
                          <Link
                            className={styles.relatedArtistName}
                            to={`/artists/${related.id}`}
                          >
                            {related.display_name}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.artistLayoutBottomTopRight}>
                <div className={styles.artistActionsContainer}>
                  <div className={styles.actionsLayout}>
                    <button
                      className={styles.actionButton}
                      onClick={handlePlayAll}
                    >
                      Play All <LuCirclePlay />
                    </button>
                    <button
                      className={styles.actionButton}
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
                    <button
                      className={styles.actionButtonAlt}
                      onClick={handleShare}
                    >
                      Share <LuShare />
                    </button>
                    <button
                      className={styles.actionButtonAlt}
                      onClick={handleReport}
                    >
                      Report <LuCircleAlert />
                    </button>

                    <div className={styles.artistStat}>
                      <div className={styles.artistStatLarge}>
                        <LuUserRoundCheck /> {followers?.length || 0}
                      </div>
                      <span className={styles.artistStatLabel}>Followers</span>
                    </div>
                    <div className={styles.artistStat}>
                      <div className={styles.artistStatLarge}>
                        <LuUserRoundCheck /> {following?.length || 0}
                      </div>
                      <span className={styles.artistStatLabel}>Following</span>
                    </div>
                    <div className={styles.artistStat}>
                      <div className={styles.artistStatLarge}>
                        <LuMusic /> {numberOfSongs || 0}
                      </div>
                      <span className={styles.artistStatLabel}>Tracks</span>
                    </div>
                    <div className={styles.artistStat}>
                      <div className={styles.artistStatLarge}>
                        <LuAudioLines /> {totalStreams || 0}
                      </div>
                      <span className={styles.artistStatLabel}>
                        Total Streams
                      </span>
                    </div>
                  </div>
                </div>

                {followers && followers.length > 0 && (
                  <div className={styles.followingContainer}>
                    <span className={styles.sectionTitle}>Following</span>
                    <div className={styles.followingList}>
                      {/*//! get following artists */}
                    </div>
                  </div>
                )}
                {playlists && playlists.length > 0 && (
                  <div className={styles.playlistsContainer}>
                    <span className={styles.sectionTitle}>
                      Playlists Featuring {artist.display_name}
                    </span>
                    <div className={styles.playlistsList}>
                      {data?.playlists?.map((playlist) => (
                        <EntityItem
                          key={playlist.id}
                          type="list"
                          author={playlist.user?.username || "Unknown"}
                          linkTo={`/playlists/${playlist.id}`}
                          title={playlist.title}
                          imageUrl={musicPlaceholder} //! fix this, add generated playlist image
                          entity={playlist}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className={styles.aboutContainer}>
                  <span className={styles.aboutTitle}>About</span>
                  <span className={styles.monthlyListenersText}>
                    {monthlyListeners} monthly listeners
                  </span>
                  <span className={styles.artistBio}>
                    {artist.bio || `${artist.display_name} has no bio yet...`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            pageUrl={window.location.href}
            pageTitle={artist.display_name}
          />
        </>
      )}
    </>
  );
};

export default ArtistPage;
