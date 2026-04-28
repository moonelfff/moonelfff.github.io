import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import utwm from "unplugin-tailwindcss-mangle/vite";
import { responsiveImage } from "@responsive-image/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  base: "/katezhuk/",
  plugins: [react(), tailwindcss(), utwm(), responsiveImage()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
