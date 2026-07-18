import "server-only";
import { createSupabaseAdminClient } from "@skilltego/database";
import { publicEnv } from "@/lib/env.public";
import { serverEnv } from "@/lib/env.server";

/** Bypasses RLS — use only for trusted server-side operations (e.g. admin tooling, webhooks). */
export function createAdminClient() {
  return createSupabaseAdminClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}
