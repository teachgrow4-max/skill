import type { MetadataRoute } from "next";
import { siteConfig } from "@skilltego/config";

// Only pages a logged-out visitor (and a search crawler) can actually open.
// Everything else — profiles, explore, opportunities — is behind the login
// wall in middleware, so listing it would just hand crawlers a redirect to
// /login (and publicly enumerate usernames, private accounts included).
const PUBLIC_ROUTES = [
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));
}
