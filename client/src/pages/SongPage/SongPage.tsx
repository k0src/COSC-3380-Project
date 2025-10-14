import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { songApi } from "../../api/song.api.js";
import type { Song, UUID } from "../../types";
import styles from "./SongPage.module.css";
import { MainLayout } from "../../components/index.js";
import { useAsyncData } from "../../hooks/useAsyncData";

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  // FIX LATER
  if (!id) {
    return <div>Invalid song ID</div>;
  }

  const { data, loading, error } = useAsyncData(
    {
      song: () =>
        songApi.getSongById(id, {
          includeAlbum: true,
          includeArtists: true,
          includeLikes: true,
        }),
    },
    [id],
    { cacheKey: `song_${id}`, hasBlobUrl: true }
  );

  const song = data?.song;

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
        <title>{song ? `${song.title} - Music App` : "Loading..."}</title>
      </Helmet>
      <MainLayout>
        {loading ? (
          <div>Loading..</div>
        ) : (
          <div>
            {song.title}
            <img src={song.image_url!} alt={song.title} />
            <audio
              controls
              src={song.audio_url}
              className={styles.audioPlayer}
            ></audio>
          </div>
        )}
      </MainLayout>
    </>
  );
};

export default SongPage;
