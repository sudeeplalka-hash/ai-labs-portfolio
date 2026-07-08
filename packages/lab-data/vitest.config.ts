import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Test-only alias mirror of the app's "@data/*" path so engine tests can
// exercise source modules directly.
export default defineConfig({
  resolve: {
    alias: { "@data": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { environment: "node" },
});
