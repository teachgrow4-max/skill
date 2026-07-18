import { redirect } from "next/navigation";
import { getProfileById } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";

const DASHBOARD_ROUTES: Record<string, string> = {
  company: "/dashboard/company",
  college: "/dashboard/college",
  mentor: "/dashboard/mentor",
};

export default async function DashboardIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfileById(supabase, user.id);
  const target = profile ? DASHBOARD_ROUTES[profile.account_type] : undefined;

  redirect(target ?? "/feed");
}
