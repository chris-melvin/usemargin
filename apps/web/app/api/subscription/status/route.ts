import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserAccessState } from "@/lib/access-control";

/**
 * GET /api/subscription/status
 *
 * Returns the current user's subscription and credits status.
 * Used by client-side hooks to refresh state.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await getUserAccessState(supabase, user.id);

    return NextResponse.json({
      subscription: state.subscription,
      credits: state.credits,
    });
  } catch (err) {
    console.error("Failed to get subscription status:", err);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
