import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/access-control";
import { AnalyticsContent } from "./analytics-content";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/analytics");
  }

  // Check feature access
  const accessResult = await checkFeatureAccess(supabase, user.id, "analytics");

  // If no access, show upgrade prompt
  if (!accessResult.hasAccess) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
        <UpgradePrompt
          accessResult={accessResult}
          variant="card"
          className="max-w-md w-full"
        />
      </div>
    );
  }

  // User has access, render analytics
  return <AnalyticsContent />;
}
