/**
 * Calculate a simple daily spending limit from monthly income and fixed expenses.
 *
 * Used by both web and mobile to ensure consistent budget calculation.
 */
export function calculateSimpleDailyLimit(
  monthlyIncome: number,
  fixedExpenses: number,
  daysInMonth: number
): number {
  if (daysInMonth <= 0) return 0;
  return Math.max(0, Math.floor((monthlyIncome - fixedExpenses) / daysInMonth));
}

/**
 * Get the number of days in a given month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the number of days in the current month.
 */
export function getDaysInCurrentMonth(): number {
  const now = new Date();
  return getDaysInMonth(now.getFullYear(), now.getMonth());
}
