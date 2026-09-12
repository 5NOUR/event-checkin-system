import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ✅ إعدادات البناء الإنتاجي
  build: {
    outDir: "dist",
    sourcemap: false, // لا نكشف الكود المصدري في الإنتاج
    // ✅ لا نحدد minify — Vite 8 يستخدم oxc افتراضياً (أسرع)
    target: "es2020",
    chunkSizeWarningLimit: 1000,
  },

  // ✅ إعدادات خادم التطوير
  server: {
    port: 5173,
    host: true,
  },

  // ✅ تحسينات
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
