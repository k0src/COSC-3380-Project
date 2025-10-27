import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import dotenv from "dotenv";
import { testConnection } from "config/database";
import { generalRateLimit } from "./middleware/rateLimiting.middleware.js";

import * as Routes from "@routes";

const __dirname = path.resolve();

dotenv.config();

console.log("Imported routes:", Object.keys(Routes));

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS middleware
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : true
      : process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// General rate limiting
// app.use(generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    port: PORT,
  });
});

// Serve static files
const clientDistPath = path.join(__dirname, "public");
app.use(express.static(clientDistPath));

// Routes (guard against undefined handlers)
// if (Routes.authRoutes) app.use("/api/auth", Routes.authRoutes);
if (Routes.songRoutes) {
  console.log("✓ Registering song routes at /api/songs");
  app.use("/api/songs", Routes.songRoutes);
}
// if (Routes.albumRoutes) app.use("/api/albums", Routes.albumRoutes);
// if (Routes.artistRoutes) app.use("/api/artists", Routes.artistRoutes);
// if (Routes.playlistRoutes) app.use("/api/playlists", Routes.playlistRoutes);
// if (Routes.userRoutes) app.use("/api/users", Routes.userRoutes);
if (Routes.searchRoutes) {
  console.log("✓ Registering search routes at /api/search");
  app.use("/api/search", Routes.searchRoutes);
}

// React SPA routes
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Catch all 404
app.use((req, res) => {
  res.status(404).send("Not found");
});

async function startServer() {
  try {
    try {
      await testConnection();
    } catch (err) {
      console.warn("⚠ Database connection failed at startup. Continuing to start server.", err);
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`⚡ Server running on port: ${PORT}`);
      console.log("Environment: ", NODE_ENV);
      if (NODE_ENV !== "production") {
        console.log("CORS Origin:", corsOptions.origin);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
Monday, October 27, 2025 2:17:15 AM