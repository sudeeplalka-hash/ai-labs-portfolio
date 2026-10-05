import type { Metadata } from "next";
import { CompetencyMap } from "@/components/map/CompetencyMap";
import { Home } from "@/components/shell/Home";
import { IS_COMMAND_CENTER, CURRENT_SITE } from "@/lib/site";

// Layer 0, the landing differs per deploy (one codebase, two sites; see lib/site.ts):
//   portfolio      → the Competency Map / four-altitudes gallery (Appendix 1)
//   command-center → the AI Program Command Center lifecycle home (Home)
export const metadata: Metadata = {
  title: { absolute: CURRENT_SITE.homeTitle },
  description: CURRENT_SITE.description,
  alternates: { canonical: `${CURRENT_SITE.domain}/` },
  openGraph: { title: CURRENT_SITE.homeTitle, description: CURRENT_SITE.description, url: `${CURRENT_SITE.domain}/`, images: [{ url: CURRENT_SITE.ogImage, width: 1200, height: 630 }] },
};

export default function Page() {
  return IS_COMMAND_CENTER ? <Home /> : <CompetencyMap />;
}
