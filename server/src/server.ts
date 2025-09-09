import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { testConnection } from "config/database";

import * as Routes from "@routes";

const __dirname = path.resolve();

dotenv.config();

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
      : process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

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

// Routes
app.use("/api/songs", Routes.songRoutes);

// Serve static files
if (NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "public");
  app.use(express.static(clientDistPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

async function startServer() {
  try {
    await testConnection();
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
