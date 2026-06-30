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
  optimizeDeps: {
    include: ["@monaco-editor/react"],
  },
  server: {
    // Proxy /api/* to the backend so the browser never talks directly to
    // https://localhost:3000 (which uses a self-signed cert the browser
    // rejects with ERR_CERT_AUTHORITY_INVALID). Vite forwards requests
    // server-side, where the cert is not validated, keeping everything
    // same-origin so cookies work without CORS/cert headaches.
    proxy: {
      "/api": {
        target: "https://localhost:3000",
        changeOrigin: true,
        secure: false, // trust the backend's self-signed cert
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
