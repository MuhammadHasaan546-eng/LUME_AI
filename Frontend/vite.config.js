import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@monaco-editor/react"],
  },
  server: {
    // WebContainer API requires cross-origin isolation (SharedArrayBuffer).
    // Modified to allow popups so Firebase Google Auth works seamlessly.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups", // 🔴 CHANGE HERE
      "Cross-Origin-Embedder-Policy": "credentialless", // 🔴 CHANGE HERE (Safe for external images like Google avatar/ui-avatars)
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups", // 🔴 CHANGE HERE
      "Cross-Origin-Embedder-Policy": "credentialless", // 🔴 CHANGE HERE
    },
  },
});
