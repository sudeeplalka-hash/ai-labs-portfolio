import type { Config } from "tailwindcss";
import labPreset from "@labs/design-system/preset";

// Consumes the one shared preset. Content includes this app AND the design-system
// package source so utility classes used by shared components are generated.
const config: Config = {
  presets: [labPreset as Partial<Config>],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/design-system/src/**/*.{ts,tsx}",
  ],
};
export default config;
