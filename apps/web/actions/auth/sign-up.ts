"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signUpSchema } from "@/lib/validations";
import { type ActionResult, error } from "@/lib/errors";
import { settingsRepository } from "@/lib/repositories";

export async function signUp(formData: FormData): Promise<ActionResult<void>> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = signUpSchema.safeParse(rawData);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (authError) {
    return error(authError.message, "DATABASE_ERROR");
  }

  // Create default settings for the new user
  if (authData.user) {
    try {
      await settingsRepository.getOrCreate(supabase, authData.user.id);
    } catch (e) {
      console.error("Failed to create default settings:", e);
      // Don't fail signup if settings creation fails
    }
  }

  // Get redirect URL from form data or default to home
  const redirectTo = formData.get("redirectTo")?.toString() || "/";
  redirect(redirectTo);
}
