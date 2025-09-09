import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import chalk from "chalk";

import * as Routes from "@routes";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

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
    app.listen(PORT, () => {
      console.log(
        chalk.green.bold(`⚡ Server running on http://localhost:${PORT}`)
      );
      console.log("Client URL: ", chalk.blue.underline(CLIENT_URL));
      console.log("Environment: ", chalk.yellow(NODE_ENV));
    });
  } catch (error) {
    console.error(chalk.red("Failed to start server:", error));
    process.exit(1);
  }
}

startServer();
