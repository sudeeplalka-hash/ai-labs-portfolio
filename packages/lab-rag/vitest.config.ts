import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Test-only alias mirror of the app's "@rag/*" path (apps/web/tsconfig.json),
// so engine/parity tests can exercise source modules directly.
export default defineConfig({
  resolve: {
    alias: { "@rag": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { environment: "node" },
});
