import type { User, UUID } from "@types";
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
    options?: { limit?: number; offset?: number }
  ): Promise<User[]> {
    try {
      const params = [userId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT u.* FROM users u
        JOIN user_followers uf ON u.id = uf.follower_id
        WHERE uf.following_id = $1 
        AND u.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = u.id
        )
        LIMIT $2 OFFSET $3
      `;

      const followers = await query(sql, params);

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
    options?: { limit?: number; offset?: number }
  ): Promise<User[]> {
    try {
      const params = [userId, options?.limit || 50, options?.offset || 0];
      const sql = `
        SELECT u.* FROM users u
        JOIN user_followers uf ON u.id = uf.following_id
        WHERE uf.follower_id = $1
        AND u.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = u.id
        )
        LIMIT $2 OFFSET $3
      `;

      const following = await query(sql, params);

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
    options?: { limit?: number; offset?: number }
  ): Promise<User[]> {
    try {
      const params = [
        userId1,
        userId2,
        options?.limit || 50,
        options?.offset || 0,
      ];
      const sql = `
        SELECT DISTINCT u.* FROM users u
        JOIN user_followers uf1 ON u.id = uf1.follower_id
        JOIN user_followers uf2 ON u.id = uf2.follower_id
        WHERE uf1.following_id = $1 AND uf2.following_id = $2
        AND u.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM deleted_users du
          WHERE du.user_id = u.id
        )
        LIMIT $3 OFFSET $4`;
      const res = await query(sql, params);
      return res;
    } catch (error) {
      console.error("Error getting mutual followers:", error);
      throw error;
    }
  }
}
