import type { MetadataRoute } from "next";
import { siteUrl } from "@/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Staff area, customers' private booking pages and the internal API.
      disallow: ["/staff", "/booking/", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
