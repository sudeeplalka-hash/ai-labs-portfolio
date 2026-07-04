// @labs/kit · industries.ts
// The industry palette + the UseCase schema for the lab use-case layer.
// Honesty is mechanical here: `sources` and `lastVerified` are required, and a
// `first-hand` badge is only representable WITH owner sign-off — so a record that
// violates the doctrine won't type-check. Coverage is COMPUTED from the registry
// (see coverageFrom), never asserted. (Per USE-CASES-PLAN-REVIEW-ADDENDUM.md.)

export type IndustryKey =
  | "financial-services"
  | "capital-markets"
  | "telecom"
  | "consulting"
  | "healthcare"
  | "manufacturing"
  | "retail"
  | "insurance"
  | "pharma"
  | "legal"
  | "technology"
  | "public-sector"
  | "marketing"
  | "media"
  | "logistics"
  | "cybersecurity"
  | "energy"
  | "travel"
  | "real-estate"
  | "hr"
  | "education";

export interface IndustryMeta {
  label: string;
  emoji: string;
  accent: string; // hex — used in inline styles (Tailwind can't take dynamic colors)
}

// Label · emoji · accent for every industry. Order here is display order in the Atlas.
export const INDUSTRIES: Record<IndustryKey, IndustryMeta> = {
  "financial-services": { label: "Financial services", emoji: "💳", accent: "#1f6fc4" },
  "capital-markets": { label: "Capital markets", emoji: "📈", accent: "#0d9488" },
  telecom: { label: "Telecom", emoji: "📡", accent: "#7c3aed" },
  consulting: { label: "Consulting & prof. services", emoji: "🧑‍💼", accent: "#4f46e5" },
  healthcare: { label: "Healthcare", emoji: "🏥", accent: "#e11d6f" },
  manufacturing: { label: "Manufacturing", emoji: "🏭", accent: "#b45309" },
  retail: { label: "Retail & e-commerce", emoji: "🛒", accent: "#ea580c" },
  insurance: { label: "Insurance", emoji: "🛡️", accent: "#0369a1" },
  pharma: { label: "Pharma & life sciences", emoji: "🧬", accent: "#059669" },
  legal: { label: "Legal", emoji: "⚖️", accent: "#525252" },
  technology: { label: "Technology / SaaS", emoji: "💻", accent: "#2563eb" },
  "public-sector": { label: "Public sector", emoji: "🏛️", accent: "#475569" },
  marketing: { label: "Marketing & adtech", emoji: "📣", accent: "#db2777" },
  media: { label: "Media & entertainment", emoji: "🎬", accent: "#9333ea" },
  logistics: { label: "Logistics & supply chain", emoji: "📦", accent: "#a16207" },
  cybersecurity: { label: "Cybersecurity", emoji: "🔒", accent: "#dc2626" },
  energy: { label: "Energy & utilities", emoji: "⚡", accent: "#ca8a04" },
  travel: { label: "Travel & hospitality", emoji: "✈️", accent: "#0891b2" },
  "real-estate": { label: "Real estate / proptech", emoji: "🏢", accent: "#57534e" },
  hr: { label: "HR & talent", emoji: "🧑‍💼", accent: "#c026d3" },
  education: { label: "Education", emoji: "🎓", accent: "#16a34a" },
};

// Owner-confirmed first-hand domains (signed off 2026-07-03). Each must appear ≥3×.
export const FIRST_HAND_DOMAINS: IndustryKey[] = [
  "financial-services",
  "capital-markets",
  "telecom",
  "consulting",
];

// Provenance is a discriminated union: `first-hand` is ONLY representable with an
// explicit owner sign-off, so an unsigned first-hand claim is a compile error.
export type Provenance =
  | { kind: "first-hand"; ownerSignedOff: true }
  | { kind: "studied" };

export const firstHand: Provenance = { kind: "first-hand", ownerSignedOff: true };
export const studied: Provenance = { kind: "studied" };

// A use-case: an industry-agnostic analyst brief + a lab-specific payload that
// reconfigures the lab's existing engine via its applyUseCase(payload) adapter.
export interface UseCase<Payload = unknown> {
  id: string;
  labId: string;
  industry: IndustryKey;
  provenance: Provenance;
  title: string;
  oneLiner: string; // the hook, ≤ 12 words
  context: string; // who / what / the workflow
  theDecision: string; // the specific call this lab makes here
  whatMostMiss: string; // the non-obvious insight
  stakes: string; // the number/impact that makes it matter
  takeaway: string; // industry-specific steering line (overrides the lab default)
  sources: string[]; // REQUIRED — ≥1 credible "informed by" pointer
  lastVerified: string; // REQUIRED — ISO date (YYYY-MM-DD)
  payload: Payload;
}

// Authoring-time guard: makes the honesty rules fail loudly instead of silently.
// Every use-case file runs its list through this.
export function assertUseCases<P>(list: UseCase<P>[]): UseCase<P>[] {
  for (const uc of list) {
    if (!uc.sources || uc.sources.length === 0)
      throw new Error(`[use-cases] ${uc.id}: 'sources' is required (≥1 entry).`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(uc.lastVerified))
      throw new Error(`[use-cases] ${uc.id}: 'lastVerified' must be an ISO date.`);
    if (uc.provenance.kind === "first-hand" && !uc.provenance.ownerSignedOff)
      throw new Error(`[use-cases] ${uc.id}: first-hand requires owner sign-off.`);
  }
  return list;
}

export interface IndustryCoverage {
  total: number;
  firstHand: number;
}

// Coverage COMPUTED from the registry — the Atlas headline reads this, never a
// hardcoded claim. Returns per-industry counts + a summary.
export function coverageFrom(list: UseCase[]): {
  byIndustry: Record<IndustryKey, IndustryCoverage>;
  industries: number;
  scenarios: number;
  firstHandDomains: number;
} {
  const byIndustry = {} as Record<IndustryKey, IndustryCoverage>;
  for (const uc of list) {
    const cur = byIndustry[uc.industry] ?? { total: 0, firstHand: 0 };
    cur.total += 1;
    if (uc.provenance.kind === "first-hand") cur.firstHand += 1;
    byIndustry[uc.industry] = cur;
  }
  const keys = Object.keys(byIndustry) as IndustryKey[];
  return {
    byIndustry,
    industries: keys.length,
    scenarios: list.length,
    firstHandDomains: keys.filter((k) => byIndustry[k].firstHand > 0).length,
  };
}
