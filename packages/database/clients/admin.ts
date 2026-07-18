import { createClient } from "@supabase/supabase-js";
import type { Database } from "@skilltego/types";

/**
 * Service-role client. Bypasses RLS — server-only, never import from
 * client components or expose the service role key to the browser.
 */
export function createSupabaseAdminClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
