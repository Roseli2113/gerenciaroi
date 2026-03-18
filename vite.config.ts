import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  define: {
    'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify('BGnq3BA3TCX-9La-NJ20QACkWFWbtsrl1SAfLp2rzP3Lz3gDwBeXy5hARpgSYMiIMzA-6taCVEQ1dZrQK-QA3t4'),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
