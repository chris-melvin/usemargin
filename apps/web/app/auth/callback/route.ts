import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { settingsRepository } from "@/lib/repositories";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/email-confirmed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure user records exist after successful verification
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          // Create default settings and onboarding records
          await settingsRepository.getOrCreate(supabase, user.id);
          await onboardingRepository.getOrCreate(supabase, user.id);
        } catch (e) {
          console.error("Failed to create user records:", e);
          // Don't fail the callback if record creation fails
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Error case: redirect to error page
  return NextResponse.redirect(`${origin}/auth-error`);
}
