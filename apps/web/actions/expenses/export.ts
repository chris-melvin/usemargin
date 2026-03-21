"use server";

import { expenseRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";

/**
 * Export all user expenses as CSV string
 */
export async function exportExpensesCSV(): Promise<ActionResult<string>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const expenses = await expenseRepository.findAll(supabase, userId, {
      orderBy: "occurred_at" as any,
      ascending: false,
    });

    if (expenses.length === 0) {
      return error("No expenses to export", "NOT_FOUND");
    }

    const headers = ["Date", "Amount", "Label", "Category", "Notes"];
    const rows = expenses.map((e) => [
      e.occurred_at,
      e.amount.toString(),
      csvEscape(e.label),
      csvEscape(e.category ?? ""),
      csvEscape(e.notes ?? ""),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return success(csv);
  } catch (err) {
    console.error("Failed to export expenses:", err);
    return error("Failed to export expenses", "DATABASE_ERROR");
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
