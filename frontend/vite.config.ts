import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import path from "path";
import { defineConfig } from "vite";

const disableReactPluginForLocal =
  process.env.VITE_DISABLE_REACT_PLUGIN === "true";

function gitCommitId(): string {
  if (process.env.VITE_GIT_SHA) {
    return process.env.VITE_GIT_SHA;
  }
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Allow reading monorepo academy seed (backend/content/...) during vite dev.
    // Production build resolves the same alias without this restriction.
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  define: {
    "import.meta.env.VITE_GIT_SHA": JSON.stringify(gitCommitId()),
  },
  plugins: disableReactPluginForLocal ? [] : [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Single source of truth: backend/content/academy-v2/seed (see scripts/assert-academy-seed.mjs)
      "@academy-v2-seed": path.resolve(
        __dirname,
        "../backend/content/academy-v2/seed",
      ),
    },
  },
});
