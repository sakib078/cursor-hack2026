import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the frontend talks to /api and Vite forwards it to the FastAPI
// backend on :8000 — so no CORS dance and one origin in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
