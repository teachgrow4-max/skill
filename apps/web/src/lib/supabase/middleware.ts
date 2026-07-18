import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@skilltego/database";
import { publicEnv } from "@/lib/env.public";

const PROTECTED_PREFIXES = ["/profile/edit", "/onboarding", "/settings", "/feed", "/bookmarks"];
const AUTH_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtected) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && pathname !== "/onboarding" && !pathname.startsWith("/api")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}
