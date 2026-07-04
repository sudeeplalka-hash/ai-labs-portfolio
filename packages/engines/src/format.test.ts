import { describe, it, expect } from "vitest";
import { provenanceFooter, csvCell, toCsv } from "./format";

const d = new Date("2026-07-04T12:00:00Z");

describe("provenanceFooter", () => {
  it("stamps the date and scenario and defaults to SIMULATED", () => {
    const f = provenanceFooter({ scenario: "Card portfolio" }, d);
    expect(f).toContain("2026-07-04");
    expect(f).toContain("Card portfolio");
    expect(f).toContain("SIMULATED");
  });
  it("honours an explicit LIVE mode", () => {
    expect(provenanceFooter({ scenario: "x", mode: "LIVE" }, d)).toContain("· LIVE ·");
  });
  it("includes a custom note when provided", () => {
    expect(provenanceFooter({ scenario: "x", note: "Custom caveat" }, d)).toContain("Custom caveat");
  });
});

describe("csvCell", () => {
  it("passes plain values through unquoted", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
  });
  it("quotes and escapes commas, quotes, and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('she said "hi"')).toBe('"she said ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("joins rows and cells, terminating with a newline", () => {
    expect(toCsv([["a", "b"], [1, 2]])).toBe("a,b\n1,2\n");
  });
  it("escapes cells within the grid", () => {
    expect(toCsv([["x,y", "z"]])).toBe('"x,y",z\n');
  });
});
