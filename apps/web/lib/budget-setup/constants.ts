import type { WizardBucket, BillCategory } from "./types";

/**
 * Default budget buckets - 3 common buckets to start
 * Users can add more via "Add Custom Bucket"
 */
export const DEFAULT_BUCKETS: Omit<WizardBucket, "allocatedAmount">[] = [
  {
    id: "savings",
    name: "Savings",
    slug: "savings",
    percentage: 20,
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
    color: "#3b82f6", // blue-500
    icon: "Wallet",
    isDefault: true, // Expenses go here by default
    isSystem: true,
  },
  {
    id: "flex",
    name: "Flex",
    slug: "flex",
    percentage: 20,
    color: "#8b5cf6", // violet-500
    icon: "Gift",
    isDefault: false,
    isSystem: true,
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
 */
export const BUCKET_COLORS = [
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#06b6d4", // cyan-500
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
