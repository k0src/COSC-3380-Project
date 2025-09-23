import { Playlist, UUID } from "@types";
import { query, withTransaction } from "../config/database";
import { getBlobUrl } from "config/blobStorage";

export default class PlaylistRepository {
  static async create({
    title,
    description,
    created_by,
  }: {
    title: string;
    description: string;
    created_by: UUID;
  }): Promise<Playlist | null> {
    try {
      const result = await query(
        `INSERT INTO playlists (title, description, created_by)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [title, description, created_by]
      );

      return result[0] ?? null;
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw error;
    }
  }

  static async update(
    id: UUID,
    {
      title,
      description,
      created_by,
    }: { title?: string; description?: string; created_by?: UUID }
  ): Promise<Playlist | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (title !== undefined) {
        fields.push(`title = $${values.length + 1}`);
        values.push(title);
      }
    } catch (error) {
      console.error("Error updating playlist:", error);
      throw error;
    }
  }
}
