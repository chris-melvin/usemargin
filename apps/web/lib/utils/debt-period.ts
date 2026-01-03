import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, parseISO, format } from "date-fns";
import type { BillFrequency } from "@repo/database";

/**
 * Calculate the billing period for a debt payment
 */
export function calculatePeriod(
  paymentDateStr: string,
  frequency: BillFrequency,
  startDateStr?: string | null
): { periodStart: string; periodEnd: string } {
  const paymentDate = parseISO(paymentDateStr);

  switch (frequency) {
    case "monthly": {
      const start = startOfMonth(paymentDate);
      const end = endOfMonth(paymentDate);
      return {
        periodStart: format(start, "yyyy-MM-dd"),
        periodEnd: format(end, "yyyy-MM-dd"),
      };
    }

    case "weekly": {
      const start = startOfWeek(paymentDate, { weekStartsOn: 0 });
      const end = endOfWeek(paymentDate, { weekStartsOn: 0 });
      return {
        periodStart: format(start, "yyyy-MM-dd"),
        periodEnd: format(end, "yyyy-MM-dd"),
      };
    }

    case "biweekly": {
      // For biweekly, we calculate based on the start date if provided
      // Otherwise, use the first day of the year as anchor
      const anchor = startDateStr ? parseISO(startDateStr) : new Date(paymentDate.getFullYear(), 0, 1);
      const daysSinceAnchor = Math.floor((paymentDate.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
      const periodNumber = Math.floor(daysSinceAnchor / 14);
      const start = addDays(anchor, periodNumber * 14);
      const end = addDays(start, 13);
      return {
        periodStart: format(start, "yyyy-MM-dd"),
        periodEnd: format(end, "yyyy-MM-dd"),
      };
    }

    case "yearly": {
      const start = new Date(paymentDate.getFullYear(), 0, 1);
      const end = new Date(paymentDate.getFullYear(), 11, 31);
      return {
        periodStart: format(start, "yyyy-MM-dd"),
        periodEnd: format(end, "yyyy-MM-dd"),
      };
    }

    case "once":
    default: {
      // For one-time payments, the period is just the payment date
      return {
        periodStart: paymentDateStr,
        periodEnd: paymentDateStr,
      };
    }
  }
}
