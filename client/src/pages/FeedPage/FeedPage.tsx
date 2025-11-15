import React, { useEffect, useState } from "react";
import { useAuth } from "@contexts";
import { userApi, artistApi } from "@api";
import type { Song, Artist } from "@types";
import { SongBar, ArtistBar } from "@components";
import styles from "./FeedPage.module.css";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";

const FeedPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedArtists, setRecommendedArtists] = useState<Artist[]>([]);
  const [currentOffset, setCurrentOffset] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load songs from followed artists
        const following = await userApi.getFollowing(user.id);
        const artistIds = following
          .map((f) => f.artist_id)
          .filter((id): id is string => Boolean(id));

        if (artistIds.length === 0) {
          setSongs([]);
          return;
        }

        const songsArrays = await Promise.all(
          artistIds.map((artistId) =>
            artistApi.getSongs(artistId, {
              includeArtists: true,
              includeAlbums: true,
            })
          )
        );

        // Load recommended artists
        const recommended = await userApi.getRecommendedArtists(user.id);
        console.log("Recommended artists:", recommended);

        const combined = songsArrays.flat();
        combined.sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        );

        setSongs(combined);
        setRecommendedArtists(recommended);
        setCurrentOffset(0); // Reset offset when loading new data
      } catch (err: any) {
        console.error("Error loading feed:", err);
        setError(err?.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [user]);

  const handleRefreshRecommendations = () => {
    // Rotate to the next 3 artists
    const newOffset = currentOffset + 3;
    if (newOffset >= recommendedArtists.length) {
      setCurrentOffset(0); // Wrap around to the beginning
    } else {
      setCurrentOffset(newOffset);
    }
  };

  // Get the current 3 artists to display
  const displayedArtists = recommendedArtists.slice(
    currentOffset,
    currentOffset + 3
  );

  if (authLoading) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className={styles.feedPage}>
      <div className={styles.recentReleases}>
        <h2>Recent Releases from Artists You Follow</h2>
        <div className={styles.songList}>
          {loading ? (
            <PuffLoader color="#D53131" size={50} />
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : songs.length === 0 ? (
            <p>No recent releases from artists you follow.</p>
          ) : (
            songs.map((s) => (
              <Link
                to={`/songs/${s.id}`}
                key={s.id}
                className={styles.songLink}
              >
                <SongBar
                  image={s.image_url || ""}
                  title={s.title}
                  artist={
                    s.artists && s.artists.length > 0
                      ? s.artists[0].display_name
                      : "Unknown Artist"
                  }
                  genre={s.genre || "Unknown"}
                  plays={s.streams || 0}
                  likes={s.likes || 0}
                  comments={s.comments || 0}
                />
              </Link>
            ))
          )}
        </div>
      </div>
      <div className={styles.recommendedArtists}>
        <div className={styles.recommendedHeader}>
          <h2>Recommended Artists</h2>
          {recommendedArtists.length > 3 && (
            <button
              onClick={handleRefreshRecommendations}
              className={styles.refreshButton}
            >
                Next
            </button>
          )}
        </div>
        <div className={styles.artistList}>
          {loading ? (
            <PuffLoader color="#D53131" size={50} />
          ) : displayedArtists.length === 0 ? (
            <p>No recommended artists found.</p>
          ) : (
            displayedArtists.map((artist) => (
              <Link
                to={`/artists/${artist.id}`}
                key={artist.id}
                className={styles.artistLink}
              >
                <ArtistBar
                  image={artist.user?.profile_picture_url || ""}
                  name={artist.display_name || "Unknown Artist"}
                  streams={artist.stream_count || 0}
                  followers={artist.follower_count || 0}
                />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;