import type { Metadata } from "next";
import { LABS, progress } from "@labs/kit";

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
  /** Social-share card (1200×630), resolved against metadataBase. */
  ogImage: string;
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
    ogImage: "/og-command-center.png",
  },
  portfolio: {
    domain: "https://portfolio.sudeeplalka.com",
    titleDefault: "Sudeep Lalka: Technology Strategy & AI Artifacts",
    titleTemplate: "%s · Sudeep Lalka",
    description:
      `A portfolio of ${progress().shipped} shipped catalog artifacts, plus the enterprise AI lifecycle. Explore the architecture, economics, governance and adoption decisions through working scenarios and inspectable models.`,
    homeTitle: "Sudeep Lalka: Technology Strategy & AI Artifacts",
    attribution: "Technology Strategy & AI Artifacts · portfolio.sudeeplalka.com",
    ogImage: "/og-portfolio.png",
  },
};

export const CURRENT_SITE = SITE_CONFIG[SITE];

/** Source revision of the experience upgrade; never used as a data verification date. */
export const EXPERIENCE_REVISION = "2026-10-05";
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local preview";

/** Public source-backed routes. Redirect aliases, settings and create forms are omitted. */
export const PUBLIC_ROUTES = [...new Set([
  "/", "/lifecycle", "/industries", "/storylines", "/story", "/story/brief", "/architecture", "/roadmap", "/changelog",
  "/frame", "/frame/guide", "/data", "/data/guide", "/data/overview", "/data/corpus", "/data/pipeline",
  "/build", "/build/guide", "/build/overview", "/build/dataset", "/build/retrieval", "/build/answers", "/build/traces",
  "/build/model", "/build/evaluations", "/build/failures", "/build/quality-gates", "/build/agents", "/build/training", "/build/internals",
  "/deploy", "/deploy/guide", "/govern", "/govern/guide", "/govern/live", "/govern/risk", "/govern/readiness", "/govern/maturity", "/govern/value",
  "/govern/use-cases", "/govern/playground", "/govern/policies", "/govern/evals", "/govern/review-queue", "/govern/audit-logs", "/govern/evidence", "/govern/brief", "/govern/docs", "/govern/arcade",
  "/realize", "/realize/guide", "/operate", "/operate/guide",
  ...LABS.filter((lab) => lab.status === "shipped" && lab.href?.startsWith("/")).map((lab) => lab.href as string),
])];

export function routeMetadata(title: string, description: string, path: string): Metadata {
  const url = `${CURRENT_SITE.domain}${path}`;
  return {
    title, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: CURRENT_SITE.titleDefault, images: [{ url: CURRENT_SITE.ogImage, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [CURRENT_SITE.ogImage] },
  };
}
