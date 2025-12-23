export const CURRENCY = "₱";
export const DEFAULT_DAILY_LIMIT = 300;

export const TEMPLATES = [
  { id: "t1", label: "Coffee", amount: 120, icon: "☕" },
  { id: "t2", label: "Commute", amount: 45, icon: "🚌" },
  { id: "t3", label: "Lunch", amount: 180, icon: "🥗" },
  { id: "t4", label: "Snack", amount: 60, icon: "🍎" },
] as const;

export type Template = (typeof TEMPLATES)[number];
