import type { Config } from "tailwindcss";
import labPreset from "@labs/design-system/preset";

const config: Config = {
  presets: [labPreset as Partial<Config>],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/design-system/src/**/*.{ts,tsx}",
    "../../packages/lab-framing/src/**/*.{ts,tsx}",
    "../../packages/lab-governance/src/**/*.{ts,tsx}",
    "../../packages/lab-data/src/**/*.{ts,tsx}",
    "../../packages/lab-rag/src/**/*.{ts,tsx}",
    "../../packages/lab-deploy/src/**/*.{ts,tsx}",
    "../../packages/lab-realize/src/**/*.{ts,tsx}",
  ],
};
export default config;
