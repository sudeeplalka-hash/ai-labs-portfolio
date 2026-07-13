import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Test-only mirror of the app's "@gov/*" alias so the engine suites run in
// isolation (same pattern as lab-data's vitest config). The component test in
// components/__tests__ needs @testing-library/react + jsdom, which this package
// does not ship; excluded until that harness is added deliberately.
export default defineConfig({
  resolve: {
    alias: { "@gov": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "src/components/__tests__/**"],
  },
});
