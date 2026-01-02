import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { settingsRepository, budgetBucketRepository } from "@/lib/repositories";
import { getSubscription } from "@/actions/subscriptions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user settings
  const userSettings = await settingsRepository.getOrCreate(supabase, user.id);

  // Fetch buckets
  const buckets = await budgetBucketRepository.findAllOrdered(supabase, user.id);

  // Fetch subscription info
  const subscriptionResult = await getSubscription();
  const subscription = subscriptionResult.success ? subscriptionResult.data : null;

  return (
    <SettingsClient
      userSettings={userSettings}
      userEmail={user.email ?? ""}
      subscription={subscription}
      buckets={buckets}
    />
  );
}
