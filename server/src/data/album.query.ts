import { Album, UUID } from "@types";
import { query } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

// Query builder class for Albums
export default class AlbumQuery {
  private albumId: UUID;
  private includeSongs = false;
  private includeArtist = false;
  private includeRuntime = false;

  private constructor(albumId: UUID) {
    this.albumId = albumId;
  }

  // Get the album
  static getById(albumId: UUID): AlbumQuery {
    return new AlbumQuery(albumId);
  }

  // Chainable methods
  withSongs(): this {
    this.includeSongs = true;
    return this;
  }

  withArtist(): this {
    this.includeArtist = true;
    return this;
  }

  withRuntime(): this {
    this.includeRuntime = true;
    return this;
  }

  // Executes queries, builds object
  async exec(): Promise<Album | null> {
    const album =
      (await query("SELECT * FROM albums WHERE id = $1", [this.albumId]))[0] ??
      null;

    if (!album) return null;

    album.image_url = album.image_url ? getBlobUrl(album.image_url) : null;

    if (this.includeSongs) {
      const songs = await query("SELECT * FROM songs WHERE album_id = $1", [
        this.albumId,
      ]);

      if (songs) {
        for (const song of songs) {
          song.image_url = song.image_url ? getBlobUrl(song.image_url) : null;
          song.audio_url = song.audio_url ? getBlobUrl(song.audio_url) : null;
        }

        album.songs = songs;
      }
    }

    // join on users for artists - get pfp
    if (this.includeArtist) {
      const artist = await query(
        `SELECT ar.* 
        FROM artists ar 
        JOIN albums al ON al.created_by = ar.id
        WHERE al.id = $1`,
        [this.albumId]
      );

      if (artist) {
        album.artists = artist[0];
      }
    }

    if (this.includeRuntime) {
      const runtime = await query(
        "SELECT SUM(duration) FROM songs WHERE album_id = $1",
        [this.albumId]
      );

      if (runtime) {
        album.runtime = runtime[0].sum ?? 0;
      }
    }

    return album;
  }
}
