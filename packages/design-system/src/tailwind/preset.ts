import type { Config } from "tailwindcss";

/**
 * Lab Suite, the one Tailwind preset for the whole platform.
 * Every app does `presets: [labPreset]`. Light, editorial, JIRA-adjacent:
 * navy ink + one brand blue, calm multicolor for data only.
 *
 * Two naming systems coexist on purpose, both mapping to the same palette:
 *  - Lab Suite tokens:  ink / canvas / card / line / primary / slatey / navy / accent / status
 *  - shadcn HSL tokens: background / foreground / muted / border / destructive / brand
 *    (so apps authored in either convention, e.g. governance, stay consistent)
 */
const labPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ink: "#152433",
        canvas: "#f6f7f8",
        line: "#e4e7eb",
        card: { DEFAULT: "#ffffff", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "#1f6fc4", dark: "#15508c", soft: "#eaf2fb", foreground: "hsl(var(--primary-foreground))" },
        // legacy "navy" names read LIGHT so common utilities degrade into the light theme
        navy: { 950: "#ffffff", 900: "#ffffff", 850: "#f4f6f8", 800: "#eef1f4", 700: "#e3e7eb", 600: "#d7dce2" },
        // legacy "slatey" names read DARK (text ramp)
        slatey: { 50: "#152433", 200: "#2a3a4d", 300: "#46586b", 400: "#5f6f81", 500: "#7c8a9a", 600: "#97a3b1" },
        accent: { DEFAULT: "#1f6fc4", cyan: "#1f6fc4", teal: "#0d9488", foreground: "hsl(var(--accent-foreground))" },
        status: { healthy: "#16a34a", watch: "#d97706", risk: "#ea580c", critical: "#dc2626" },
        // shadcn-style tokens
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        brand: { DEFAULT: "#1f6fc4", 600: "#1f6fc4" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,36,51,0.04), 0 1px 3px rgba(21,36,51,0.06)",
        cardhover: "0 2px 6px rgba(21,36,51,0.06), 0 8px 24px -12px rgba(21,36,51,0.18)",
        glow: "0 0 0 1px rgba(31,111,196,0.2), 0 8px 24px -10px rgba(31,111,196,0.25)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { "fade-in": "fade-in 0.4s ease-out both" },
    },
  },
};
export default labPreset;
