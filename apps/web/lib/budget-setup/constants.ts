import type { WizardBucket, BillCategory, BucketSuggestion } from "./types";

/**
 * @deprecated Use BUCKET_SUGGESTIONS instead for the new custom-only approach
 * Legacy default buckets - kept for backward compatibility with existing users
 */
export const DEFAULT_BUCKETS: Omit<WizardBucket, "allocatedAmount">[] = [
  {
    id: "savings",
    name: "Savings",
    slug: "savings",
    percentage: 20,
    targetAmount: null,
    color: "#22c55e", // green-500
    icon: "PiggyBank",
    isDefault: false,
    isSystem: true,
  },
  {
    id: "daily-spending",
    name: "Daily Spending",
    slug: "daily-spending",
    percentage: 60,
    targetAmount: null,
    color: "#1A9E9E", // teal-500 (brand primary)
    icon: "Wallet",
    isDefault: true, // Expenses go here by default
    isSystem: true,
  },
  {
    id: "flex",
    name: "Flex",
    slug: "flex",
    percentage: 20,
    targetAmount: null,
    color: "#8b5cf6", // violet-500
    icon: "Gift",
    isDefault: false,
    isSystem: true,
  },
];

/**
 * Bucket suggestions for the setup wizard
 * These are templates users can quickly add, not auto-created defaults
 * Users choose which ones they want and customize them
 */
export const BUCKET_SUGGESTIONS: BucketSuggestion[] = [
  {
    name: "Savings",
    slug: "savings",
    description: "Build your emergency fund and save for future goals",
    icon: "PiggyBank",
    color: "#22c55e", // green-500
    suggestedPercentage: 20,
  },
  {
    name: "Daily Spending",
    slug: "daily-spending",
    description: "Everyday expenses like food, transport, and essentials",
    icon: "Wallet",
    color: "#1A9E9E", // teal-500 (brand primary)
    suggestedPercentage: 50,
  },
  {
    name: "Flex",
    slug: "flex",
    description: "Guilt-free spending on anything you want",
    icon: "Gift",
    color: "#8b5cf6", // violet-500
    suggestedPercentage: 15,
  },
  {
    name: "Fun Money",
    slug: "fun-money",
    description: "Entertainment, dining out, and leisure activities",
    icon: "Gamepad2",
    color: "#ec4899", // pink-500
    suggestedPercentage: 10,
  },
  {
    name: "Groceries",
    slug: "groceries",
    description: "Weekly food and household supplies budget",
    icon: "ShoppingCart",
    color: "#f97316", // orange-500
    suggestedPercentage: 20,
  },
  {
    name: "Health",
    slug: "health",
    description: "Medical expenses, vitamins, and wellness",
    icon: "Stethoscope",
    color: "#ef4444", // red-500
    suggestedPercentage: 5,
  },
  {
    name: "Travel",
    slug: "travel",
    description: "Save for vacations and trips",
    icon: "Plane",
    color: "#3b82f6", // blue-500
    suggestedPercentage: 10,
  },
  {
    name: "Education",
    slug: "education",
    description: "Books, courses, and self-improvement",
    icon: "GraduationCap",
    color: "#6366f1", // indigo-500
    suggestedPercentage: 5,
  },
];

/**
 * Bill category options for the wizard
 */
export const BILL_CATEGORIES: Array<{
  value: BillCategory;
  label: string;
  icon: string;
}> = [
  { value: "housing", label: "Housing", icon: "Home" },
  { value: "utilities", label: "Utilities", icon: "Zap" },
  { value: "subscriptions", label: "Subscriptions", icon: "Tv" },
  { value: "loans", label: "Loans & Debt", icon: "CreditCard" },
  { value: "insurance", label: "Insurance", icon: "Shield" },
  { value: "other", label: "Other", icon: "MoreHorizontal" },
];

/**
 * Income frequency options
 */
export const INCOME_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "weekly", label: "Weekly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "once", label: "One-time" },
] as const;

/**
 * Bill frequency options
 */
export const BILL_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "once", label: "One-time" },
] as const;

/**
 * Bucket color options for custom buckets
 * Teal-first palette aligned with brand identity
 */
export const BUCKET_COLORS = [
  "#1A9E9E", // teal-500 (brand primary)
  "#E87356", // coral-500 (brand accent)
  "#22c55e", // green-500 (success)
  "#3b82f6", // blue-500 (info)
  "#8b5cf6", // violet-500
  "#D4A017", // warm gold (warning)
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
  "#64748b", // slate-500
];

/**
 * Bucket icon options for custom buckets
 */
export const BUCKET_ICONS = [
  "Wallet",
  "PiggyBank",
  "ShoppingCart",
  "Gamepad2",
  "Car",
  "Plane",
  "Gift",
  "Heart",
  "GraduationCap",
  "Home",
  "Utensils",
  "Film",
  "Music",
  "Dumbbell",
  "Stethoscope",
];
