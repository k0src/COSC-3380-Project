import { User, UUID } from "@types";
import { PlaylistRepository as Playlist } from "@repositories";
import { FollowService, HistoryService } from "@services";
import { query, withTransaction } from "../config/database.js";
import { getBlobUrl } from "../config/blobStorage.js";

export default class UserRepository {
  /* ----------------------------- HELPER METHODS ----------------------------- */

  private static async getPlaylists(user: User) {
    const playlistIds = await query(
      `SELECT id FROM playlists WHERE created_by = $1 ORDER BY created_at DESC`,
      [user.id]
    );

    if (playlistIds && playlistIds.length > 0) {
      if (!user.playlists) {
        user.playlists = [];
      }
      for (const { id } of playlistIds) {
        const playlist = await Playlist.getOne(id, {
          includeSongs: true,
          includeLikes: true,
        });
        if (playlist) {
          user.playlists.push(playlist);
        }
      }
    }
  }

  /* ------------------------------ MAIN METHODS ------------------------------ */

  /**
   * Creates a new user.
   * @param userData - The data for the new song.
   * @param userData.username - The username of the user.
   * @param userData.email - The email of the user.
   * @param userData.password_hash - The hashed password of the user (optional).
   * @param userData.authenticated_with - The authentication method used.
   * @param userData.role - The role of the user.
   * @param userData.profile_picture_url - The profile picture URL of the user (optional).
   * @returns The created user, or null if creation fails.
   * @throws Will throw an error if the database query fails.
   */
  static async create({
    username,
    email,
    password_hash,
    authenticated_with,
    role,
    profile_picture_url,
  }: {
    username: string;
    email: string;
    password_hash?: string;
    authenticated_with: string;
    role: string;
    profile_picture_url?: string;
  }): Promise<User | null> {
    try {
      const result = await query(
        `INSERT INTO users 
          (username, email, password_hash, authenticated_with, 
          role, profile_picture_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          username,
          email,
          password_hash,
          authenticated_with,
          role,
          profile_picture_url,
        ]
      );

      return result[0] ?? null;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Updates a user.
   * @param id - The ID of the user to update.
   * @param userData - The new data for the user.
   * @param userData.username - The new username of the user (optional).
   * @param userData.email - The new email of the user (optional).
   * @param userData.password_hash - The new hashed password of the user (optional).
   * @param userData.authenticated_with - The new authentication method used (optional).
   * @param userData.role - The new role of the user (optional).
   * @param userData.profile_picture_url - The new profile picture URL of the user (optional).
   * @returns The updated user, or null if the update fails.
   * @throws Error if no fields are provided to update or if the database query fails.
   */
  static async update(
    id: UUID,
    {
      username,
      email,
      password_hash,
      authenticated_with,
      role,
      profile_picture_url,
    }: {
      username?: string;
      email?: string;
      password_hash?: string;
      authenticated_with?: string;
      role?: string;
      profile_picture_url?: string;
    }
  ): Promise<User | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (username !== undefined) {
        fields.push(`username = $${values.length + 1}`);
        values.push(username);
      }
      if (email !== undefined) {
        fields.push(`email = $${values.length + 1}`);
        values.push(email);
      }
      if (password_hash !== undefined) {
        fields.push(`password_hash = $${values.length + 1}`);
        values.push(password_hash);
      }
      if (authenticated_with !== undefined) {
        fields.push(`authenticated_with = $${values.length + 1}`);
        values.push(authenticated_with);
      }
      if (role !== undefined) {
        fields.push(`role = $${values.length + 1}`);
        values.push(role);
      }
      if (profile_picture_url !== undefined) {
        fields.push(`profile_picture_url = $${values.length + 1}`);
        values.push(profile_picture_url);
      }
      if (fields.length === 0) {
        throw new Error("No fields provided to update.");
      }

      values.push(id);

      const result = await withTransaction(async (client) => {
        const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = $${
          values.length
        } RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows[0] ?? null;
      });

      return result;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Deletes a user.
   * @param id - The ID of the user to delete.
   * @returns The deleted user, or null if the deletion fails.
   * @throws Will throw an error if the database query fails.
   */
  static async delete(id: UUID): Promise<User | null> {
    try {
      const res = await withTransaction(async (client) => {
        const del = await client.query(
          `DELETE FROM users WHERE id = $1 RETURNING *`,
          [id]
        );
        return del.rows[0] ?? null;
      });

      return res;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
   * Gets a single user by ID.
   * @param id - The ID of the user to get.
   * @param options - Options for including related data.
   * @param options.includePlaylists - Option to include the user's playlists.
   * @returns The user, or null if not found.
   * @throws Will throw an error if the database query fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includePlaylists?: boolean;
    }
  ): Promise<User | null> {
    try {
      const res = await query(`SELECT * FROM users WHERE id = $1`, [id]);

      if (!res || res.length === 0) {
        return null;
      }

      let user: User = res[0];

      if (user.profile_picture_url) {
        user.profile_picture_url = getBlobUrl(user.profile_picture_url);
      }

      if (options?.includePlaylists) {
        await this.getPlaylists(user);
      }

      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  /**
   * Gets multiple users.
   * @param options - Options for pagination and including related data.
   * @param options.includePlaylists - Option to include the user's playlists.
   * @param options.limit - Maximum number of users to return.
   * @param options.offset - Number of users to skip.
   * @returns A list of users.
   * @throws Will throw an error if the database query fails.
   */
  static async getMany(options?: {
    includePlaylists?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    {
      try {
        let baseQuery = "SELECT * FROM users ORDER BY created_at DESC";
        const params: any[] = [];

        if (options?.limit) {
          baseQuery += ` LIMIT $${params.length + 1}`;
          params.push(options.limit);

          if (options?.offset) {
            baseQuery += ` OFFSET $${params.length + 1}`;
            params.push(options.offset);
          }
        }

        const users = await query(baseQuery, params);

        if (!users || users.length === 0) {
          return [];
        }

        const processedUsers = await Promise.all(
          users.map(async (user) => {
            if (user.profile_picture_url) {
              user.profile_picture_url = getBlobUrl(user.profile_picture_url);
            }

            if (options?.includePlaylists) {
              await this.getPlaylists(user);
            }

            return user;
          })
        );

        return processedUsers;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    }
  }

  /**
   * Gets a user by their username.
   * @param username - The username of the user to fetch.
   * @returns The user, or null if not found.
   * @throws Error if the database query fails.
   */
  static async getByUsername(username: string): Promise<User | null> {
    try {
      const res = await query(`SELECT * FROM users WHERE username = $1`, [
        username,
      ]);
      if (!res || res.length === 0) {
        return null;
      }

      let user: User = res[0];

      if (user.profile_picture_url) {
        user.profile_picture_url = getBlobUrl(user.profile_picture_url);
      }

      return user;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      throw error;
    }
  }

  /**
   * Gets a user by their email.
   * @param email - The email of the user to fetch.
   * @return The user, or null if not found.
   * @throws Error if the database query fails.
   */
  static async getByEmail(email: string): Promise<User | null> {
    try {
      const res = await query(`SELECT * FROM users WHERE email = $1`, [email]);
      if (!res || res.length === 0) {
        return null;
      }

      let user: User = res[0];

      if (user.profile_picture_url) {
        user.profile_picture_url = getBlobUrl(user.profile_picture_url);
      }

      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }
}

//get by username/email
//get playlists
//get liked...
//get history...
//get following
