import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

console.log("Environment variables loaded:", {
  PGHOST: process.env.PGHOST,
  PGUSER: process.env.PGUSER,
  PGDATABASE: process.env.PGDATABASE,
});

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import searchRoutes from "./routes/search.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS middleware
const devOrigins = new Set<string>([
  process.env.CLIENT_URL || "",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "http://localhost:5180",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
  "http://127.0.0.1:5178",
  "http://127.0.0.1:5179",
  "http://127.0.0.1:5180",
].filter(Boolean) as string[]);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow curl/Postman or same-origin (no Origin header)
    if (!origin) return callback(null, true);

    if (NODE_ENV !== "production") {
      if (devOrigins.has(origin)) return callback(null, true);
      console.warn(`CORS blocked (dev): ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }

    // Production: allow from ALLOWED_ORIGINS if set; otherwise allow all
    const allowed = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (allowed.length === 0 || allowed.includes(origin)) return callback(null, true);

    console.warn(`CORS blocked (prod): ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
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

// Log incoming requests (method + path)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Optional alias routes import; don’t block server if alias is missing
let Routes: any = null;
try {
  Routes = await import("@routes");
  console.log("✓ Optional '@routes' module loaded");
} catch {
  console.warn("⚠ Optional module '@routes' not found; skipping alias routes");
}

// Health check endpoint (includes DB status)
app.get("/api/health", async (_req, res) => {
  let db = "down";
  try {
    const { pool } = await import("config/database");
    await pool.query("SELECT 1");
    db = "up";
  } catch (e: any) {
    console.warn("DB health check failed:", e?.message);
  }
  res.json({
    status: "ok",
    db,
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
if (Routes?.songRoutes) {
  console.log("✓ Registering song routes at /api/songs");
  app.use("/api/songs", Routes.songRoutes);
}
// if (Routes.albumRoutes) app.use("/api/albums", Routes.albumRoutes);
// if (Routes.artistRoutes) app.use("/api/artists", Routes.artistRoutes");
// if (Routes.playlistRoutes) app.use("/api/playlists", Routes.playlistRoutes);
// if (Routes.userRoutes) app.use("/api/users", Routes.userRoutes);

// Register search routes using direct import (tsconfig-paths issue with re-exports)
if (searchRoutes) {
  console.log("✓ Registering search routes at /api/search");
  app.use("/api/search", searchRoutes);
}

// React SPA routes
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Catch all 404
app.use((req, res) => {
  res.status(404).send("Not found");
});

// Global error handler to see proxy failures that hit the server and explode
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ERR]", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server immediately (don’t wait on DB)
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Server running on port: ${PORT}`);
  console.log("Environment: ", NODE_ENV);
  if (NODE_ENV !== "production") {
    console.log("CORS Origin:", corsOptions.origin);
  }
});

// Explicitly keep the process alive
server.on("listening", () => {
  console.log("✅ Server is now accepting connections");
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
  process.exit(1);
});

// Background DB connectivity check with timeout (non-blocking)
(async () => {
  try {
    const { testConnection } = await import("config/database");
    const timeoutMs = Number(process.env.DB_TEST_TIMEOUT_MS || 3000);
    await Promise.race([
      testConnection(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB test timeout")), timeoutMs)),
    ]);
    console.log("✅ Database connection verified");
  } catch (err: any) {
    console.warn("⚠ Database connection failed/timeout. Continuing to serve API.", err?.message);
  }
})();

// Keep process alive
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
