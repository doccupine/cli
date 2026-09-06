import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The generator fixture's afterEach removes every temp directory created
    // so far, so tests within a file must never run concurrently.
    sequence: { concurrent: false },
  },
});
