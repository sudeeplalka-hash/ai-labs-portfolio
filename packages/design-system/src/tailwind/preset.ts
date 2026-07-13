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
        // Muted text ON the dark ink sidebar. Tailwind's slate-500 (#64748b) was
        // used here and measures 3.31:1 on #152433 — below AA. 5.07:1.
        inkmuted: "#8194aa",
        card: { DEFAULT: "#ffffff", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "#1f6fc4", dark: "#15508c", soft: "#eaf2fb", foreground: "hsl(var(--primary-foreground))" },
        // legacy "navy" names read LIGHT so common utilities degrade into the light theme
        navy: { 950: "#ffffff", 900: "#ffffff", 850: "#f4f6f8", 800: "#eef1f4", 700: "#e3e7eb", 600: "#d7dce2" },
        // Legacy "slatey" names read DARK (text ramp). Every step 50–500 is a TEXT
        // token and clears 4.5:1 on both #ffffff and canvas #f6f7f8. 600 is the only
        // step below AA and is therefore NON-TEXT ONLY (borders, dividers, disabled
        // glyphs) — do not use text-slatey-600 on body copy.
        // (a11y 2026-07-12: 400 was #5f6f81, 500 was #7c8a9a @ 3.29:1 — 564 failing usages.)
        slatey: {
          50: "#152433", //  14.70:1 — primary text
          200: "#2a3a4d", // 10.81:1 — strong
          300: "#46586b", //  6.83:1 — secondary
          400: "#55657a", //  5.55:1 — muted body
          500: "#616f80", //  4.78:1 — label / caption floor
          600: "#97a3b1", //  2.39:1 — NON-TEXT ONLY
        },
        accent: { DEFAULT: "#1f6fc4", cyan: "#1f6fc4", teal: "#0f766e", foreground: "hsl(var(--accent-foreground))" },
        // Status does triple duty: icon/text ink, tinted chips (bg-status-x/15 +
        // text-status-x), and solid decorative bars. The DEFAULT is the *ink* — it
        // clears 4.5:1 on canvas so it is safe as text. `-fill` keeps the original
        // vivid tone for solid bars/dots, where only the 3:1 non-text bar applies.
        // Note: the old watch #d97706 measured 2.97:1 — it failed even 3:1, so it
        // was unsafe as text AND as an icon.
        status: {
          healthy: { DEFAULT: "#15803d", fill: "#16a34a" }, // 4.68:1 ink
          watch: { DEFAULT: "#a16207", fill: "#d97706" },   // 4.59:1 ink
          risk: { DEFAULT: "#c2410c", fill: "#ea580c" },    // 4.83:1 ink
          critical: { DEFAULT: "#dc2626", fill: "#dc2626" },// 4.50:1 ink
        },
        // shadcn-style tokens
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        brand: { DEFAULT: "#1f6fc4", 600: "#1f6fc4" },
      },
      // TYPOGRAPHY POLICY (2026-07-12). No monospace in the interface.
      //
      // It was decorating 280 elements: artifact counts, collection tags, status
      // badges, stage numbers, eyebrows. UI copy dressed up as a terminal, which
      // reads as hobbyist to the executive audience this portfolio is written for.
      //
      // `mono` is DELIBERATELY remapped to the sans stack with tabular figures. That
      // retires the typewriter look across all 280 call sites in one line, with zero
      // JSX churn, and tabular-nums keeps digits aligned in tables and counters,
      // which was the only legitimate job monospace was doing there.
      //
      // Real monospace is NOT gone: globals.css restores it for `pre`, `code`, `kbd`
      // and `samp`, so JSON payloads, tool schemas, policy snippets and audit hashes
      // stay readable. Setting code in a proportional face is a legibility bug, not a
      // style choice. Use `font-code` for inline technical strings (a SHA, an ID)
      // that are not already inside a <code> element.
      fontFamily: {
        sans: ["var(--font-sans)", "Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          ["var(--font-sans)", "Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
          { fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums" },
        ],
        code: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
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
