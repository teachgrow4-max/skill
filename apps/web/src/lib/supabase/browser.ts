import { createSupabaseBrowserClient } from "@skilltego/database";
import { publicEnv } from "@/lib/env.public";

export function createClient() {
  return createSupabaseBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
