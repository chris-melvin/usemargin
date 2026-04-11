import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { settingsRepository, budgetBucketRepository } from "@/lib/repositories";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel data fetches — no sequential waterfall
  const [userSettings, buckets] = await Promise.all([
    settingsRepository.getOrCreate(supabase, user.id),
    budgetBucketRepository.findAllOrdered(supabase, user.id),
  ]);

  const { tab } = await searchParams;

  return (
    <SettingsClient
      userSettings={userSettings}
      userEmail={user.email ?? ""}
      buckets={buckets}
      initialTab={tab ?? "general"}
    />
  );
}
