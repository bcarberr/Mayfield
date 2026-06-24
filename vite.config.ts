import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const figmaCapturePlugin = {
  name: "figma-capture-dev-only",
  transformIndexHtml(_html: string, ctx: { command: string }) {
    if (ctx.command !== "serve") return;
    return [
      {
        tag: "script",
        attrs: { src: "https://mcp.figma.com/mcp/html-to-design/capture.js", async: true },
        injectTo: "head" as const,
      },
    ];
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), figmaCapturePlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    open: "/",
  },
});
