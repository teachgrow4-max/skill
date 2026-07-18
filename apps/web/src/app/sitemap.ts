import type { MetadataRoute } from "next";
import { siteConfig } from "@skilltego/config";
import { createClient } from "@/lib/supabase/server";

const STATIC_ROUTES = [
  "",
  "/about",
  "/features",
  "/pricing",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/community-guidelines",
  "/login",
  "/signup",
  "/explore",
  "/opportunities",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));

  // Best-effort: public profile pages help discovery, but the sitemap must
  // still build even if the database is unreachable at build time.
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);

    const profileEntries: MetadataRoute.Sitemap = (data ?? []).map((profile) => ({
      url: `${siteConfig.url}/profile/${profile.username}`,
      lastModified: new Date(profile.updated_at),
    }));

    return [...staticEntries, ...profileEntries];
  } catch {
    return staticEntries;
  }
}
