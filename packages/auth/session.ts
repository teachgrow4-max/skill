import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUser, Database } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function getCurrentUser(client: Client): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    emailVerified: user.email_confirmed_at !== null,
  };
}
