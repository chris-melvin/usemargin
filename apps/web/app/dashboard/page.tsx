import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { OnboardingProvider, OnboardingTour } from "@/components/onboarding";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";
import { settingsRepository, budgetBucketRepository } from "@/lib/repositories";
import type { Expense, UserOnboarding, UserSettings, BudgetBucket } from "@repo/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  let expenses: Expense[] = [];
  let onboardingState: UserOnboarding | null = null;
  let userSettings: UserSettings | null = null;
  let buckets: BudgetBucket[] = [];

  // Fetch user settings
  try {
    userSettings = await settingsRepository.getOrCreate(supabase, user.id);

    // Redirect to setup if budget setup not completed
    // But only after the UI tour is complete (or skipped)
    if (!userSettings.budget_setup_completed) {
      // Check if onboarding tour is done first
      const onboarding = await onboardingRepository.getOrCreate(supabase, user.id);
      if (onboarding.has_completed_tour || onboarding.tour_skipped_at) {
        redirect("/setup");
      }
    }
  } catch (err) {
    // Settings table might not have new columns yet, continue without redirect
    console.warn("User settings not available:", err);
  }

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

  // Fetch budget buckets
  try {
    buckets = await budgetBucketRepository.findAll(supabase, user.id);
    console.log("[dashboard/page.tsx] Fetched buckets:", buckets.length, buckets.map(b => b.slug));
  } catch (err) {
    console.warn("Budget buckets not available:", err);
  }

  // Fetch onboarding state (creates default if new user)
  try {
    onboardingState = await onboardingRepository.getOrCreate(supabase, user.id);
  } catch (err) {
    // Onboarding table might not exist yet, continue without it
    console.warn("Onboarding state not available:", err);
  }

  return (
    <OnboardingProvider initialState={onboardingState}>
      <DashboardClient
        initialExpenses={expenses}
        dailyLimit={userSettings?.default_daily_limit}
        initialBuckets={buckets}
      />
      <OnboardingTour />
    </OnboardingProvider>
  );
}
