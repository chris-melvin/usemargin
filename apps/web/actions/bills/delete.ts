"use server";

import { revalidatePath } from "next/cache";
import { billRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Debt } from "@repo/database";

export async function deleteBill(id: string): Promise<ActionResult<Debt>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    // Soft delete (deactivate) the bill
    const bill = await billRepository.deactivate(supabase, id, userId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(bill);
  } catch (err) {
    console.error("Failed to delete bill:", err);
    return error("Failed to delete bill", "DATABASE_ERROR");
  }
}
