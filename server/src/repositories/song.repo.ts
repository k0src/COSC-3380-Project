import { Song, UUID } from "@types";
import { query } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

export default class SongRepository {
  static async getById(id: UUID): Promise<Song | null> {
    try {
      const song =
        (await query("SELECT * FROM songs WHERE id = $1", [id]))[0] ?? null;

      if (song) {
        song.image_url = getBlobUrl(song.image_url);
        song.audio_url = getBlobUrl(song.audio_url);
      }

      return song;
    } catch (error) {
      console.error("Error fetching song by ID:", error);
      throw new Error("Failed to fetch song by ID");
    }
  }
}
