import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  optimizeDeps: {
    include: [
      "@monaco-editor/react",
      "framer-motion",
      "lucide-react",
      "react-dom/client",
      "react-redux",
      "react-router-dom",
      "sonner",
    ],
  },

  server: {
    // Kisi COOP ya COEP strict headers ki zaroorat nahi hai ab!
    proxy: {
      "/api": {
        target: "https://lume-ai-rfjg.onrender.com",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
      },
    },
  },
});
