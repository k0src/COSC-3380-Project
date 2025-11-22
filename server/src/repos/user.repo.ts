import { User, Playlist, UUID, AccessContext, PlaylistOptions } from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";
import { getAccessPredicate } from "@util";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL;

export default class UserRepository {
  static async create({
    username,
    email,
    password,
    profile_picture_url,
    role,
  }: {
    username: string;
    email: string;
    password: string;
    profile_picture_url?: string;
    role?: string;
  }): Promise<User | null> {
    try {
      const result = withTransaction(async (client) => {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
        const password_hash = await bcrypt.hash(password, saltRounds);

        const insertSql = `
          INSERT INTO users (
              username, email, password_hash, 
              authenticated_with, profile_picture_url, role
            )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`;

        const insertParams = [
          username,
          email,
          password_hash,
          "CoogMusic",
          profile_picture_url,
          role,
        ];

        const res = await client.query(insertSql, insertParams);

        if (res && res.rows.length > 0) {
          const user: User = res.rows[0];
          await client.query(
            `INSERT INTO user_settings (user_id) VALUES ($1)`,
            [user.id]
          );
          return user;
        }

        return null;
      });
      return result;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async update(
    id: UUID,
    {
      username,
      email,
      new_password,
      current_password,
      authenticated_with,
      role,
      profile_picture_url,
      pfp_blurhash,
      artist_id,
      status,
      is_private,
    }: {
      username?: string;
      email?: string;
      new_password?: string;
      current_password?: string;
      authenticated_with?: string;
      role?: string;
      profile_picture_url?: string;
      pfp_blurhash?: string;
      artist_id?: UUID;
      status?: string;
      is_private?: boolean;
    }
  ): Promise<User | null> {
    try {
      if (
        username !== undefined &&
        typeof username === "string" &&
        username.trim() === ""
      ) {
        throw new Error("Username cannot be empty");
      }
      if (
        email !== undefined &&
        typeof email === "string" &&
        email.trim() === ""
      ) {
        throw new Error("Email cannot be empty");
      }

      const result = await withTransaction(async (client) => {
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
        if (new_password !== undefined) {
          if (!current_password) {
            throw new Error(
              "Current password is required to set a new password."
            );
          }

          const user = await UserRepository.getOne(id);
          if (!user || !user.password_hash) {
            throw new Error("User not found or has no password set.");
          }

          const isValid = await bcrypt.compare(
            current_password,
            user.password_hash
          );
          if (!isValid) {
            throw new Error("Current password is incorrect.");
          }

          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
          const new_password_hash = await bcrypt.hash(new_password, saltRounds);

          fields.push(`password_hash = $${values.length + 1}`);
          values.push(new_password_hash);
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
        if (pfp_blurhash !== undefined) {
          fields.push(`pfp_blurhash = $${values.length + 1}`);
          values.push(pfp_blurhash);
        }
        if (artist_id !== undefined) {
          fields.push(`artist_id = $${values.length + 1}`);
          values.push(artist_id);
        }
        if (status !== undefined) {
          fields.push(`status = $${values.length + 1}`);
          values.push(status);
        }
        if (is_private !== undefined) {
          fields.push(`is_private = $${values.length + 1}`);
          values.push(is_private);
        }
        if (fields.length === 0) {
          throw new Error("No fields provided to update.");
        }

        values.push(id);

        const sql = `UPDATE users SET ${fields.join(
          ", "
        )}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
        const res = await client.query(sql, values);
        const updatedUser = res.rows[0] ?? null;

        if (updatedUser && updatedUser.profile_picture_url) {
          updatedUser.profile_picture_url = getBlobUrl(
            updatedUser.profile_picture_url
          );
        }

        return updatedUser;
      });

      return result;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

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

  static async getPlaylists(
    userId: UUID,
    accessContext: AccessContext,
    options?: PlaylistOptions
  ): Promise<Playlist[]> {
    try {
      const { sql: predicateSqlRaw, params: predicateParams } =
        getAccessPredicate(accessContext, "p", 1);
      const predicateSql =
        (predicateSqlRaw && predicateSqlRaw.trim()) || "TRUE";

      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const orderByColumn = options?.orderByColumn ?? "created_at";
      const orderByDirection = options?.orderByDirection ?? "DESC";

      const orderByMap: Record<string, string> = {
        name: "p.name",
        created_at: "p.created_at",
        updated_at: "p.updated_at",
      };

      const sqlOrderByColumn = orderByMap[orderByColumn] ?? "p.created_at";

      const selectFields: string[] = [
        "p.*",
        "EXISTS(SELECT 1 FROM playlist_songs ps WHERE ps.playlist_id = p.id) as has_song",
      ];

      if (options?.includeLikes) {
        selectFields.push(
          "(SELECT COUNT(*) FROM playlist_likes pl WHERE pl.playlist_id = p.id) AS likes"
        );
      }

      if (options?.includeSongCount) {
        selectFields.push(
          "(SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) AS song_count"
        );
      }

      if (options?.includeRuntime) {
        selectFields.push(
          `(SELECT COALESCE(SUM(s.duration), 0) FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id) AS runtime`
        );
      }

      const limitIndex = predicateParams.length + 2;
      const offsetIndex = predicateParams.length + 3;

      const sql = `
        SELECT ${selectFields.join(",\n")}
        FROM playlists p
        WHERE p.owner_id = $1 AND (${predicateSql})
        ORDER BY ${sqlOrderByColumn} ${orderByDirection}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const params = [userId, ...predicateParams, limit, offset];

      const playlists = await query(sql, params);
      if (!playlists || playlists.length === 0) {
        return [];
      }

      const processedPlaylists = playlists.map((playlist: Playlist) => {
        if (playlist.image_url) {
          playlist.image_url = getBlobUrl(playlist.image_url);
        } else if ((playlist as any).has_song) {
          playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
        }
        delete (playlist as any).has_song;

        playlist.type = "playlist";
        return playlist;
      });

      return processedPlaylists;
    } catch (error) {
      console.error("Error fetching user playlists:", error);
      throw error;
    }
  }

  static async count(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM users");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting users:", error);
      throw error;
    }
  }

  static async validateCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    try {
      const result = await query(
        `SELECT * FROM users WHERE email = $1 AND authenticated_with = 'CoogMusic'`,
        [email]
      );

      if (!result || result.length === 0) {
        return null;
      }

      const user: User = result[0];
      if (!user.password_hash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return null;
      }

      if (user.profile_picture_url) {
        user.profile_picture_url = getBlobUrl(user.profile_picture_url);
      }

      return user;
    } catch (error) {
      console.error("Error validating credentials:", error);
      throw error;
    }
  }

  static async getUserCount(): Promise<number> {
    try {
      const res = await query("SELECT COUNT(*) FROM users");
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error counting users:", error);
      throw error;
    }
  }
}
