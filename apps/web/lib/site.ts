// Single build-time switch that lets ONE codebase power TWO deploys.
//
//   NEXT_PUBLIC_SITE=command-center → ai-labs.sudeeplalka.com  (the AI Program Command Center)
//   NEXT_PUBLIC_SITE=portfolio      → portfolio.sudeeplalka.com (the AI Delivery Leadership Portfolio)
//   (unset)                         → portfolio  (default; existing behavior unchanged)
//
// Next.js inlines NEXT_PUBLIC_* at build time, and each Vercel project builds with its
// own value, so the two sites compile the right landing/metadata from the SAME commit.
// One `git push` redeploys both, no more drift between "two repos".

export type SiteId = "command-center" | "portfolio";

export const SITE: SiteId =
  process.env.NEXT_PUBLIC_SITE === "command-center" ? "command-center" : "portfolio";

export const IS_COMMAND_CENTER = SITE === "command-center";

interface SiteConfig {
  /** Canonical origin, drives metadataBase, sitemap, robots. */
  domain: string;
  /** Fallback <title> for pages that don't set their own. */
  titleDefault: string;
  /** Template applied to page-level titles, e.g. "Frame · AI Command Center". */
  titleTemplate: string;
  /** Default description / OG description. */
  description: string;
  /** Absolute <title> for the landing page. */
  homeTitle: string;
  /** Short attribution used in downloaded-artifact provenance footers. */
  attribution: string;
}

export const SITE_CONFIG: Record<SiteId, SiteConfig> = {
  "command-center": {
    domain: "https://ai-labs.sudeeplalka.com",
    titleDefault: "AI Program Command Center",
    titleTemplate: "%s · AI Command Center",
    description:
      "A working command center for enterprise AI delivery: take one real initiative from a rough idea to a board ready business case, across Frame, Data, Build, Deploy, Govern, Realize, and Operate, with shared state and stage gates.",
    homeTitle: "AI Program Command Center: one initiative, end to end",
    attribution: "AI Program Command Center · ai-labs.sudeeplalka.com",
  },
  portfolio: {
    domain: "https://portfolio.sudeeplalka.com",
    titleDefault: "Sudeep Lalka: Enterprise AI and Technology Strategy Portfolio",
    titleTemplate: "%s · Sudeep Lalka",
    description:
      "A working portfolio of enterprise AI and technology strategy artifacts organized around architecture choices, delivery governance, financial impact, risk, operating models, and adoption. Each module maps technical work to the decisions senior leaders make when funding, architecting, governing, scaling, or operating AI programs.",
    homeTitle: "Sudeep Lalka: Enterprise AI and Technology Strategy Portfolio",
    attribution: "Enterprise AI and Technology Strategy Portfolio · portfolio.sudeeplalka.com",
  },
};

export const CURRENT_SITE = SITE_CONFIG[SITE];
