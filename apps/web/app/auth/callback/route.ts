import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import { settingsRepository } from "@/lib/repositories";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/email-confirmed";

  if (code) {
    // Create redirect response FIRST so we can attach cookies to it
    const redirectUrl = `${origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);

    // Create Supabase client that writes cookies directly to the response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user and create default records
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          // Use service client for DB operations (bypasses RLS, doesn't need response cookies)
          const serviceSupabase = createServiceClient();
          await settingsRepository.getOrCreate(serviceSupabase, user.id);
          await onboardingRepository.getOrCreate(serviceSupabase, user.id);
        } catch (e) {
          console.error("Failed to create user records:", e);
        }
      }

      return response; // Response now has session cookies attached
    }
  }

  return NextResponse.redirect(`${origin}/auth-error`);
}
