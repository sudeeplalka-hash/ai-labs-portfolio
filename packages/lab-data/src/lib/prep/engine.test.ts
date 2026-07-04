import { describe, it, expect } from "vitest";
import {
  buildReport,
  chunkText,
  computeGate,
  detectPii,
  hasUnclearedBlocker,
  inferType,
  parseDelimited,
  redactPii,
  scoreWithFixes,
} from "./engine";

const MESSY_CSV = `customer_id,name,email,signup_date,plan,monthly_spend,region,notes
1001,Ada Lovelace,ada@example.com,2024-01-15,Pro,89.00,EMEA,
1002,Alan Turing,alan@example.com,2024/02/03,Pro,89,EMEA,renewed
1002,Alan Turing,alan@example.com,2024/02/03,Pro,89,EMEA,renewed
1003,Grace Hopper,,2024-03-21,Enterprise,,AMER,call back re SSN 123-45-6789
1004,,katherine@example.com,,Free,0,AMER,
1005,Katherine Johnson,kj@example.com,2024-04-02,Pro,89.00,AMER,card 4111 1111 1111 1111
,,,,,,,
1006,Margaret Hamilton,mh@example.com,2024-06-30,Pro,89.00,AMER,phone 415-555-0192`;

describe("parseDelimited", () => {
  it("parses rows and columns, quote-aware", () => {
    const rows = parseDelimited('a,b\n"x,y",2', ",");
    expect(rows).toEqual([
      ["a", "b"],
      ["x,y", "2"],
    ]);
  });
});

describe("inferType", () => {
  it("classifies common value shapes", () => {
    expect(inferType("123")).toBe("number");
    expect(inferType("89.00")).toBe("number");
    expect(inferType("2024-01-15")).toBe("date");
    expect(inferType("true")).toBe("bool");
    expect(inferType("")).toBe("empty");
    expect(inferType("hello")).toBe("string");
  });
});

describe("detectPii", () => {
  it("finds SSN, card, email, phone and marks severity", () => {
    const pii = detectPii(MESSY_CSV);
    const types = Object.fromEntries(pii.map((p) => [p.type, p.count]));
    expect(types.ssn).toBe(1);
    expect(types.card).toBe(1);
    expect(types.email).toBeGreaterThanOrEqual(5);
    expect(pii.some((p) => p.type === "ssn" && p.severe)).toBe(true);
  });
  it("redacts detected PII", () => {
    const out = redactPii("reach me at ada@example.com");
    expect(out).not.toContain("ada@example.com");
    expect(out).toContain("█");
  });
});

describe("chunkText", () => {
  it("produces at least one chunk and respects overlap", () => {
    const text = "x".repeat(5000);
    const a = chunkText(text, 512, 0);
    const b = chunkText(text, 512, 25);
    expect(a.count).toBeGreaterThan(1);
    expect(b.count).toBeGreaterThanOrEqual(a.count); // overlap → more chunks
    expect(a.estTokens).toBe(Math.round(5000 / 4));
  });
});

describe("buildReport + scoring", () => {
  const report = buildReport("customers_v2.csv", MESSY_CSV, MESSY_CSV.length);

  it("profiles the tabular file", () => {
    expect(report.kind).toBe("tabular");
    if (report.profile.kind === "tabular") {
      expect(report.profile.cols).toBe(8);
      expect(report.profile.dups).toBe(1);
      expect(report.profile.emptyRows).toBe(1);
    }
  });

  it("flags a critical PII blocker that gates the file", () => {
    const blocked = hasUnclearedBlocker(report.checks, new Set());
    expect(blocked).toBe(true);
    const gate = computeGate(report.baseScore, blocked);
    expect(gate.gate).toBe("Rejected");
  });

  it("clears the blocker and raises the score when fixes are applied", () => {
    const allFixes = new Set(report.checks.flatMap((c) => (c.fix ? [c.fix.id] : [])));
    const fixedScore = scoreWithFixes(report.checks, allFixes);
    expect(fixedScore).toBeGreaterThan(report.baseScore);
    expect(hasUnclearedBlocker(report.checks, allFixes)).toBe(false);
  });
});
