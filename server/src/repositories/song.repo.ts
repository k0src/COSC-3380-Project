import { Song, UUID } from "@types";
import { query } from "../config/database.js";

export default class SongRepository {
  static async getById(id: UUID): Promise<Song | null> {
    try {
      const song = await query("SELECT * FROM songs WHERE id = $1", [id]);
      return song.length ? (song[0] as Song) : null;
    } catch (error) {
      console.error("Error fetching song by ID:", error);
      throw new Error("Failed to fetch song by ID");
    }
  }
}
