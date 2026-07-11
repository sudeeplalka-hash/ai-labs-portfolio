import { describe, it, expect } from "vitest";
import { formatMoney, formatMoneyPerYear, formatMonths, formatMonthsShort } from "./format";

describe("formatMoney, the one money style", () => {
  it("uses $X.XM at or above one million", () => {
    expect(formatMoney(2_545_000)).toBe("$2.5M");
    expect(formatMoney(2_400_000)).toBe("$2.4M");
    expect(formatMoney(1_000_000)).toBe("$1M");
    expect(formatMoney(3_400_000)).toBe("$3.4M");
  });
  it("uses $XXXk between one thousand and one million", () => {
    expect(formatMoney(24_000)).toBe("$24k");
    expect(formatMoney(281_000)).toBe("$281k");
    expect(formatMoney(260_000)).toBe("$260k");
  });
  it("promotes 999.5k+ to the M band instead of printing $1000k", () => {
    expect(formatMoney(999_600)).toBe("$1M");
    expect(formatMoney(999_400)).toBe("$999k");
  });
  it("prints whole dollars below one thousand and handles sign", () => {
    expect(formatMoney(999)).toBe("$999");
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(-1_200_000)).toBe("-$1.2M");
    expect(formatMoney(-24_000)).toBe("-$24k");
  });
  it("spells annual values consistently", () => {
    expect(formatMoneyPerYear(2_545_000)).toBe("$2.5M/yr");
  });
});

describe("formatMonths, pluralization", () => {
  it("pluralizes correctly", () => {
    expect(formatMonths(1)).toBe("1 month");
    expect(formatMonths(8)).toBe("8 months");
    expect(formatMonths(0.6)).toBe("1 month");
    expect(formatMonths(34)).toBe("34 months");
  });
  it("has a compact chip spelling", () => {
    expect(formatMonthsShort(8.2)).toBe("8mo");
  });
});
