import React, { useEffect, useState } from "react";
import { useAuth } from "@contexts";
import { userApi, artistApi } from "@api";
import type { Song } from "@types";
import SongBar from "@components/SongBar/SongBar";
import styles from "./FeedPage.module.css";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";

const FeedPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      try {
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

        const combined = songsArrays.flat();
        combined.sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        );

        setSongs(combined);
      } catch (err: any) {
        console.error("Error loading feed:", err);
        setError(err?.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [user]);

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
    </div>
  );
};

export default FeedPage;