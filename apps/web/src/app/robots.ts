import type { MetadataRoute } from "next";
import { siteConfig } from "@skilltego/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/feed", "/messages", "/dashboard", "/admin", "/moderation", "/settings", "/onboarding"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
