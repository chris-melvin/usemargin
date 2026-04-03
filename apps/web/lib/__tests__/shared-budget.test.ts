import { describe, it, expect } from "vitest";
import {
  calculateSimpleDailyLimit,
  getDaysInMonth,
} from "@repo/shared/budget";

describe("calculateSimpleDailyLimit", () => {
  it("calculates correctly for normal values", () => {
    // (50000 - 20000) / 30 = 1000
    expect(calculateSimpleDailyLimit(50000, 20000, 30)).toBe(1000);
  });

  it("floors the result", () => {
    // (50000 - 20000) / 31 = 967.74... → 967
    expect(calculateSimpleDailyLimit(50000, 20000, 31)).toBe(967);
  });

  it("returns 0 when expenses exceed income", () => {
    expect(calculateSimpleDailyLimit(20000, 60000, 30)).toBe(0);
  });

  it("returns 0 when both income and expenses are 0", () => {
    expect(calculateSimpleDailyLimit(0, 0, 30)).toBe(0);
  });

  it("returns 0 when daysInMonth is 0", () => {
    expect(calculateSimpleDailyLimit(50000, 20000, 0)).toBe(0);
  });

  it("handles no fixed expenses", () => {
    // 50000 / 30 = 1666.66... → 1666
    expect(calculateSimpleDailyLimit(50000, 0, 30)).toBe(1666);
  });

  it("handles expenses equal to income", () => {
    expect(calculateSimpleDailyLimit(50000, 50000, 30)).toBe(0);
  });
});

describe("getDaysInMonth", () => {
  it("returns 31 for January", () => {
    expect(getDaysInMonth(2026, 0)).toBe(31);
  });

  it("returns 28 for February in non-leap year", () => {
    expect(getDaysInMonth(2026, 1)).toBe(28);
  });

  it("returns 29 for February in leap year", () => {
    expect(getDaysInMonth(2028, 1)).toBe(29);
  });

  it("returns 30 for April", () => {
    expect(getDaysInMonth(2026, 3)).toBe(30);
  });
});
