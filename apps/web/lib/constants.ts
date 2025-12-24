export const CURRENCY = "₱";
export const DEFAULT_DAILY_LIMIT = 300;

export const TEMPLATES = [
  { id: "t1", label: "Coffee", amount: 120, icon: "☕" },
  { id: "t2", label: "Commute", amount: 45, icon: "🚌" },
  { id: "t3", label: "Lunch", amount: 180, icon: "🥗" },
  { id: "t4", label: "Dinner", amount: 250, icon: "🍲" },
  { id: "t5", label: "Snack", amount: 60, icon: "🍎" },
  { id: "t6", label: "Grab", amount: 180, icon: "🛵" },
  { id: "t7", label: "Groceries", amount: 500, icon: "🛒" },
  { id: "t8", label: "Shopping", amount: 300, icon: "🛍️" },
] as const;

export type Template = (typeof TEMPLATES)[number];
