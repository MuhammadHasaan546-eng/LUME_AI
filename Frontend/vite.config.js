import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Pre-bundle heavy/rare deps so the editor boots fast and avoids
  // on-demand re-optimization stalls in the browser.
  optimizeDeps: {
    include: [
      "@monaco-editor/react",
      "@webcontainer/api",
      "framer-motion",
      "lucide-react",
      "react-dom/client",
      "react-redux",
      "react-router-dom",
      "sonner",
    ],
  },

  // WebContainer transfers SharedArrayBuffer between the main thread and
  // its worker, which REQUIRES a cross-origin isolated context. Without
  // these headers `self.crossOriginIsolated === false` and WebContainer.boot()
  // throws a DataCloneError, forcing the editor into sandbox fallback mode.
  //
  // NOTE: the headers MUST live directly under `server` (not nested under a
  // second `server` key). The previous config nested them under
  // `server.server.headers`, which Vite silently ignored — so isolation
  // never activated. This is the root cause of the WebContainer fallback.
  server: {
    // Agar Firebase popup use kar rahe hain, toh COOP headers ko temporarily band karein ya check karein:
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups", // same-origin se badal kar ye karein
      "Cross-Origin-Embedder-Policy": "require-corp",
    },

    proxy: {
      "/api": {
        // Agar live test kar rahe hain, toh check karein aapka base URL Axios/Fetch me Render ka URL ho
        target: "https://localhost:3000",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
      },
    },
  },

  // WebContainer's worker uses ESM. Ensure Vite emits ES module workers so
  // the shared-array-buffer transfer works in the isolated context.
  worker: {
    format: "es",
  },
});
