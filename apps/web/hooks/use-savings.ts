"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

const STORAGE_KEY = "usemargin_savings";
const PREFS_KEY = "usemargin_savings_prefs";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  icon?: string;
  color?: string;
  createdAt: string;
}

interface SavingsPreferences {
  showInAllocation: boolean; // Whether to show savings in income allocation chart
}

// Load from localStorage
function loadSavings(): SavingsGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadPreferences(): SavingsPreferences {
  if (typeof window === "undefined") return { showInAllocation: true };
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? JSON.parse(stored) : { showInAllocation: true };
  } catch {
    return { showInAllocation: true };
  }
}

// Save to localStorage
function saveSavingsData(savings: SavingsGoal[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savings));
  } catch {
    console.error("Failed to save savings to localStorage");
  }
}

function savePreferences(prefs: SavingsPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    console.error("Failed to save savings preferences");
  }
}

export function useSavings(monthlyAllocation: number = 0) {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [preferences, setPreferences] = useState<SavingsPreferences>({
    showInAllocation: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSavingsGoals(loadSavings());
    setPreferences(loadPreferences());
    setIsLoaded(true);
  }, []);

  // Add a new savings goal
  const addSavingsGoal = useCallback(
    (goal: Omit<SavingsGoal, "id" | "createdAt">) => {
      const newGoal: SavingsGoal = {
        ...goal,
        id: `savings-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      setSavingsGoals((prev) => {
        const updated = [...prev, newGoal];
        saveSavingsData(updated);
        return updated;
      });
      return newGoal;
    },
    []
  );

  // Update a savings goal
  const updateSavingsGoal = useCallback(
    (id: string, updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>) => {
      setSavingsGoals((prev) => {
        const updated = prev.map((goal) =>
          goal.id === id ? { ...goal, ...updates } : goal
        );
        saveSavingsData(updated);
        return updated;
      });
    },
    []
  );

  // Delete a savings goal
  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => {
      const updated = prev.filter((goal) => goal.id !== id);
      saveSavingsData(updated);
      return updated;
    });
  }, []);

  // Add to a savings goal balance
  const contributeToGoal = useCallback((id: string, amount: number) => {
    setSavingsGoals((prev) => {
      const updated = prev.map((goal) =>
        goal.id === id
          ? { ...goal, currentBalance: goal.currentBalance + amount }
          : goal
      );
      saveSavingsData(updated);
      return updated;
    });
  }, []);

  // Withdraw from a savings goal
  const withdrawFromGoal = useCallback((id: string, amount: number) => {
    setSavingsGoals((prev) => {
      const updated = prev.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              currentBalance: Math.max(0, goal.currentBalance - amount),
            }
          : goal
      );
      saveSavingsData(updated);
      return updated;
    });
  }, []);

  // Toggle visibility in allocation chart
  const toggleAllocationVisibility = useCallback((show: boolean) => {
    setPreferences((prev) => {
      const updated = { ...prev, showInAllocation: show };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // Calculate totals
  const totalSaved = useMemo(() => {
    return savingsGoals.reduce((sum, goal) => sum + goal.currentBalance, 0);
  }, [savingsGoals]);

  const totalTarget = useMemo(() => {
    return savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  }, [savingsGoals]);

  const overallProgress = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.min(100, (totalSaved / totalTarget) * 100);
  }, [totalSaved, totalTarget]);

  // Get progress for a specific goal
  const getGoalProgress = useCallback((goalId: string): number => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal || goal.targetAmount === 0) return 0;
    return Math.min(100, (goal.currentBalance / goal.targetAmount) * 100);
  }, [savingsGoals]);

  return {
    savingsGoals,
    preferences,
    isLoaded,
    monthlyAllocation,
    totalSaved,
    totalTarget,
    overallProgress,
    showInAllocation: preferences.showInAllocation,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
    withdrawFromGoal,
    toggleAllocationVisibility,
    getGoalProgress,
  };
}
