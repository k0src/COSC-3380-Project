import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import chalk from "chalk";
import { testConnection } from "config/database";

import * as Routes from "@routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

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

// Catch-all
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(chalk.green.bold(`⚡ Server running on port: ${PORT}`));
      console.log("Client URL: ", chalk.blue.underline(CLIENT_URL));
      console.log("Environment: ", chalk.yellow(NODE_ENV));
    });
  } catch (error) {
    console.error(chalk.red("Failed to start server:", error));
    process.exit(1);
  }
}

startServer();
