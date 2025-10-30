import { useMemo, memo } from "react";
import { useAsyncData } from "@hooks";
import { PuffLoader } from "react-spinners";
import { useAuth } from "@contexts";
import { songApi, artistApi } from "@api";
import { formatDateString } from "@util";
import { EntityItem } from "@components";
import type { Song, Album, Artist, ArtistSong, SuggestedSong } from "@types";
import styles from "./SongSuggestions.module.css";

export interface SongSuggestionsProps {
  song: Song;
  mainArtist?: Artist;
}

const SongSuggestions: React.FC<SongSuggestionsProps> = ({
  song,
  mainArtist,
}) => {
  const songId = song.id;
  const { user, isAuthenticated } = useAuth();

  const asyncConfig = useMemo(
    () => ({
      ...(mainArtist && {
        moreSongsByArtist: async () =>
          artistApi.getSongs(mainArtist.id, { limit: 5 }),
      }),
      suggestedSongs: () =>
        songApi.getSuggestedSongs(songId, {
          userId: isAuthenticated && user ? user.id : undefined,
          limit: 5,
        }),
    }),
    [songId, mainArtist, isAuthenticated, user]
  );

  const { data, loading, error } = useAsyncData(
    asyncConfig,
    [songId, mainArtist],
    { cacheKey: `suggestions_song_${songId}`, hasBlobUrl: true }
  );

  if (error) {
    return <div className={styles.error}>Failed to load suggestions.</div>;
  }

  const moreSongsByArtist = data?.moreSongsByArtist;
  const filteredMoreSongs = useMemo(
    () =>
      moreSongsByArtist?.filter(
        (songItem: ArtistSong) => songItem.id !== songId
      ) ?? [],
    [moreSongsByArtist, songId]
  );
  const suggestedSongs = data?.suggestedSongs;

  return loading ? (
    <div className={styles.loaderContainer}>
      <PuffLoader color="#D53131" size={50} />
    </div>
  ) : (
    <div className={styles.suggestionsContainer}>
      {song.albums && song.albums.length > 0 && (
        <div className={styles.suggestionsWrapper}>
          <span className={styles.suggestionLabel}>On Albums</span>
          <div className={styles.suggestionsSection}>
            {song.albums.map((album: Album) => (
              <EntityItem
                key={album.id}
                imageUrl={album.image_url}
                alt={`${album.title} Cover`}
                author={album.artist?.display_name || "Unknown Artist"}
                title={album.title}
                linkTo={`/albums/${album.id}`}
                subtitle={formatDateString(album.release_date)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredMoreSongs && filteredMoreSongs.length > 0 && (
        <div className={styles.suggestionsWrapper}>
          <span className={styles.suggestionLabel}>
            More by {mainArtist?.display_name}
          </span>
          <div className={styles.suggestionsSection}>
            {filteredMoreSongs.map((songItem: ArtistSong) => (
              <EntityItem
                key={songItem.id}
                imageUrl={songItem.image_url}
                alt={`${songItem.title} Cover`}
                author={songItem.role}
                title={songItem.title}
                linkTo={`/songs/${songItem.id}`}
                subtitle={formatDateString(songItem.release_date)}
              />
            ))}
          </div>
        </div>
      )}

      {suggestedSongs && suggestedSongs.length > 0 && (
        <div className={styles.suggestionsWrapper}>
          <span className={styles.suggestionLabel}>Related Songs</span>
          <div className={styles.suggestionsSection}>
            {suggestedSongs.map((songItem: SuggestedSong) => (
              <EntityItem
                key={songItem.id}
                imageUrl={songItem.image_url}
                alt={`${songItem.title} Cover`}
                author={songItem.main_artist.display_name}
                title={songItem.title}
                linkTo={`/songs/${songItem.id}`}
                subtitle={formatDateString(songItem.release_date)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SongSuggestions);
