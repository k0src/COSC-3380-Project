import {
  User,
  Playlist,
  UUID,
  AccessContext,
  UserOrderByColumn,
  OrderByDirection,
  PlaylistOrderByColumn,
} from "@types";
import { query, withTransaction } from "@config/database";
import { getBlobUrl } from "@config/blobStorage";
import {
  notDeletedCondition,
  getUserVisibilityCondition,
  getVisibilityCondition,
  isDeleted,
} from "@util";
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
    pfp_blurhash,
    role,
  }: {
    username: string;
    email: string;
    password: string;
    profile_picture_url?: string;
    pfp_blurhash?: string;
    role?: string;
  }): Promise<User | null> {
    try {
      const result = withTransaction(async (client) => {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
        const password_hash = await bcrypt.hash(password, saltRounds);

        const insertSql = `
          INSERT INTO users (
            username, 
            email, 
            password_hash, 
            authenticated_with, 
            profile_picture_url, 
            pfp_blurhash, 
            role, 
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`;

        const insertParams = [
          username,
          email,
          password_hash,
          "CoogMusic",
          profile_picture_url,
          pfp_blurhash,
          role || "USER",
          "ACTIVE",
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
      if (!id) {
        throw new Error("User ID is required");
      }
      const userDeleted = await isDeleted(id, "user");
      if (userDeleted) {
        throw new Error("Cannot update a deleted user.");
      }

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
      if (
        new_password !== undefined &&
        typeof new_password === "string" &&
        new_password.trim() === ""
      ) {
        throw new Error("New password cannot be empty");
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

          const userRes = await client.query(
            `SELECT * FROM users WHERE id = $1`,
            [id]
          );

          const user: User = userRes.rows[0];
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
  static async delete(id: UUID) {
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO deleted_users
          (user_id, deleted_at) VALUES ($1, NOW())`,
          [id]
        );
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  static async getUser(
    id: UUID,
    accessContext: AccessContext
  ): Promise<User | null> {
    try {
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const sql = `
      SELECT 
        u.*,
        (
          SELECT COUNT(*)
          FROM user_followers uf
          WHERE uf.following_id = u.id
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du 
              WHERE du.user_id = uf.follower_id
            )
        ) AS follower_count,
        (
          SELECT COUNT(*)
          FROM user_followers uf
          WHERE uf.follower_id = u.id
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du 
              WHERE du.user_id = uf.following_id
            )
        ) AS following_count
      FROM users u
      WHERE u.id = $1
        AND ${notDeletedCondition("user", "u")}
        AND ${userVisibility}
      LIMIT 1
    `;

      const res = await query(sql, [id]);
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
  static async getManyUsers(
    accessContext: AccessContext,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<User[]> {
    try {
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<UserOrderByColumn, string> = {
        username: "u.username",
        role: "u.role",
        created_at: "u.created_at",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
      SELECT 
        u.*,
        (
          SELECT COUNT(*)
          FROM user_followers uf
          WHERE uf.following_id = u.id
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du 
              WHERE du.user_id = uf.follower_id
            )
        ) AS follower_count,
        (
          SELECT COUNT(*)
          FROM user_followers uf
          WHERE uf.follower_id = u.id
            AND NOT EXISTS (
              SELECT 1 FROM deleted_users du 
              WHERE du.user_id = uf.following_id
            )
        ) AS following_count
        
      FROM users u
      WHERE ${notDeletedCondition("user", "u")}
        AND ${userVisibility}
      ORDER BY ${orderBySQL} ${orderByDirection}
      LIMIT $1 OFFSET $2
    `;

      const res = await query(sql, [limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const users: User[] = res.map((user) => {
        if (user.profile_picture_url) {
          user.profile_picture_url = getBlobUrl(user.profile_picture_url);
        }

        return user;
      });

      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  static async getByUsername(username: string): Promise<User | null> {
    try {
      const res = await query(
        `SELECT * FROM users WHERE username = $1
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du 
          WHERE du.user_id = users.id
        )`,
        [username]
      );
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
      const res = await query(
        `SELECT * FROM users WHERE email = $1
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = users.id
        )`,
        [email]
      );
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
    options?: {
      orderByColumn?: PlaylistOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<Playlist[]> {
    try {
      const playlistVisibility = getVisibilityCondition(
        "p",
        "visibility_status",
        "owner_id",
        accessContext
      );
      const userVisibility = getUserVisibilityCondition("u", accessContext);

      const orderByColumn = options?.orderByColumn || "created_at";
      const orderByDirection = options?.orderByDirection || "DESC";
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const orderByMap: Record<PlaylistOrderByColumn, string> = {
        title: "p.title",
        created_at: "p.created_at",
        likes: "likes",
        runtime: "runtime",
        song_count: "song_count",
      };

      const orderBySQL = orderByMap[orderByColumn];

      const sql = `
        SELECT 
          p.*,
          (
            SELECT row_to_json(user_data)
            FROM (
              SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_picture_url,
                u.pfp_blurhash,
                u.role,
                u.is_private,
                u.status,
                u.artist_id,
                u.created_at,
                u.updated_at
              FROM users u
              WHERE u.id = p.owner_id
                AND ${notDeletedCondition("user", "u")}
                AND ${userVisibility}
            ) AS user_data
          ) AS user,
          (
            SELECT COUNT(*)
            FROM playlist_likes pl
            WHERE pl.playlist_id = p.id
          ) AS likes,
          (
            SELECT COUNT(*)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_count,
          (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM songs s
            JOIN playlist_songs ps ON ps.song_id = s.id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS runtime,
          (
            SELECT json_agg(ps.song_id ORDER BY ps.position)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id
              AND ${notDeletedCondition("song", "s")}
          ) AS song_ids,
          (
            SELECT EXISTS (
              SELECT 1
              FROM playlist_songs ps
              JOIN songs s ON s.id = ps.song_id
              WHERE ps.playlist_id = p.id
                AND ${notDeletedCondition("song", "s")}
            )
          ) AS has_song
        FROM playlists p
        WHERE p.owner_id = $1
          AND ${notDeletedCondition("playlist", "p")}
          AND ${playlistVisibility}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const res = await query(sql, [userId, limit, offset]);
      if (!res || res.length === 0) {
        return [];
      }

      const playlists: Playlist[] = res.map((playlist) => {
        if (playlist.user?.profile_picture_url) {
          playlist.user.profile_picture_url = getBlobUrl(
            playlist.user.profile_picture_url
          );
        }

        if (playlist.image_url) {
          playlist.image_url = getBlobUrl(playlist.image_url);
        } else if ((playlist as any).has_song) {
          playlist.image_url = `${API_URL}/playlists/${playlist.id}/cover-image`;
        }

        delete (playlist as any).has_song;
        playlist.type = "playlist";

        return playlist;
      });

      return playlists;
    } catch (error) {
      console.error("Error fetching user playlists:", error);
      throw error;
    }
  }
  static async getUserCount(): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM users
        WHERE NOT EXISTS (
          SELECT 1 FROM deleted_users du 
          WHERE du.user_id = users.id
        )`
      );
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
        `SELECT * FROM users 
        WHERE email = $1 
        AND authenticated_with = 'CoogMusic'
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = users.id
        )`,
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
}
