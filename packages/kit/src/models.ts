// Model configuration — the single source of truth for model identity across all
// labs. B2: "Never hardcode model strings in labs." B5.6: model names live in a
// dated config, never in copy. Refresh on the quarterly freshness sweep.

export const MODELS_AS_OF = "2026-07-02";

// --- Host-key live calls (Sudeep's own labs run through these) ---
// One shared config; labs reference LIVE_MODEL / LIVE_MODEL_CHEAP, never a literal.
export const LIVE_MODEL = "claude-sonnet-5" as const; // default quality tier
export const LIVE_MODEL_CHEAP = "claude-haiku-4-5" as const; // cheap, high-volume calls

export type ModelFamily = "anthropic" | "openai" | "google" | "open-source";
export type ModelTier = "frontier" | "balanced" | "cheap";

export interface ModelInfo {
  id: string;
  label: string;
  family: ModelFamily;
  tier: ModelTier;
}

// Dated, editable catalog. Anthropic entries are current and named; other providers
// are shown as generic tiers (not version-pinned) so nothing makes a stale currency
// claim under the dated stamp. The `id`s stay real so a bring-your-own-key call still
// resolves. Not an endorsement or a price list — see pricing.ts for economics.
export const MODEL_CATALOG: ModelInfo[] = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", family: "anthropic", tier: "frontier" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", family: "anthropic", tier: "frontier" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", family: "anthropic", tier: "cheap" },
  { id: "gpt-4o", label: "OpenAI · frontier", family: "openai", tier: "frontier" },
  { id: "gpt-4o-mini", label: "OpenAI · economy", family: "openai", tier: "cheap" },
  { id: "gemini-1.5-pro", label: "Google · frontier", family: "google", tier: "frontier" },
  { id: "gemini-1.5-flash", label: "Google · economy", family: "google", tier: "cheap" },
];

export function modelInfo(id: string): ModelInfo | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

export function modelLabel(id: string): string {
  return modelInfo(id)?.label ?? id;
}

// Provider → default model for the bring-your-own-key RAG live lab. Keeps
// llmProvider.ts free of hardcoded strings; the visitor can still override.
export const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5",
  gemini: "gemini-1.5-flash",
  "openai-compatible": "",
};

// Options for the governance use-case model classifier dropdown. "mock" is a
// deliberate choice (dry-run a use case with no live model).
export const USE_CASE_MODEL_OPTIONS: string[] = [
  ...MODEL_CATALOG.map((m) => m.id),
  "mock",
];
