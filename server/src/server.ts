import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { testConnection } from "config/database";

import * as Routes from "@routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";
const STATIC_PATH = process.env.STATIC_PATH || "public";

// CORS middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  });
});

// Routes
app.use("/api/songs", Routes.songRoutes);

// Serve static files
if (NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, STATIC_PATH);
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
    app.listen(PORT, () => {
      console.log(`⚡ Server running on port: ${PORT}`);
      console.log("Client URL: ", CLIENT_URL);
      console.log("Environment: ", NODE_ENV);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
