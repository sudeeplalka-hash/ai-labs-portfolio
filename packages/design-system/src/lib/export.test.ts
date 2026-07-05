import { describe, it, expect } from "vitest";
import { toCsv, scenarioToJson, parseScenarioJson } from "./export";

describe("toCsv", () => {
  it("joins headers and rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[1, 2], [3, 4]])).toBe("a,b\r\n1,2\r\n3,4");
  });
  it("quotes fields containing a comma, quote, or newline and doubles inner quotes", () => {
    expect(toCsv(["x", "y"], [["a,b", 'he said "hi"']])).toBe('x,y\r\n"a,b","he said ""hi"""');
    expect(toCsv(["x"], [["line1\nline2"]])).toBe('x\r\n"line1\nline2"');
  });
  it("renders null/undefined as empty and leaves plain values unquoted", () => {
    expect(toCsv(["a", "b", "c"], [[null, undefined, "plain"]])).toBe("a,b,c\r\n,,plain");
  });
});

describe("scenario JSON round-trip", () => {
  it("serializes and parses back to an equal object", () => {
    const scenario = { v: "fund", budget: 5, book: [{ id: "x", spendM: 1.2 }], edited: true };
    const json = scenarioToJson(scenario);
    expect(json).toContain("\n"); // pretty-printed
    expect(parseScenarioJson<typeof scenario>(json)).toEqual(scenario);
  });
  it("throws on malformed JSON so callers can guard", () => {
    expect(() => parseScenarioJson("{not json")).toThrow();
  });
});
