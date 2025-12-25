import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { OnboardingProvider, OnboardingTour } from "@/components/onboarding";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";
import type { Expense, UserOnboarding } from "@repo/database";

export default async function Home() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let expenses: Expense[] = [];
  let onboardingState: UserOnboarding | null = null;

  if (user) {
    // Fetch expenses for current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDate = startOfMonth.toISOString().split("T")[0];
    const endDate = endOfMonth.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      expenses = data as Expense[];
    }

    // Fetch onboarding state (creates default if new user)
    try {
      onboardingState = await onboardingRepository.getOrCreate(supabase, user.id);
    } catch (err) {
      // Onboarding table might not exist yet, continue without it
      console.warn("Onboarding state not available:", err);
    }
  }

  return (
    <OnboardingProvider initialState={onboardingState}>
      <DashboardClient initialExpenses={expenses} />
      <OnboardingTour />
    </OnboardingProvider>
  );
}
