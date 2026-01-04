import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { incomeRepository, billRepository, settingsRepository, budgetBucketRepository } from "@/lib/repositories";
import { BudgetClient } from "./budget-client";

export default async function BudgetPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all data in parallel
  const [incomes, bills, userSettings, buckets] = await Promise.all([
    incomeRepository.findActive(supabase, user.id),
    billRepository.findActive(supabase, user.id),
    settingsRepository.getOrCreate(supabase, user.id),
    budgetBucketRepository.findAllOrdered(supabase, user.id),
  ]);

  return (
    <BudgetClient
      initialIncomes={incomes}
      initialBills={bills}
      userSettings={userSettings}
      initialBuckets={buckets}
    />
  );
}
