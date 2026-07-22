import "server-only";
import { NextResponse, userAgent, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@skilltego/database";
import { publicEnv } from "@/lib/env.public";

// Routes only a logged-out visitor should see. An authenticated user hitting any
// of these (including "/", the landing page) is bounced straight to /feed.
const GUEST_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password"];

// Routes that must stay reachable regardless of auth state and must never
// trigger the guest-only or onboarding redirects (password recovery links and
// email verification arrive with a transient session; OAuth callback routes
// run before a session exists; marketing pages are informational).
const ALWAYS_PUBLIC_PREFIXES = [
  "/reset-password",
  "/verify-email",
  "/auth",
  "/about",
  "/community-guidelines",
  "/contact",
  "/faq",
  "/features",
  "/pricing",
  "/privacy",
  "/terms",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

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

  // Phones never see the marketing landing page — it's a desktop-only entry
  // point. Mobile visitors land straight on /login (or /feed if already signed in).
  if (pathname === "/" && userAgent(request).device.type === "mobile") {
    return NextResponse.redirect(new URL(user ? "/feed" : "/login", request.url));
  }

  const isApiRoute = pathname.startsWith("/api");
  const isGuestOnly = pathname === "/" || matchesPrefix(pathname, GUEST_ONLY_PREFIXES);
  const isAlwaysPublic = matchesPrefix(pathname, ALWAYS_PUBLIC_PREFIXES);
  const isPublic = isGuestOnly || isAlwaysPublic || isApiRoute;

  // Deny by default: any route that isn't explicitly public requires a session.
  // This automatically covers future authenticated pages without touching this list.
  // API routes are excluded — they return JSON and enforce their own auth, so a
  // redirect to the /login HTML page would break their contract.
  if (!user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Logged-in users never see the landing page, login, signup, or forgot-password.
  if (user && isGuestOnly) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (user && pathname !== "/onboarding" && !isAlwaysPublic && !pathname.startsWith("/api")) {
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
