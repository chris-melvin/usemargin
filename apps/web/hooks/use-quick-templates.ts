"use client";

import { useState, useEffect, useCallback } from "react";

export interface QuickTemplate {
  id: string;
  icon: string;
  label: string;
  amount: number;
}

const DEFAULT_TEMPLATES: QuickTemplate[] = [
  { id: "1", icon: "☕", label: "Coffee", amount: 120 },
  { id: "2", icon: "🚌", label: "Commute", amount: 45 },
  { id: "3", icon: "🍱", label: "Lunch", amount: 180 },
  { id: "4", icon: "🍽️", label: "Dinner", amount: 250 },
  { id: "5", icon: "🍿", label: "Snack", amount: 60 },
  { id: "6", icon: "🛵", label: "Grab", amount: 180 },
  { id: "7", icon: "🛒", label: "Groceries", amount: 500 },
  { id: "8", icon: "🛍️", label: "Shopping", amount: 300 },
];

const STORAGE_KEY = "usemargin-quick-templates";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useQuickTemplates() {
  const [templates, setTemplates] = useState<QuickTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load templates from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever templates change (after initial load)
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates, isLoaded]);

  const addTemplate = useCallback((template: Omit<QuickTemplate, "id">) => {
    const newTemplate: QuickTemplate = {
      ...template,
      id: generateId(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<Omit<QuickTemplate, "id">>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    setTemplates(DEFAULT_TEMPLATES);
  }, []);

  const reorderTemplates = useCallback((newOrder: QuickTemplate[]) => {
    setTemplates(newOrder);
  }, []);

  return {
    templates,
    isLoaded,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    resetToDefaults,
    reorderTemplates,
  };
}
