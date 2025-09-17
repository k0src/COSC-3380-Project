import { Song, UUID } from "@types";
import { query } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

// Query builder class for fetching song details and related data
export default class SongQuery {
  private songId?: UUID;

  private includeArtists = false;
  private includeAlbum = false;
  private includeLikes = false;
  private includeComments = false;

  private limit?: number;
  private offset?: number;

  private constructor(songId?: UUID) {
    this.songId = songId;
  }

  // Get a single song by ID
  static getById(songId: UUID): SongQuery {
    return new SongQuery(songId);
  }

  // Get all songs
  static getAll(): SongQuery {
    return new SongQuery();
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

  // Pagination methods for multiple songs
  withLimit(limit: number): this {
    if (this.songId) {
      throw new Error(
        "Pagination is only supported queries that return multiple songs"
      );
    }
    this.limit = limit;
    return this;
  }

  withOffset(offset: number): this {
    if (this.songId) {
      throw new Error(
        "Pagination is only supported queries that return multiple songs"
      );
    }
    this.offset = offset;
    return this;
  }

  // Executes queries and builds object
  async exec(): Promise<Song | Song[] | null> {
    return this.songId === undefined ? this.execMultiple() : this.execSingle();
  }

  private async execSingle(): Promise<Song | null> {
    if (!this.songId) return null;

    const song =
      (await query("SELECT * FROM songs WHERE id = $1", [this.songId]))[0] ??
      null;

    if (!song) return null;

    return this.buildSong(song);
  }

  private async execMultiple(): Promise<Song[]> {
    let sql = "SELECT * FROM songs";
    const params: any[] = [];

    if (this.limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(this.limit);
    }

    if (this.offset) {
      sql += ` OFFSET $${params.length + 1}`;
      params.push(this.offset);
    }

    const songs = await query(sql, params);

    if (!songs || songs.length === 0) return [];

    const songData = await Promise.all(
      songs.map((song) => this.buildSong(song))
    );

    return songData;
  }

  private async buildSong(song: any): Promise<Song> {
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

    // join on users for artists
    if (this.includeArtists) {
      const artists = await query(
        `SELECT a.*, role FROM artists a
         JOIN song_artists sa ON a.id = sa.artist_id
         WHERE sa.song_id = $1`,
        [song.id]
      );

      if (artists) {
        song.artists = artists;
      }
    }

    if (this.includeLikes) {
      const likes = await query(
        "SELECT COUNT(*) AS likes FROM user_likes WHERE song_id = $1",
        [song.id]
      );

      if (likes) {
        song.likes = parseInt(likes[0].likes, 10) ?? 0;
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
        [song.id]
      );

      if (comments) {
        song.comments = comments;
      }
    }

    return song;
  }
}
