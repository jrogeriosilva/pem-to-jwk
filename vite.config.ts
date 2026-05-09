import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"

export default defineConfig({
  base: "/pem-to-jwk/",
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analysis: run `ANALYZE=true npm run build` to generate stats.html
    ...(process.env.ANALYZE
      ? [visualizer({ open: true, gzipSize: true, filename: "dist/stats.html" })]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
