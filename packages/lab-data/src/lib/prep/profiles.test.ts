import { describe, it, expect } from "vitest";
import { buildReport, hasUnclearedBlocker } from "./engine";
import { applyProfile } from "./profiles";
import type { CheckResult } from "./types";

const MESSY = `customer_id,name,email,plan,notes
1001,Ada,ada@example.com,Pro,
1002,Alan,alan@example.com,Pro,renewed
1002,Alan,alan@example.com,Pro,renewed
1003,Grace,,Enterprise,SSN 123-45-6789
1004,Kat,kat@example.com,Pro,card 4111 1111 1111 1111`;

const CLEAN = `A short, clean reference document with no sensitive data.
It has a couple of normal sentences and nothing that needs redaction.`;

describe("profiles", () => {
  it("HIPAA escalates found PII to a hard blocker", () => {
    const r = buildReport("crm.csv", MESSY, MESSY.length, "hipaa");
    const pii = r.checks.find((c) => c.id === "pii");
    expect(pii?.level).toBe("critical");
    expect(hasUnclearedBlocker(r.checks, new Set())).toBe(true);
  });

  it("never blocks a clean file under HIPAA", () => {
    const r = buildReport("notes.txt", CLEAN, CLEAN.length, "hipaa");
    expect(hasUnclearedBlocker(r.checks, new Set())).toBe(false);
  });

  it("Finance escalates provenance to at-risk", () => {
    const r = buildReport("ledger.csv", MESSY, MESSY.length, "finance");
    const prov = r.checks.find((c) => c.guideline === "provenance");
    expect(prov?.level).toBe("risk");
  });

  it("applyProfile leaves healthy guidelines untouched", () => {
    const checks: CheckResult[] = [
      { id: "pii", guideline: "privacy", name: "PII", level: "healthy", detail: "", downstream: "" },
    ];
    const out = applyProfile(checks, "hipaa");
    expect(out[0].level).toBe("healthy");
  });
});
