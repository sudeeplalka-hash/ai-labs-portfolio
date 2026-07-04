import type { MetadataRoute } from "next";
import { ALL_USE_CASES } from "@labs/kit";

const BASE = "https://portfolio.sudeeplalka.com";

// Layer 0 + the 23 new labs + Collection-1 stage roots + utility pages.
const ROUTES = [
  "", "/lifecycle", "/changelog", "/industries", "/storylines",
  // Collection 1 (existing lifecycle)
  "/frame", "/data", "/build", "/deploy", "/govern", "/realize",
  // Collection 2 · Agent & Protocol
  "/agents/mcp-playground", "/agents/loop-inspector", "/agents/orchestration", "/agents/structured-output",
  "/agents/context-memory", "/agents/cost-simulator", "/agents/protocol-selection", "/agents/hitl",
  // Collection 3 · Business of AI
  "/business/portfolio", "/business/build-buy", "/business/cost-forecaster", "/business/vendor-monitor", "/business/roi-builder",
  // Collection 4 · Engagement Leadership
  "/engagement/adoption", "/engagement/stakeholders", "/engagement/capacity", "/engagement/raid-radar", "/engagement/compliance",
  "/engagement/talent", "/engagement/rfp", "/engagement/estimation", "/engagement/onboarding", "/engagement/exec-comms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const ucPaths = ALL_USE_CASES.map((uc) => `/industries/uc/${uc.id}`);
  return [...ROUTES, ...ucPaths].map((r) => ({
    url: `${BASE}${r || "/"}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: r === "" ? 1 : 0.7,
  }));
}
