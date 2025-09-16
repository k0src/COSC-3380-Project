import { Song, UUID } from "@types";
import { query } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

// Query builder class for fetching song details and related data
export default class SongQuery {
  private songId: UUID;
  private includeArtists = false;
  private includeAlbum = false;
  private includeLikes = false;
  private includeComments = false;

  private constructor(songId: UUID) {
    this.songId = songId;
  }

  // Get the song
  static getById(songId: UUID): SongQuery {
    return new SongQuery(songId);
  }

  // Chainable methods
  withAlbum(): this {
    this.includeAlbum = true;
    return this;
  }

  withArtists(): this {
    this.includeArtists = true;
    return this;
  }

  withLikes(): this {
    this.includeLikes = true;
    return this;
  }

  withComments(): this {
    this.includeComments = true;
    return this;
  }

  // Executes queries and builds object
  async exec(): Promise<Song | null> {
    const song =
      (await query("SELECT * FROM songs WHERE id = $1", [this.songId]))[0] ??
      null;

    if (!song) return null;

    song.image_url = song.image_url ? getBlobUrl(song.image_url) : null;
    song.audio_url = song.audio_url ? getBlobUrl(song.audio_url) : null;

    if (this.includeAlbum && song.album_id) {
      const album = await query("SELECT * FROM albums WHERE id = $1", [
        song.album_id,
      ]);

      if (album) {
        song.album = album[0];
        song.album.image_url = song.album.image_url
          ? getBlobUrl(song.album.image_url)
          : null;
      }
    }

    if (this.includeArtists) {
      const artists = await query(
        `SELECT a.*, role FROM artists a
         JOIN song_artists sa ON a.id = sa.artist_id
         WHERE sa.song_id = $1`,
        [this.songId]
      );

      if (artists) {
        song.artists = artists;
      }
    }

    if (this.includeLikes) {
      const likes = await query(
        "SELECT user_id AS liked_by FROM user_likes WHERE song_id = $1 GROUP BY user_id",
        [this.songId]
      );

      if (likes) {
        song.likes = {
          liked_by: likes.map((like: any) => like.liked_by),
          total: likes.length,
        };
      }
    }

    if (this.includeComments) {
      const comments = await query(
        `SELECT 
          user_id,
          comment_text,
          users.username, 
          users.profile_picture_url 
        FROM song_comments
        JOIN users ON song_comments.user_id = users.id
        WHERE song_id = $1
        ORDER BY commented_at DESC`,
        [this.songId]
      );

      if (comments) {
        song.comments = comments;
      }
    }

    return song;
  }
}
