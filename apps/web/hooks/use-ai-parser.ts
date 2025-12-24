"use client";

import { useState, useCallback, useMemo } from "react";
import { TEMPLATES } from "@/lib/constants";
import type { CustomShortcut } from "@/lib/types";

export interface ParsedExpense {
  amount: number;
  label: string;
  category?: string;
  fromShortcut?: string; // The @keyword that was used
}

export interface UnknownShortcut {
  trigger: string; // e.g., "book"
  amount: number; // The amount typed with it
}

interface UseAiParserOptions {
  onSuccess?: (expenses: ParsedExpense[]) => void;
  onError?: (error: Error) => void;
  onUnknownShortcut?: (shortcut: UnknownShortcut) => void;
  shortcuts?: CustomShortcut[];
}

// Template shortcuts for instant parsing
const TEMPLATE_MAP = new Map(
  TEMPLATES.map((t) => [t.label.toLowerCase(), { amount: t.amount, label: t.label }])
);

// Common shortcuts
const SHORTCUTS: Record<string, { amount?: number; label: string; multiplier?: number }> = {
  "both ways": { label: "Commute", multiplier: 2 },
  "roundtrip": { label: "Commute", multiplier: 2 },
  "round trip": { label: "Commute", multiplier: 2 },
};

export function useAiParser({ onSuccess, onError, onUnknownShortcut, shortcuts = [] }: UseAiParserOptions = {}) {
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedExpense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingShortcut, setPendingShortcut] = useState<UnknownShortcut | null>(null);

  // Build shortcut map from custom shortcuts - memoized to update when shortcuts change
  const shortcutMap = useMemo(
    () => new Map(shortcuts.map((s) => [s.trigger.toLowerCase(), s])),
    [shortcuts]
  );

  // Parse @keyword patterns: "@book 500" → { trigger: "book", amount: 500 }
  const parseShortcutPattern = useCallback((input: string): { parsed: ParsedExpense | null; unknown: UnknownShortcut | null; remaining: string } => {
    // Match @keyword followed by amount
    const match = input.match(/@(\w+)\s+(\d+(?:\.\d+)?)/);
    if (!match) {
      return { parsed: null, unknown: null, remaining: input };
    }

    const trigger = match[1]?.toLowerCase() || "";
    const amount = parseFloat(match[2] || "0");
    const remaining = input.replace(match[0], "").trim();

    // Look up in custom shortcuts
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

    // Unknown shortcut - flag for creation
    return {
      parsed: null,
      unknown: { trigger, amount },
      remaining,
    };
  }, [shortcutMap]);

  // Local parsing for templates and shortcuts (instant, no API needed)
  const parseLocally = useCallback((input: string): ParsedExpense[] | null => {
    const normalized = input.toLowerCase().trim();
    const results: ParsedExpense[] = [];

    // First, check for @keyword patterns
    if (input.includes("@")) {
      const { parsed, unknown, remaining } = parseShortcutPattern(input);

      if (unknown) {
        // Store pending shortcut for UI to handle
        setPendingShortcut(unknown);
        onUnknownShortcut?.(unknown);
        return null; // Don't process further until shortcut is created
      }

      if (parsed) {
        results.push(parsed);
        setPendingShortcut(null);

        // Continue parsing remaining input if any
        if (remaining) {
          const moreResults = parseSimplePatterns(remaining);
          results.push(...moreResults);
        }

        return results.length > 0 ? results : null;
      }
    }

    setPendingShortcut(null);

    // Check for shortcuts first
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
        // Remove the shortcut from input for further parsing
        const remaining = normalized.replace(shortcut, "").trim();
        if (remaining) {
          // Continue parsing the rest
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
  }, [parseShortcutPattern, onUnknownShortcut]);

  // Parse simple patterns like "coffee 120" or "grab 180 and lunch"
  const parseSimplePatterns = (input: string): ParsedExpense[] => {
    const results: ParsedExpense[] = [];

    // Split by "and", "&", ","
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
      // e.g., "coffee 120", "120 coffee", "grab 180"
      const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch && numberMatch[1]) {
        const amount = parseFloat(numberMatch[1]);
        const labelPart = trimmed
          .replace(numberMatch[0], "")
          .replace(/[₱$]/g, "")
          .trim();

        // Check if label matches a template
        const template = TEMPLATE_MAP.get(labelPart.toLowerCase());

        results.push({
          amount: template ? template.amount : amount,
          label: template ? template.label : labelPart || "Expense",
          category: template?.label,
        });
      }
    }

    return results;
  };

  // AI parsing using Gemini (for complex inputs)
  const parseWithAi = useCallback(async (input: string): Promise<ParsedExpense[]> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const systemPrompt = `You are a financial expense parser. Extract expenses from natural language input.
Return a JSON array of objects with: { amount: number, label: string, category?: string }

Rules:
- If a number is mentioned, use it as the amount
- If no number but a known category (coffee, lunch, commute, snack), use common Filipino prices:
  - Coffee: 120
  - Commute: 45
  - Lunch: 180
  - Snack: 60
  - Grab/GrabFood: 180
  - Dinner: 250
- "both ways" or "roundtrip" means double the amount
- Split multiple items mentioned (e.g., "coffee and lunch" = 2 expenses)
- Currency is PHP (₱), ignore currency symbols in input

Examples:
"grab 180 and coffee" → [{"amount":180,"label":"GrabFood"},{"amount":120,"label":"Coffee"}]
"commute both ways" → [{"amount":45,"label":"Commute"},{"amount":45,"label":"Commute"}]
"spent 500 on dinner" → [{"amount":500,"label":"Dinner"}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("AI parsing failed");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  }, []);

  // Main parse function - tries local first, falls back to AI
  const parse = useCallback(
    async (input: string): Promise<ParsedExpense[]> => {
      if (!input.trim()) {
        setPreview([]);
        return [];
      }

      setError(null);

      // Try local parsing first (instant)
      const localResult = parseLocally(input);
      if (localResult && localResult.length > 0) {
        setPreview(localResult);
        return localResult;
      }

      // Fall back to AI parsing
      setIsParsing(true);
      try {
        const aiResult = await parseWithAi(input);
        setPreview(aiResult);
        return aiResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Parsing failed");
        setError(error.message);
        onError?.(error);
        return [];
      } finally {
        setIsParsing(false);
      }
    },
    [parseLocally, parseWithAi, onError]
  );

  // Submit and clear
  const submit = useCallback(async (input: string) => {
    const results = await parse(input);
    if (results.length > 0) {
      onSuccess?.(results);
      setPreview([]);
    }
    return results;
  }, [parse, onSuccess]);

  // Real-time preview (local only for speed)
  const updatePreview = useCallback((input: string) => {
    if (!input.trim()) {
      setPreview([]);
      return;
    }
    const localResult = parseLocally(input);
    setPreview(localResult || []);
  }, [parseLocally]);

  const clearPreview = useCallback(() => {
    setPreview([]);
    setError(null);
  }, []);

  // Clear pending shortcut
  const clearPendingShortcut = useCallback(() => {
    setPendingShortcut(null);
  }, []);

  return {
    parse,
    submit,
    updatePreview,
    clearPreview,
    clearPendingShortcut,
    preview,
    isParsing,
    error,
    pendingShortcut,
  };
}
