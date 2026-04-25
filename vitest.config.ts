import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup/test-env.ts"],
    include: ["test/**/*.spec.ts"],
    exclude: ["test/**/*.e2e-spec.ts"],
  },
});
