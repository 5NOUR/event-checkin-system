import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "prisma/"],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    // ✅ بدائل poolOptions في Vitest v4
    pool: "forks",
    fileParallelism: false, // تشغيل الملفات بالتسلسل (بدلاً من singleFork)
    maxWorkers: 1, // عامل واحد فقط لتجنب تعارض اتصالات Prisma
  },
});
