/**
 * Bill due date utility functions
 */

/**
 * Calculate days until bill is due based on due_date (day of month)
 * Handles month boundary logic for recurring bills
 */
export function getDaysUntilDue(dueDay: number | null): number | null {
  if (!dueDay || dueDay < 1 || dueDay > 31) return null;

  const today = new Date();
  const currentDay = today.getDate();
  const daysInCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  // Adjust dueDay if it exceeds days in current month
  const adjustedDueDay = Math.min(dueDay, daysInCurrentMonth);

  if (adjustedDueDay >= currentDay) {
    // Due later this month
    return adjustedDueDay - currentDay;
  } else {
    // Due next month - wrap around
    const daysInNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0
    ).getDate();
    const nextMonthDueDay = Math.min(dueDay, daysInNextMonth);
    return daysInCurrentMonth - currentDay + nextMonthDueDay;
  }
}

/**
 * Get urgency level for badge styling
 */
export type DueUrgency =
  | "overdue"
  | "today"
  | "tomorrow"
  | "soon"
  | "upcoming"
  | "later";

export function getDueUrgency(
  daysUntil: number | null,
  status: string
): DueUrgency {
  if (status === "paid") return "later";
  if (status === "overdue") return "overdue";
  if (daysUntil === null) return "later";
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil <= 3) return "soon";
  if (daysUntil <= 7) return "upcoming";
  return "later";
}

/**
 * Format due date display text
 */
export function formatDueText(
  daysUntil: number | null,
  status: string
): string {
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (daysUntil === null) return "";
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
}

/**
 * Get the color scheme for each urgency level
 */
export function getUrgencyColors(urgency: DueUrgency): {
  bg: string;
  text: string;
  icon: string;
} {
  const colors: Record<DueUrgency, { bg: string; text: string; icon: string }> =
    {
      overdue: {
        bg: "bg-rose-100",
        text: "text-rose-700",
        icon: "text-rose-500",
      },
      today: {
        bg: "bg-coral-100",
        text: "text-coral-700",
        icon: "text-coral-500",
      },
      tomorrow: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: "text-amber-500",
      },
      soon: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        icon: "text-amber-400",
      },
      upcoming: {
        bg: "bg-teal-50",
        text: "text-teal-600",
        icon: "text-teal-400",
      },
      later: {
        bg: "bg-neutral-100",
        text: "text-neutral-500",
        icon: "text-neutral-400",
      },
    };
  return colors[urgency];
}
