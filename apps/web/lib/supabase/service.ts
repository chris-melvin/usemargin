import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with service role key
 * Use this for admin operations that need to bypass RLS (e.g., webhooks)
 *
 * WARNING: This client has full access to the database.
 * Only use in server-side code where you control the logic.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
