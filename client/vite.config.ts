import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],

  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "./src/api"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@validators": path.resolve(__dirname, "./src/validators"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@util": path.resolve(__dirname, "./src/util"),
      "@constants": path.resolve(__dirname, "./src/constants"),
    },
  },

  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },

  envPrefix: ["VITE_", "TAURI_ENV_*"],

  build: {
    target:
      process.env.TAURI_ENV_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
