import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }: { mode: string }) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, "..");

  const env = loadEnv(mode, projectRoot, "");

  return {
    envDir: projectRoot,
    plugins: [react()],
    server: {
      port: 5173,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8080",
          changeOrigin: true
        }
      }
    }
  };
});
