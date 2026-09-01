import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Pairs with app/sitemap.ts.
 *
 * The disallowed paths are not secrets — they are all behind auth already —
 * but there is nothing for a crawler to index in a signed-in dashboard or an
 * API route, and letting it try wastes crawl budget on pages that will only
 * redirect it to a login screen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/login", "/signup", "/reset-password", "/forgot-password"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
