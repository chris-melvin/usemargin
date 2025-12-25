/**
 * Progressive Hint Definitions
 *
 * These hints appear contextually as users discover features,
 * helping them learn advanced functionality over time.
 */

export type HintTrigger = "feature_discovery" | "usage_count" | "time_based";

export interface ProgressiveHint {
  id: string;
  trigger: HintTrigger;
  condition: {
    feature?: string;
    count?: number;
    daysActive?: number;
  };
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  emoji?: string;
}

export const PROGRESSIVE_HINTS: ProgressiveHint[] = [
  {
    id: "create-shortcut",
    trigger: "feature_discovery",
    condition: { feature: "unknown_shortcut_typed" },
    target: "create-shortcut-modal",
    title: "Create a Shortcut!",
    description:
      "Save this as a shortcut so next time you can just type @shortcut and the amount.",
    position: "bottom",
    emoji: "📌",
  },
  {
    id: "insights-tab",
    trigger: "feature_discovery",
    condition: { feature: "insights_tab_clicked" },
    target: "insights-content",
    title: "Your Spending Patterns",
    description:
      "See where your money goes each week and get personalized suggestions to save more.",
    position: "top",
    emoji: "📊",
  },
  {
    id: "income-bill-indicators",
    trigger: "usage_count",
    condition: { count: 5 },
    target: "calendar-grid",
    title: "Income & Bill Days",
    description:
      "Green dots show payday, red dots show bills due. Plan your spending around them!",
    position: "top",
    emoji: "📆",
  },
  {
    id: "keyboard-shortcuts",
    trigger: "usage_count",
    condition: { count: 20 },
    target: "smart-input-bar",
    title: "Pro Tip: Keyboard Shortcuts",
    description:
      "Press / or Cmd+K to quickly focus the input bar from anywhere on the page.",
    position: "top",
    emoji: "⌨️",
  },
  {
    id: "analytics-dashboard",
    trigger: "time_based",
    condition: { daysActive: 7 },
    target: "analytics-link",
    title: "Deep Dive Analytics",
    description:
      "You've been tracking for a week! Check out the analytics dashboard for detailed insights.",
    position: "bottom",
    emoji: "🎯",
  },
  {
    id: "multi-expense",
    trigger: "usage_count",
    condition: { count: 10 },
    target: "smart-input-bar",
    title: "Add Multiple at Once",
    description:
      'Try "coffee and lunch and grab" to log multiple expenses in one go!',
    position: "top",
    emoji: "🚀",
  },
];

/**
 * Check if a hint should be shown based on current state
 */
export function shouldShowHint(
  hint: ProgressiveHint,
  state: {
    featuresDiscovered: Record<string, string>;
    hintsShown: Record<string, { dismissed: boolean }>;
    expenseCount: number;
    daysActive: number;
  }
): boolean {
  // Already dismissed
  if (state.hintsShown[hint.id]?.dismissed) {
    return false;
  }

  switch (hint.trigger) {
    case "feature_discovery":
      return hint.condition.feature
        ? !!state.featuresDiscovered[hint.condition.feature]
        : false;

    case "usage_count":
      return hint.condition.count
        ? state.expenseCount >= hint.condition.count
        : false;

    case "time_based":
      return hint.condition.daysActive
        ? state.daysActive >= hint.condition.daysActive
        : false;

    default:
      return false;
  }
}
