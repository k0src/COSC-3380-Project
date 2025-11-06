import { query } from "@config/database.js";

export default class TokenBlacklistManager {
  /**
   * Adds a token JTI to the blacklist
   * @param jti The JWT ID to blacklist
   * @param expiresAt When the token expires
   */
  static async addToBlacklist(jti: string, expiresAt: Date): Promise<void> {
    try {
      await query(
        `INSERT INTO jwt_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING`,
        [jti, expiresAt]
      );
    } catch (err) {
      console.error("Failed to add token to blacklist:", err);
      throw new Error("Failed to blacklist token");
    }
  }

  /**
   * Checks if a token JTI is blacklisted
   * @param jti The JWT ID to check
   * @returns True if blacklisted
   */
  static async isBlacklisted(jti: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT 1 FROM jwt_blacklist WHERE token = $1 LIMIT 1`,
        [jti]
      );
      return result.length > 0;
    } catch (err) {
      console.error("Failed to check token blacklist:", err);
      return false;
    }
  }

  /**
   * Removes expired tokens from the blacklist
   * @returns Number of removed tokens
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM jwt_blacklist 
         WHERE expires_at < NOW()
         RETURNING id`
      );

      return result.length;
    } catch (err) {
      console.error("Failed to cleanup expired blacklist entries:", err);
      return 0;
    }
  }

  /**
   * Adds multiple token JTIs to the blacklist
   * @param jtis Array of JWT IDs to blacklist
   */
  static async addMultipleToBlacklist(
    jtis: string[],
    expiresAt: Date
  ): Promise<void> {
    if (jtis.length === 0) return;

    try {
      const values = jtis
        .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
        .join(", ");
      const params = jtis.flatMap((jti) => [jti, expiresAt]);
      await query(
        `INSERT INTO jwt_blacklist (token, expires_at) VALUES ${values} ON CONFLICT (token) DO NOTHING`,
        params
      );
    } catch (err) {
      console.error("Failed to add multiple tokens to blacklist:", err);
      throw new Error("Failed to blacklist tokens");
    }
  }
}
