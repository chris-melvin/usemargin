import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { ThreePillarsDashboard } from "@/components/dashboard/three-pillars-dashboard";
import { TimezoneProvider } from "@/components/providers";
import { settingsRepository } from "@/lib/repositories";
import * as dateUtils from "@/lib/utils/date";

export default async function OverviewPage() {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  let userSettings = null;

  // Fetch user settings
  try {
    userSettings = await settingsRepository.getOrCreate(supabase, user.id);
  } catch (err) {
    console.warn("User settings not available:", err);
  }

  // Use user's timezone from settings, fallback to UTC
  const timezone = userSettings?.timezone ?? dateUtils.DEFAULT_TIMEZONE;

  return (
    <TimezoneProvider initialTimezone={timezone}>
      <div className="container mx-auto max-w-6xl py-6">
        <ThreePillarsDashboard />
      </div>
    </TimezoneProvider>
  );
}
