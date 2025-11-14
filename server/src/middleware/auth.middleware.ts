import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractTokenFromHeader } from "@config/jwt.js";
import { TokenBlacklistManager } from "@services";
import { UserRepository } from "@repositories";
import { User } from "@types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const isBlacklisted = await TokenBlacklistManager.isBlacklisted(
      decoded.jti
    );
    if (isBlacklisted) {
      return next();
    }

    const user = await UserRepository.getOne(decoded.userId);
    if (!user) {
      return next();
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    next();
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Access token is required",
        statusCode: 401,
      });
      return;
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      res.status(401).json({
        error: "Unauthorized",
        message: error instanceof Error ? error.message : "Invalid token",
        statusCode: 401,
      });
      return;
    }

    const isBlacklisted = await TokenBlacklistManager.isBlacklisted(
      decoded.jti
    );
    if (isBlacklisted) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token has been revoked",
        statusCode: 401,
      });
      return;
    }

    const user = await UserRepository.getOne(decoded.userId);
    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not found",
        statusCode: 401,
      });
      return;
    }

    if (user.status?.toLowerCase() !== "active") {
      res.status(401).json({
        error: "Unauthorized",
        message: "User account is not active",
        statusCode: 401,
      });
      return;
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
      statusCode: 500,
    });
  }
}

export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
        statusCode: 401,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        statusCode: 403,
      });
      return;
    }

    next();
  };
}

export function requireOwnership(userIdParam: string = "userId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
        statusCode: 401,
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.params.id;
    if (!resourceUserId) {
      res.status(400).json({
        error: "Bad Request",
        message: "User ID parameter is required",
        statusCode: 400,
      });
      return;
    }

    if (req.user.id !== resourceUserId && req.user.role !== "ADMIN") {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only access your own resources",
        statusCode: 403,
      });
      return;
    }

    next();
  };
}
