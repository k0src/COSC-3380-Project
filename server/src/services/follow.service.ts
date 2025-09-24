import type { User, UUID } from "@types";
import { query } from "../config/database.js";

export default class FollowService {
  /**
   * Follow a user
   * @param followerId The ID of the follower
   * @param followingId The ID of the user to be followed
   * @throws Error if the operation fails
   */
  static async followUser(followerId: UUID, followingId: UUID) {
    try {
      await query(
        `INSERT INTO user_followers (follower_id, following_id) 
        VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [followerId, followingId]
      );
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @param followerId The ID of the follower
   * @param followingId The ID of the user to be unfollowed
   * @throws Error if the operation fails
   */
  static async unfollowUser(followerId: UUID, followingId: UUID) {
    try {
      await query(
        `DELETE FROM user_followers 
        WHERE follower_id = $1 AND following_id = $2`,
        [followerId, followingId]
      );
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  }

  /**
   * Get a list of followers for a user
   * @param userId The ID of the user
   * @returns A list of users who follow the specified user
   * @throws Error if the operation fails
   */
  static async getFollowers(userId: UUID): Promise<User[]> {
    try {
      const res = await query(
        `SELECT u.* FROM users u
        JOIN user_followers uf ON u.id = uf.follower_id
        WHERE uf.following_id = $1`,
        [userId]
      );
      return res;
    } catch (error) {
      console.error("Error getting followers:", error);
      throw error;
    }
  }

  /**
   * Get a list of users that a user is following
   * @param userId The ID of the user
   * @returns A list of users that the user is following
   * @throws Error if the operation fails
   */
  static async getFollowing(userId: UUID): Promise<User[]> {
    try {
      const res = await query(
        `SELECT u.* FROM users u
        JOIN user_followers uf ON u.id = uf.following_id
        WHERE uf.follower_id = $1`,
        [userId]
      );
      return res;
    } catch (error) {
      console.error("Error getting following:", error);
      throw error;
    }
  }

  /**
   * Check if a user is following another user
   * @param followerId The ID of the follower user
   * @param followingId The ID of the following user
   * @returns True if the follower is following the user, false otherwise
   * @throws Error if the operation fails
   */
  static async isFollowing(
    followerId: UUID,
    followingId: UUID
  ): Promise<boolean> {
    try {
      const res = await query(
        `SELECT 1 FROM user_followers 
        WHERE follower_id = $1 AND following_id = $2`,
        [followerId, followingId]
      );
      return res.length > 0;
    } catch (error) {
      console.error("Error checking follow status:", error);
      throw error;
    }
  }

  /**
   * Get the number of followers for a user
   * @param userId The ID of the user
   * @return The number of followers
   * @throws Error if the operation fails
   */
  static async getFollowerCount(userId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM user_followers 
        WHERE following_id = $1`,
        [userId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error getting follower count:", error);
      throw error;
    }
  }

  /**
   * Get the number of users a user is following
   * @param userId The ID of the user
   * @return The number of users the user is following
   * @throws Error if the operation fails
   */
  static async getFollowingCount(userId: UUID): Promise<number> {
    try {
      const res = await query(
        `SELECT COUNT(*) FROM user_followers 
        WHERE follower_id = $1`,
        [userId]
      );
      return parseInt(res[0]?.count ?? "0", 10);
    } catch (error) {
      console.error("Error getting following count:", error);
      throw error;
    }
  }

  /**
   * Get mutual followers between two users
   * @param userId1 The ID of the first user
   * @param userId2 The ID of the second user
   * @return A list of users who follow both userId1 and userId2
   * @throws Error if the operation fails
   */
  static async getMutualFollowers(
    userId1: UUID,
    userId2: UUID
  ): Promise<User[]> {
    try {
      const res = await query(
        `SELECT u.* FROM users u
        JOIN user_followers uf1 ON u.id = uf1.follower_id
        JOIN user_followers uf2 ON u.id = uf2.follower_id
        WHERE uf1.following_id = $1 AND uf2.following_id = $2`,
        [userId1, userId2]
      );
      return res;
    } catch (error) {
      console.error("Error getting mutual followers:", error);
      throw error;
    }
  }
}
