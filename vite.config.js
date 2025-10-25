import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["bd1b347e007f.ngrok-free.app", "hsdx2s-5173.csb.app"],
  },
});
