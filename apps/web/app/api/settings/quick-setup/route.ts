import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dailyLimit = 500, budgetSetupCompleted = true } = body;

    // Update user settings
    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          default_daily_limit: dailyLimit,
          budget_setup_completed: budgetSetupCompleted,
          total_monthly_income: 0,
          total_fixed_expenses: 0,
          calculated_daily_limit: dailyLimit,
        },
        {
          onConflict: "user_id",
        }
      );

    if (settingsError) {
      console.error("Error updating settings:", settingsError);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    // Update onboarding state
    const { error: onboardingError } = await supabase
      .from("user_onboarding")
      .upsert(
        {
          user_id: user.id,
          budget_setup_completed: true,
          budget_setup_step: 4, // Completed
        },
        {
          onConflict: "user_id",
        }
      );

    if (onboardingError) {
      console.error("Error updating onboarding:", onboardingError);
      // Non-critical, don't return error
    }

    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quick setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
