import { cache } from "react";
import { getProfileById } from "@skilltego/database";
import { createClient } from "./server";

// The app shell renders several independent Server Components per request
// (top bar, sidebar, bottom nav, the page itself) that each need the current
// user/profile. supabase.auth.getUser() always makes a network round-trip to
// revalidate the JWT (unlike getSession()), so calling it separately in each
// of those components turned one navigation into several redundant auth
// round-trips. React's cache() dedupes these to one call per request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  return getProfileById(supabase, user.id);
});
