"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signInSchema } from "@/lib/validations";
import { type ActionResult, error } from "@/lib/errors";

export async function signIn(formData: FormData): Promise<ActionResult<void>> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = signInSchema.safeParse(rawData);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (authError) {
    return error(authError.message, "UNAUTHORIZED");
  }

  // Get redirect URL from form data or default to home
  const redirectTo = formData.get("redirectTo")?.toString() || "/";
  redirect(redirectTo);
}
