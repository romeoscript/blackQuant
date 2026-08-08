import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // The deposit suite runs against a real database and shares tables, so its
    // files must not interleave. Individual tests within a file still run in
    // order, which is what the callback-sequence tests depend on.
    fileParallelism: false,
  },
});
