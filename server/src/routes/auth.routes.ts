import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { UserRepository, ArtistRepository } from "@repositories";
import { TokenBlacklistManager } from "@services";
import {
  generateTokenPair,
  verifyRefreshToken,
  getTokenExpiration,
} from "@config/jwt";
import { requireAuth, authRateLimit, loginRateLimit } from "@middleware";

const router = Router();

/* ========================================================================== */
/*                              Type Definitions                              */
/* ========================================================================== */

interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role?: "USER" | "ARTIST";
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    profile_picture_url?: string;
    created_at: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/* ========================================================================== */
/*                           Authentication Routes                            */
/* ========================================================================== */

router.post(
  "/signup",
  authRateLimit,
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      ),
  ],
  async (req: Request<{}, AuthResponse, SignupRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          message: "Invalid input data",
          statusCode: 400,
          details: errors.array(),
        });
        return;
      }

      const { username, email, password, role } = req.body;

      const existingUser = await UserRepository.getByEmail(email);
      if (existingUser) {
        res.status(409).json({
          error: "Conflict",
          message: "Email already exists",
          statusCode: 409,
        });
        return;
      }

      const existingUsername = await UserRepository.getByUsername(username);
      if (existingUsername) {
        res.status(409).json({
          error: "Conflict",
          message: "Username already exists",
          statusCode: 409,
        });
        return;
      }

      const user = await UserRepository.create({
        username,
        email,
        password,
        role: role || "USER",
      });

      if (!user) {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to create user",
          statusCode: 500,
        });
        return;
      }

      if (user.role === "ARTIST") {
        const artist = await ArtistRepository.create({
          user_id: user.id,
          display_name: user.username,
        });

        if (!artist) {
          res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create artist profile",
            statusCode: 500,
          });
          return;
        }

        await UserRepository.update(user.id, { artist_id: artist.id });
        user.artist_id = artist.id;
      }

      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        artist_id: user.artist_id,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
      };

      res.status(201).json({
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Registration failed",
        statusCode: 500,
      });
    }
  }
);

router.post(
  "/login",
  loginRateLimit,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: Request<{}, AuthResponse, LoginRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          message: "Invalid input data",
          statusCode: 400,
          details: errors.array(),
        });
        return;
      }

      const { email, password } = req.body;

      const user = await UserRepository.validateCredentials(email, password);
      if (!user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid email or password",
          statusCode: 401,
        });
        return;
      }

      if (user.status === "SUSPENDED") {
        res.status(401).json({
          error: "Unauthorized",
          message: "Account is suspended",
          statusCode: 401,
        });
        return;
      } else if (user.status === "DEACTIVATED") {
        await UserRepository.update(user.id, { status: "ACTIVE" });
      }

      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        artist_id: user.artist_id,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
      };

      res.json({
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Login failed",
        statusCode: 500,
      });
    }
  }
);

router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400).json({
        error: "Bad Request",
        message: "Authorization header is required",
        statusCode: 400,
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(400).json({
        error: "Bad Request",
        message: "Token is required",
        statusCode: 400,
      });
      return;
    }

    const refreshToken = req.body.refreshToken;

    const accessTokenExpiration = getTokenExpiration(token);
    if (accessTokenExpiration) {
      const payload = token.split(".")[1];
      if (payload) {
        const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
        await TokenBlacklistManager.addToBlacklist(
          decoded.jti,
          accessTokenExpiration
        );
      }
    }

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const refreshTokenExpiration = getTokenExpiration(refreshToken);
        if (refreshTokenExpiration) {
          await TokenBlacklistManager.addToBlacklist(
            decoded.jti,
            refreshTokenExpiration
          );
        }
      } catch (error) {
        console.warn("Invalid refresh token during logout:", error);
      }
    }

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Logout failed",
      statusCode: 500,
    });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: "Bad Request",
        message: "Refresh token is required",
        statusCode: 400,
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);

    const isBlacklisted = await TokenBlacklistManager.isBlacklisted(
      decoded.jti
    );
    if (isBlacklisted) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token has been revoked",
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

    if (user.status !== "ACTIVE") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Account is not active",
        statusCode: 401,
      });
      return;
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    const refreshTokenExpiration = getTokenExpiration(refreshToken);
    if (refreshTokenExpiration) {
      await TokenBlacklistManager.addToBlacklist(
        decoded.jti,
        refreshTokenExpiration
      );
    }

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid refresh token",
      statusCode: 401,
    });
  }
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const userResponse = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      artist_id: req.user.artist_id,
      profile_picture_url: req.user.profile_picture_url,
      created_at: req.user.created_at,
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get user information",
      statusCode: 500,
    });
  }
});

export default router;
