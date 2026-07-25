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
    },
  },
});
