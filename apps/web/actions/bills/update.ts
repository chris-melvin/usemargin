"use server";

import { revalidatePath } from "next/cache";
import { updateBillSchema, type UpdateBillInput } from "@/lib/validations/bill.schema";
import { billRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Debt } from "@repo/database";

export async function updateBill(
  id: string,
  data: UpdateBillInput
): Promise<ActionResult<Debt>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = updateBillSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const bill = await billRepository.update(supabase, id, userId, validation.data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(bill);
  } catch (err) {
    console.error("Failed to update bill:", err);
    return error("Failed to update bill", "DATABASE_ERROR");
  }
}
