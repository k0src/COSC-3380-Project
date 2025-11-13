import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshJti: string;
  expiresIn: string;
}

export function generateAccessToken(payload: {
  userId: string;
  email: string;
}): { token: string; jti: string } {
  if (!payload.userId || !payload.email) {
    throw new Error("userId and email are required for access token");
  }

  const jti = crypto.randomBytes(16).toString("hex");
  const signOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "coogmusic",
    audience: "coogmusic-users",
  } as SignOptions;

  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      type: "access",
      jti,
    },
    JWT_SECRET,
    signOptions
  );

  return { token, jti };
}

export function generateRefreshToken(payload: { userId: string }): {
  token: string;
  jti: string;
} {
  if (!payload.userId) {
    throw new Error("userId is required for refresh token");
  }

  const jti = crypto.randomBytes(16).toString("hex");
  const signOptions: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: "coogmusic",
    audience: "coogmusic-users",
  } as SignOptions;

  const token = jwt.sign(
    {
      userId: payload.userId,
      type: "refresh",
      jti,
    },
    JWT_REFRESH_SECRET,
    signOptions
  );

  return { token, jti };
}

export function verifyAccessToken(token: string): TokenPayload {
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "coogmusic",
      audience: "coogmusic-users",
    }) as TokenPayload;

    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid access token");
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  if (!token) {
    throw new Error("Refresh token is required");
  }

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "coogmusic",
      audience: "coogmusic-users",
    }) as TokenPayload;

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1] || null;
}

export function generateTokenPair(payload: {
  userId: string;
  email: string;
}): AuthTokens {
  const { token: accessToken, jti: accessJti } = generateAccessToken(payload);
  const { token: refreshToken, jti: refreshJti } = generateRefreshToken({
    userId: payload.userId,
  });

  return {
    accessToken,
    refreshToken,
    accessJti,
    refreshJti,
    expiresIn: JWT_EXPIRES_IN,
  };
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}
