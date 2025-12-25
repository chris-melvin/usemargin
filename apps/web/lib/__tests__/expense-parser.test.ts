import { describe, it, expect } from "vitest";
import { TEMPLATES } from "../constants";

// Extract parsing logic for testing without React hooks
// This mirrors the logic in use-ai-parser.ts

interface ParsedExpense {
  amount: number;
  label: string;
  category?: string;
  fromShortcut?: string;
}

interface CustomShortcut {
  trigger: string;
  label: string;
  category?: string;
}

// Template map from constants
const TEMPLATE_MAP = new Map(
  TEMPLATES.map((t) => [t.label.toLowerCase(), { amount: t.amount, label: t.label }])
);

// Built-in shortcuts
const SHORTCUTS: Record<string, { amount?: number; label: string; multiplier?: number }> = {
  "both ways": { label: "Commute", multiplier: 2 },
  roundtrip: { label: "Commute", multiplier: 2 },
  "round trip": { label: "Commute", multiplier: 2 },
};

/**
 * Parse @keyword patterns
 */
function parseShortcutPattern(
  input: string,
  shortcutMap: Map<string, CustomShortcut>
): { parsed: ParsedExpense | null; unknown: { trigger: string; amount: number } | null; remaining: string } {
  const match = input.match(/@(\w+)\s+(\d+(?:\.\d+)?)/);
  if (!match) {
    return { parsed: null, unknown: null, remaining: input };
  }

  const trigger = match[1]?.toLowerCase() || "";
  const amount = parseFloat(match[2] || "0");
  const remaining = input.replace(match[0], "").trim();

  const shortcut = shortcutMap.get(trigger);
  if (shortcut) {
    return {
      parsed: {
        amount,
        label: shortcut.label,
        category: shortcut.category,
        fromShortcut: trigger,
      },
      unknown: null,
      remaining,
    };
  }

  return {
    parsed: null,
    unknown: { trigger, amount },
    remaining,
  };
}

/**
 * Parse simple patterns like "coffee 120" or "grab 180 and lunch"
 */
function parseSimplePatterns(input: string): ParsedExpense[] {
  const results: ParsedExpense[] = [];
  const parts = input.split(/\s+(?:and|&)\s+|,\s*/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if it's just a template name
    const templateMatch = TEMPLATE_MAP.get(trimmed);
    if (templateMatch) {
      results.push({
        amount: templateMatch.amount,
        label: templateMatch.label,
      });
      continue;
    }

    // Pattern: "label amount" or "amount label"
    const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch && numberMatch[1]) {
      const amount = parseFloat(numberMatch[1]);
      const labelPart = trimmed
        .replace(numberMatch[0], "")
        .replace(/[₱$]/g, "")
        .trim();

      const template = TEMPLATE_MAP.get(labelPart.toLowerCase());

      results.push({
        amount: template ? template.amount : amount,
        label: template ? template.label : labelPart || "Expense",
        category: template?.label,
      });
    }
  }

  return results;
}

/**
 * Full local parsing (mirrors parseLocally in hook)
 */
function parseLocally(
  input: string,
  shortcutMap: Map<string, CustomShortcut> = new Map()
): ParsedExpense[] | null {
  const normalized = input.toLowerCase().trim();
  const results: ParsedExpense[] = [];

  // Check for @keyword patterns first
  if (input.includes("@")) {
    const { parsed, unknown, remaining } = parseShortcutPattern(input, shortcutMap);

    if (unknown) {
      return null; // Unknown shortcut, needs user action
    }

    if (parsed) {
      results.push(parsed);
      if (remaining) {
        const moreResults = parseSimplePatterns(remaining);
        results.push(...moreResults);
      }
      return results.length > 0 ? results : null;
    }
  }

  // Check for built-in shortcuts
  for (const [shortcut, config] of Object.entries(SHORTCUTS)) {
    if (normalized.includes(shortcut)) {
      const template = TEMPLATE_MAP.get(config.label.toLowerCase());
      if (template) {
        const count = config.multiplier || 1;
        for (let i = 0; i < count; i++) {
          results.push({
            amount: template.amount,
            label: template.label,
          });
        }
      }
      const remaining = normalized.replace(shortcut, "").trim();
      if (remaining) {
        const moreResults = parseSimplePatterns(remaining);
        results.push(...moreResults);
      }
      return results.length > 0 ? results : null;
    }
  }

  // Try simple patterns
  const simpleResults = parseSimplePatterns(normalized);
  if (simpleResults.length > 0) {
    return simpleResults;
  }

  return null;
}

describe("Expense Parser", () => {
  describe("parseSimplePatterns", () => {
    it("should parse 'coffee 120' format", () => {
      const result = parseSimplePatterns("coffee 120");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        amount: 120, // Uses template amount
        label: "Coffee",
        category: "Coffee",
      });
    });

    it("should parse '120 coffee' format", () => {
      const result = parseSimplePatterns("120 coffee");
      expect(result).toHaveLength(1);
      expect(result[0]?.label).toBe("Coffee");
    });

    it("should parse multiple items with 'and'", () => {
      const result = parseSimplePatterns("coffee 100 and lunch 150");
      expect(result).toHaveLength(2);
      expect(result[0]?.label).toBe("Coffee");
      expect(result[1]?.label).toBe("Lunch");
    });

    it("should parse multiple items with '&'", () => {
      const result = parseSimplePatterns("coffee 100 & snack 50");
      expect(result).toHaveLength(2);
    });

    it("should parse multiple items with comma", () => {
      const result = parseSimplePatterns("coffee 100, lunch 150");
      expect(result).toHaveLength(2);
    });

    it("should use template amount for known labels", () => {
      const result = parseSimplePatterns("coffee 999");
      // Template amount (120) should be used, not 999
      expect(result[0]?.amount).toBe(120);
    });

    it("should use provided amount for unknown labels", () => {
      const result = parseSimplePatterns("taxi 250");
      expect(result[0]?.amount).toBe(250);
      expect(result[0]?.label).toBe("taxi");
    });

    it("should handle template name alone", () => {
      const result = parseSimplePatterns("coffee");
      expect(result).toHaveLength(1);
      expect(result[0]?.amount).toBe(120); // Template default amount
    });

    it("should strip currency symbols", () => {
      const result = parseSimplePatterns("₱500 food");
      expect(result[0]?.amount).toBe(500);
    });

    it("should handle decimal amounts", () => {
      const result = parseSimplePatterns("coffee 99.5");
      // Should use template amount
      expect(result[0]?.amount).toBe(120);
    });

    it("should return empty array for invalid input", () => {
      const result = parseSimplePatterns("");
      expect(result).toHaveLength(0);
    });

    it("should handle whitespace-only input", () => {
      const result = parseSimplePatterns("   ");
      expect(result).toHaveLength(0);
    });
  });

  describe("parseShortcutPattern", () => {
    const shortcutMap = new Map<string, CustomShortcut>([
      ["starbucks", { trigger: "starbucks", label: "Starbucks Coffee", category: "Coffee" }],
      ["jollibee", { trigger: "jollibee", label: "Jollibee", category: "Food" }],
    ]);

    it("should parse @keyword amount format", () => {
      const result = parseShortcutPattern("@starbucks 150", shortcutMap);
      expect(result.parsed).toEqual({
        amount: 150,
        label: "Starbucks Coffee",
        category: "Coffee",
        fromShortcut: "starbucks",
      });
      expect(result.unknown).toBeNull();
    });

    it("should detect unknown shortcuts", () => {
      const result = parseShortcutPattern("@unknown 200", shortcutMap);
      expect(result.parsed).toBeNull();
      expect(result.unknown).toEqual({ trigger: "unknown", amount: 200 });
    });

    it("should extract remaining text", () => {
      const result = parseShortcutPattern("@starbucks 150 and lunch", shortcutMap);
      expect(result.remaining).toBe("and lunch");
    });

    it("should return original input if no @ pattern", () => {
      const result = parseShortcutPattern("coffee 120", shortcutMap);
      expect(result.parsed).toBeNull();
      expect(result.unknown).toBeNull();
      expect(result.remaining).toBe("coffee 120");
    });

    it("should handle @ without proper format", () => {
      const result = parseShortcutPattern("@starbucks", shortcutMap);
      // No amount, so no match
      expect(result.parsed).toBeNull();
    });

    it("should be case-insensitive for trigger", () => {
      const result = parseShortcutPattern("@STARBUCKS 150", shortcutMap);
      expect(result.parsed?.label).toBe("Starbucks Coffee");
    });
  });

  describe("parseLocally (full parser)", () => {
    const shortcutMap = new Map<string, CustomShortcut>([
      ["sb", { trigger: "sb", label: "Starbucks", category: "Coffee" }],
    ]);

    it("should parse custom shortcuts", () => {
      const result = parseLocally("@sb 180", shortcutMap);
      expect(result).toHaveLength(1);
      expect(result?.[0]?.label).toBe("Starbucks");
      expect(result?.[0]?.amount).toBe(180);
    });

    it("should return null for unknown shortcuts", () => {
      const result = parseLocally("@unknown 100", shortcutMap);
      expect(result).toBeNull();
    });

    it("should parse 'both ways' shortcut", () => {
      const result = parseLocally("both ways");
      expect(result).toHaveLength(2);
      expect(result?.[0]?.label).toBe("Commute");
      expect(result?.[1]?.label).toBe("Commute");
    });

    it("should parse 'roundtrip' shortcut", () => {
      const result = parseLocally("roundtrip");
      expect(result).toHaveLength(2);
      expect(result?.[0]?.label).toBe("Commute");
    });

    it("should parse 'round trip' shortcut", () => {
      const result = parseLocally("round trip");
      expect(result).toHaveLength(2);
      expect(result?.[0]?.label).toBe("Commute");
    });

    it("should combine shortcut with additional items", () => {
      const result = parseLocally("@sb 180 and lunch 200", shortcutMap);
      expect(result?.length).toBeGreaterThanOrEqual(2);
    });

    it("should fall back to simple patterns", () => {
      const result = parseLocally("grab 180");
      expect(result).toHaveLength(1);
      expect(result?.[0]?.label).toBe("Grab");
    });

    it("should return null for unparseable input", () => {
      const result = parseLocally("hello world");
      expect(result).toBeNull();
    });
  });

  describe("Template Validation", () => {
    it("should have all expected templates", () => {
      const templateLabels = TEMPLATES.map((t) => t.label);
      expect(templateLabels).toContain("Coffee");
      expect(templateLabels).toContain("Lunch");
      expect(templateLabels).toContain("Dinner");
      expect(templateLabels).toContain("Commute");
      expect(templateLabels).toContain("Grab");
    });

    it("should have valid amounts for all templates", () => {
      for (const template of TEMPLATES) {
        expect(template.amount).toBeGreaterThan(0);
        expect(typeof template.amount).toBe("number");
      }
    });

    it("should have unique IDs for all templates", () => {
      const ids = TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(TEMPLATES.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large amounts", () => {
      const result = parseSimplePatterns("expense 999999");
      expect(result[0]?.amount).toBe(999999);
    });

    it("should handle zero amount", () => {
      const result = parseSimplePatterns("free 0");
      expect(result[0]?.amount).toBe(0);
    });

    it("should handle special characters in label", () => {
      // Note: Numbers at start of labels get parsed as amounts
      // Testing with letter-prefixed labels
      const result = parseSimplePatterns("sari-sari 100");
      expect(result[0]?.label).toBe("sari-sari");
      expect(result[0]?.amount).toBe(100);
    });

    it("should handle mixed case input", () => {
      const result = parseSimplePatterns("COFFEE 120");
      expect(result[0]?.label).toBe("Coffee");
    });

    it("should handle extra whitespace", () => {
      const result = parseSimplePatterns("  coffee   120  ");
      expect(result).toHaveLength(1);
    });

    it("should handle multiple 'and' in sequence", () => {
      const result = parseSimplePatterns("coffee 100 and lunch 150 and dinner 200");
      expect(result).toHaveLength(3);
    });
  });
});
