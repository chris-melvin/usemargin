"use server";

import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validations";
import { type ActionResult, error, success } from "@/lib/errors";

export async function forgotPassword(formData: FormData): Promise<ActionResult<void>> {
  const rawData = {
    email: formData.get("email"),
  };

  const validation = resetPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    validation.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    }
  );

  if (resetError) {
    return error(resetError.message, "INTERNAL_ERROR");
  }

  // Always return success to prevent email enumeration
  return success(undefined);
}
