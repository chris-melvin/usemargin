"use server";

import { revalidatePath } from "next/cache";
import { updateIncomeSchema, type UpdateIncomeInput } from "@/lib/validations/income.schema";
import { incomeRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Income } from "@repo/database";

export async function updateIncome(
  id: string,
  data: UpdateIncomeInput
): Promise<ActionResult<Income>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = updateIncomeSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const income = await incomeRepository.update(supabase, id, userId, validation.data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(income);
  } catch (err) {
    console.error("Failed to update income:", err);
    return error("Failed to update income", "DATABASE_ERROR");
  }
}
