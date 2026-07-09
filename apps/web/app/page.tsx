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
      title: "Sudeep Lalka — Technology Strategy & AI Artifacts",
      description:
        "A portfolio of 23 interactive AI artifacts that turn the architecture, economics, governance, and adoption decisions behind enterprise AI into tools that actually run — strategy you can open, pressure-test, and take into the boardroom.",
    };

export default function Page() {
  return IS_COMMAND_CENTER ? <Home /> : <CompetencyMap />;
}
