/**
 * Onboarding Tour Step Definitions
 */

export type TooltipPosition = "top" | "bottom" | "left" | "right" | "center";

export interface OnboardingStep {
  id: string;
  target: string; // data-onboarding-target attribute value
  title: string;
  description: string;
  position: TooltipPosition;
  mobilePosition?: TooltipPosition;
  highlight?: boolean;
  action?: "click" | "type" | "observe";
  emoji?: string;
  celebration?: boolean; // Show confetti on this step
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    target: "smart-input-bar",
    title: "Add Your First Expense",
    description:
      'Type naturally like "coffee 120" or "lunch and grab 380" and press Enter. We\'ll figure out the rest!',
    position: "top",
    mobilePosition: "top",
    highlight: true,
    action: "type",
    emoji: "✨",
  },
  {
    id: "budget-status",
    target: "header-status",
    title: "Your Daily Budget",
    description:
      "You have ₱300 to spend each day. This shows how much is left. Tap to see more details!",
    position: "bottom",
    mobilePosition: "bottom",
    highlight: true,
    action: "click",
    emoji: "💰",
  },
  {
    id: "budget-colors",
    target: "header-status",
    title: "Color = Status",
    description:
      "Green means you're on track. Amber means watch your spending. Red means you've gone over.",
    position: "bottom",
    mobilePosition: "bottom",
    highlight: true,
    action: "observe",
    emoji: "🚦",
  },
  {
    id: "calendar-day",
    target: "calendar-today",
    title: "Tap Any Day",
    description:
      "See all your expenses, bills, and income for that day. Past days show how well you did!",
    position: "left",
    mobilePosition: "bottom",
    highlight: true,
    action: "click",
    emoji: "📅",
  },
  {
    id: "quick-add",
    target: "quick-add-grid",
    title: "Quick Add Buttons",
    description:
      "Tap these for common expenses. You can also create your own shortcuts with @keywords!",
    position: "left",
    mobilePosition: "top",
    highlight: true,
    action: "observe",
    emoji: "⚡",
    celebration: true, // Confetti on the last step!
  },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;
