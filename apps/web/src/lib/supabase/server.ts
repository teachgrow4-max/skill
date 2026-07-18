import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@skilltego/database";
import { publicEnv } from "@/lib/env.public";

export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — middleware handles session refresh instead.
        }
      },
    },
  );
}
