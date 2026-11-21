import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Konfigurasi khusus tes integrasi DB (butuh Docker/Postgres). Dipisah dari tes unit
// agar `pnpm test` tetap cepat & tidak butuh Docker.
export default defineConfig({
  resolve: {
    alias: {
      "@": r("./src"),
    },
  },
  test: {
    include: ["src/**/*.itest.ts"],
    environment: "node",
    globalSetup: ["./src/db/tests/globalSetup.ts"],
    // Tes DB berbagi satu container; jalankan berkas secara berurutan.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
