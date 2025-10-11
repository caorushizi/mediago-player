import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/m",
  server: {
    port: 8557,
    strictPort: true,
  },
  envDir: "../../",
  plugins: [react(), tailwindcss()],
});
