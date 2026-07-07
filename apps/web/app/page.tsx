import type { Metadata } from "next";
import { CompetencyMap } from "@/components/map/CompetencyMap";
import { Home } from "@/components/shell/Home";
import { IS_COMMAND_CENTER, CURRENT_SITE } from "@/lib/site";

// Layer 0, the landing differs per deploy (one codebase, two sites; see lib/site.ts):
//   portfolio      → the Competency Map / four-altitudes gallery (Appendix 1)
//   command-center → the AI Program Command Center lifecycle home (Home)
export const metadata: Metadata = IS_COMMAND_CENTER
  ? {
      title: { absolute: CURRENT_SITE.homeTitle },
      description: CURRENT_SITE.description,
    }
  : {
      title: "Sudeep Lalka: Enterprise AI and Technology Strategy Portfolio",
      description:
        "A working portfolio of enterprise AI and technology strategy artifacts organized around architecture choices, delivery governance, financial impact, risk, operating models, and adoption. Each module maps technical work to the decisions senior leaders make when funding, architecting, governing, scaling, or operating AI programs.",
    };

export default function Page() {
  return IS_COMMAND_CENTER ? <Home /> : <CompetencyMap />;
}
