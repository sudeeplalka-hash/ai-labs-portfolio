import type { MetadataRoute } from "next";
import { ALL_USE_CASES } from "@labs/kit";
import { CURRENT_SITE, EXPERIENCE_REVISION, PUBLIC_ROUTES } from "@/lib/site";

export const dynamic = "force-static";

// Next 14 uses an optional metadata segment in dev even for this single sitemap.
// Declaring its empty parameter keeps output:export's route check consistent.
export function generateStaticParams() {
  return [{ __metadata_id__: [] }];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const scenarios = ALL_USE_CASES.map((uc) => `/industries/uc/${uc.id}`);
  return [...new Set([...PUBLIC_ROUTES, ...scenarios])].map((path) => ({
    url: `${CURRENT_SITE.domain}${path}`,
    lastModified: new Date(`${EXPERIENCE_REVISION}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path.startsWith("/industries/uc/") ? 0.6 : 0.7,
  }));
}
