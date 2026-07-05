import type { MetadataRoute } from "next";
import { CURRENT_SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${CURRENT_SITE.domain}/sitemap.xml`,
  };
}
