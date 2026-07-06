import type { CheckResult, GuidelineId, Level } from "./types";

// Compliance rule profiles. A profile raises the severity of certain guidelines
// so the same file is judged against an industry's bar (e.g. HIPAA treats any
// found PII as a hard blocker). Profiles never penalize a clean file, they only
// escalate guidelines that already have a finding.
export type ProfileId = "general" | "hipaa" | "finance" | "gdpr" | "pci";

export interface RuleProfile {
  id: ProfileId;
  name: string;
  blurb: string;
  /** Guideline → minimum severity when that guideline has a finding. */
  escalate: Partial<Record<GuidelineId, Level>>;
}

export const PROFILES: RuleProfile[] = [
  {
    id: "general",
    name: "General",
    blurb: "Baseline ingestion guidelines for an internal knowledge base.",
    escalate: {},
  },
  {
    id: "hipaa",
    name: "Healthcare · HIPAA",
    blurb: "Any detected PII is a hard blocker; sensitivity tagging is mandatory.",
    escalate: { privacy: "critical", taxonomy: "risk" },
  },
  {
    id: "finance",
    name: "Finance · SOX",
    blurb: "Provenance sign off and single-source-of-truth are enforced strictly.",
    escalate: { provenance: "risk", dedup: "risk", freshness: "risk" },
  },
  {
    id: "gdpr",
    name: "Privacy · GDPR",
    blurb: "Personal data is treated as sensitive; lawful-basis provenance and retention (right to erasure) are enforced.",
    escalate: { privacy: "critical", provenance: "risk", freshness: "risk" },
  },
  {
    id: "pci",
    name: "Payments · PCI DSS",
    blurb: "Cardholder data is a hard blocker; anything with payment identifiers must be tagged and segmented before ingestion.",
    escalate: { privacy: "critical", taxonomy: "risk" },
  },
];

const ORDER: Level[] = ["healthy", "watch", "risk", "critical"];
const moreSevere = (a: Level, b: Level): Level => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

export function getProfile(id: ProfileId): RuleProfile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}

/** Returns a new check list with the profile's escalations applied. */
export function applyProfile(checks: CheckResult[], id: ProfileId): CheckResult[] {
  const profile = getProfile(id);
  if (id === "general") return checks;
  return checks.map((c) => {
    const target = profile.escalate[c.guideline];
    if (!target || c.level === "healthy") return c;
    const level = moreSevere(c.level, target);
    if (level === c.level) return c;
    const fix = c.fix
      ? { ...c.fix, unblocks: level === "critical" ? true : c.fix.unblocks, delta: level === "critical" ? Math.max(c.fix.delta, 40) : c.fix.delta }
      : c.fix;
    return { ...c, level, fix, detail: `${c.detail} (escalated by ${profile.name})` };
  });
}
