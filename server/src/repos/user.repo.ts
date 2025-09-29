import { User, Playlist, UUID } from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";

export default class UserRepository {
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
   * @throws Error if the operation fails.
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
   * @throws Error if the operation fails.
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
   * @throws Error if the operation fails.
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
   * @param options.includeFollowerCount - Option to include the follower count.
   * @param options.includeFollowingCount - Option to include the following count.
   * @returns The user, or null if not found.
   * @throws Error if the operation fails.
   */
  static async getOne(
    id: UUID,
    options?: {
      includeFollowerCount?: boolean;
      includeFollowingCount?: boolean;
    }
  ): Promise<User | null> {
    try {
      const sql = `
        SELECT u.*,
        CASE WHEN $1 THEN (SELECT COUNT(*) FROM user_followers uf
          WHERE uf.following_id = u.id) 
        ELSE NULL END AS follower_count,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM user_followers uf
          WHERE uf.follower_id = u.id)
        ELSE NULL END AS following_count
        FROM users u
        WHERE u.id = $3
      `;

      const params = [
        options?.includeFollowerCount ?? false,
        options?.includeFollowingCount ?? false,
        id,
      ];

      const res = await query(sql, params);
      if (!res || res.length === 0) {
        return null;
      }

      const user: User = res[0];
      if (user.profile_picture_url) {
        user.profile_picture_url = getBlobUrl(user.profile_picture_url);
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
   * @param options.includeFollowerCount - Option to include the follower count.
   * @param options.includeFollowingCount - Option to include the following count.
   * @param options.limit - Maximum number of users to return.
   * @param options.offset - Number of users to skip.
   * @returns A list of users.
   * @throws Error if the operation fails.
   */
  static async getMany(options?: {
    includeFollowerCount?: boolean;
    includeFollowingCount?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT u.*,
        CASE WHEN $1 THEN (SELECT COUNT(*) FROM user_followers uf
          WHERE uf.following_id = u.id) 
        ELSE NULL END AS follower_count,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM user_followers uf
          WHERE uf.follower_id = u.id)
        ELSE NULL END AS following_count
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT $3 OFFSET $4
      `;

      const params = [
        options?.includeFollowerCount ?? false,
        options?.includeFollowingCount ?? false,
        limit,
        offset,
      ];

      const users = await query(sql, params);
      if (!users || users.length === 0) {
        return [];
      }

      const processedUsers = await Promise.all(
        users.map(async (user: User) => {
          if (user.profile_picture_url) {
            user.profile_picture_url = getBlobUrl(user.profile_picture_url);
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

  /**
   * Gets a user by their username.
   * @param username - The username of the user to fetch.
   * @returns The user, or null if not found.
   * @throws Error if the operation fails.
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
   * @throws Error if the operation fails.
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

  /**
   * Gets the playlists created by a user.
   * @param userId - The ID of the user.
   * @param options - Options for pagination.
   * @param options.includeLikes - Option to include the like count for each playlist.
   * @param options.includeSongCount - Option to include the total number of songs on each playlist.
   * @param options.limit - Maximum number of playlists to return.
   * @param options.offset - Number of playlists to skip.
   * @return A list of playlists created by the user.
   * @throws Error if the operation fails.
   */
  static async getPlaylists(
    userId: UUID,
    options?: {
      includeLikes?: boolean;
      includeSongCount?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;

      const sql = `
        SELECT p.*,
        CASE WHEN $1 THEN (SELECT COUNT(*) FROM playlist_likes pl 
          WHERE pl.playlist_id = p.id)
        ELSE NULL END as likes,
        CASE WHEN $2 THEN (SELECT COUNT(*) FROM playlist_songs ps
          WHERE ps.playlist_id = p.id)
        ELSE NULL END as song_count
        FROM playlists p
        WHERE p.created_by = $3
        ORDER BY p.created_at DESC
        LIMIT $4 OFFSET $5
      `;

      const params = [
        options?.includeLikes ?? false,
        options?.includeSongCount ?? false,
        userId,
        limit,
        offset,
      ];

      const res = await query(sql, params);
      return res;
    } catch (error) {
      console.error("Error fetching user playlists:", error);
      throw error;
    }
  }

  /**
   * Counts the total number of users.
   * @return The total number of users.
   * @throws Error if the operation fails.
   */
  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM users");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting users:", error);
      throw error;
    }
  }
}
