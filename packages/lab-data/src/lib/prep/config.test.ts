import { describe, it, expect } from "vitest";
import { buildReport, hasUnclearedBlocker, DEFAULT_CONFIG } from "./engine";

const EMAIL_DOC = "Contact jane@example.com or john@example.com for details. Otherwise it is regular text.";

describe("config thresholds", () => {
  it("strict PII turns email-only findings into a blocker", () => {
    const def = buildReport("doc.txt", EMAIL_DOC, EMAIL_DOC.length);
    expect(hasUnclearedBlocker(def.checks, new Set())).toBe(false);

    const strict = buildReport("doc.txt", EMAIL_DOC, EMAIL_DOC.length, "general", { ...DEFAULT_CONFIG, piiStrict: true });
    expect(strict.checks.find((c) => c.id === "pii")?.level).toBe("critical");
    expect(hasUnclearedBlocker(strict.checks, new Set())).toBe(true);
  });

  it("requireMetadata=false drops the taxonomy check", () => {
    const withMeta = buildReport("doc.txt", EMAIL_DOC, EMAIL_DOC.length);
    const without = buildReport("doc.txt", EMAIL_DOC, EMAIL_DOC.length, "general", { ...DEFAULT_CONFIG, requireMetadata: false });
    expect(withMeta.checks.some((c) => c.guideline === "taxonomy")).toBe(true);
    expect(without.checks.some((c) => c.guideline === "taxonomy")).toBe(false);
  });

  it("a tighter missing-value threshold escalates the finding", () => {
    const csv = `a,b,c\n1,,\n2,,\n3,x,y`; // ~44% empty cells
    const lenient = buildReport("d.csv", csv, csv.length, "general", { ...DEFAULT_CONFIG, maxMissingPct: 60 });
    const strict = buildReport("d.csv", csv, csv.length, "general", { ...DEFAULT_CONFIG, maxMissingPct: 5 });
    expect(lenient.checks.find((c) => c.id === "missing")?.level).toBe("watch");
    expect(strict.checks.find((c) => c.id === "missing")?.level).toBe("risk");
  });
});
