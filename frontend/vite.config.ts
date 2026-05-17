import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const disableReactPluginForLocal =
  process.env.VITE_DISABLE_REACT_PLUGIN === "true";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  esbuild: {
    jsx: "automatic",
  },
  plugins: disableReactPluginForLocal ? [] : [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
