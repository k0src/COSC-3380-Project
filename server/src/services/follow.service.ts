import type { User, UUID, UserOrderByColumn, OrderByDirection } from "@types";
import { notDeletedCondition } from "@util";
import { query } from "@config/database.js";
import { getBlobUrl } from "@config/blobStorage";

export default class FollowService {
  static async toggleFollow(
    followerId: UUID,
    followingId: UUID
  ): Promise<string> {
    try {
      const res = await query(`SELECT action FROM toggle_user_follow($1, $2)`, [
        followerId,
        followingId,
      ]);
      return res[0]?.action ?? null;
    } catch (error) {
      console.error("Error toggle follow:", error);
      throw error;
    }
  }

  static async getFollowers(
    userId: UUID,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<User[]> {
    try {
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
        SELECT u.*
        FROM users u
        JOIN user_followers uf ON u.id = uf.follower_id
        WHERE uf.following_id = $1 
          AND u.status = 'ACTIVE'
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const followers = await query(sql, [userId, limit, offset]);
      const processedFollowers = followers.map((follower) => {
        if (follower.profile_picture_url) {
          follower.profile_picture_url = getBlobUrl(
            follower.profile_picture_url
          );
        }
        return follower;
      });

      return processedFollowers;
    } catch (error) {
      console.error("Error getting followers:", error);
      throw error;
    }
  }

  static async getFollowing(
    userId: UUID,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<User[]> {
    try {
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
        SELECT u.*
        FROM users u
        JOIN user_followers uf ON u.id = uf.following_id
        WHERE uf.follower_id = $1
          AND u.status = 'ACTIVE'
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $2 OFFSET $3
      `;

      const following = await query(sql, [userId, limit, offset]);
      const processedFollowing = following.map((followedUser) => {
        if (followedUser.profile_picture_url) {
          followedUser.profile_picture_url = getBlobUrl(
            followedUser.profile_picture_url
          );
        }
        return followedUser;
      });

      return processedFollowing;
    } catch (error) {
      console.error("Error getting following:", error);
      throw error;
    }
  }

  static async isFollowing(
    followerId: UUID,
    followingId: UUID
  ): Promise<boolean> {
    try {
      const res = await query(
        `SELECT 1 FROM user_followers 
        WHERE follower_id = $1 
        AND following_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = following_id
        )
        LIMIT 1`,
        [followerId, followingId]
      );
      return res.length > 0;
    } catch (error) {
      console.error("Error checking follow status:", error);
      throw error;
    }
  }

  static async getFollowerCount(userId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM user_followers 
        WHERE following_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = follower_id
        )`,
        [userId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error getting follower count:", error);
      throw error;
    }
  }

  static async getFollowingCount(userId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM user_followers 
        WHERE follower_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = following_id
        )`,
        [userId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error getting following count:", error);
      throw error;
    }
  }

  static async getMutualFollowers(
    userId1: UUID,
    userId2: UUID,
    options?: {
      orderByColumn?: UserOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<User[]> {
    try {
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
        SELECT DISTINCT u.*
        FROM users u
        JOIN user_followers uf1 ON u.id = uf1.follower_id
        JOIN user_followers uf2 ON u.id = uf2.follower_id
        WHERE uf1.following_id = $1 
          AND uf2.following_id = $2
          AND u.status = 'ACTIVE'
          AND ${notDeletedCondition("user", "u")}
        ORDER BY ${orderBySQL} ${orderByDirection}
        LIMIT $3 OFFSET $4
      `;

      const res = await query(sql, [userId1, userId2, limit, offset]);
      const processedUsers = res.map((user) => {
        if (user.profile_picture_url) {
          user.profile_picture_url = getBlobUrl(user.profile_picture_url);
        }
        return user;
      });

      return processedUsers;
    } catch (error) {
      console.error("Error getting mutual followers:", error);
      throw error;
    }
  }
}
