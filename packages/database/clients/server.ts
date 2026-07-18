import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@skilltego/types";

export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: CookieOptions }[]): void;
}

/**
 * Framework-agnostic Supabase server client factory. The Next.js app wires
 * this to `next/headers` cookies() so this package stays free of Next deps.
 */
export function createSupabaseServerClient(url: string, anonKey: string, cookies: CookieAdapter) {
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) =>
        cookies.setAll(cookiesToSet),
    },
  });
}
