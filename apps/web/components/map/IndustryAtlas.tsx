"use client";

// Industry Atlas, the breadth artifact. Coverage is COMPUTED from the use case
// registry (USE_CASE_COVERAGE), never asserted, so the headline can't drift from
// what actually ships. Rows = industries (sorted by depth); each use case links to
// its lab. Filter by industry to answer "show me everything you've done in X".

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  INDUSTRIES,
  USE_CASE_COVERAGE,
  ALL_USE_CASES,
  labHref,
  type IndustryKey,
} from "@labs/kit";

// labId → route + display name (the Atlas links each scenario to its lab).
const LAB_META: Record<string, { name: string; href: string; collection: string }> = {
  "GAP-01": { name: "MCP Server Contract Workbench", href: "/agents/mcp-playground", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-02": { name: "Agent Failure and Recovery Inspector", href: "/agents/loop-inspector", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-03": { name: "Multiagent Orchestration Economics Board", href: "/agents/orchestration", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-04": { name: "Structured Output Reliability Gate", href: "/agents/structured-output", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-05": { name: "Context and Memory Strategy Evaluator", href: "/agents/context-memory", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-06": { name: "Token Economics Simulator", href: "/agents/cost-simulator", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-07": { name: "Protocol Selection Decision Model", href: "/agents/protocol-selection", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-08": { name: "Human Review and Autonomy Control Simulator", href: "/agents/hitl", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "C3-1": { name: "AI Portfolio Capital Allocation Dashboard", href: "/business/portfolio", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-2": { name: "Build, Buy, or Fine Tune Decision Evaluator", href: "/business/build-buy", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-3": { name: "Inference Run Rate Forecaster", href: "/business/cost-forecaster", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-4": { name: "Vendor Selection and Concentration Risk Monitor", href: "/business/vendor-monitor", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-5": { name: "AI Business Case and ROI Builder", href: "/business/roi-builder", collection: "AI Investment Strategy and Portfolio Governance" },
  "EL-01": { name: "Adoption Readiness Decision Instrument", href: "/engagement/adoption", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-02": { name: "Stakeholder and Sponsor Alignment Cockpit", href: "/engagement/stakeholders", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-03": { name: "Capacity and Skills Coverage Planner", href: "/engagement/capacity", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-04": { name: "Delivery Health and RAID Radar", href: "/engagement/raid-radar", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-05": { name: "AI Compliance Readiness Navigator", href: "/engagement/compliance", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-06": { name: "Talent and Upskilling Pathway Planner", href: "/engagement/talent", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-07": { name: "RFP and Bid Decision War Room", href: "/engagement/rfp", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-08": { name: "Estimation and Scope Control Studio", href: "/engagement/estimation", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-09": { name: "Onboarding and Knowledge Transfer Tracker", href: "/engagement/onboarding", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-10": { name: "Executive Communication Decision Studio", href: "/engagement/exec-comms", collection: "Operating Model and Transformation Leadership Artifacts" },
};

export function IndustryAtlas() {
  const [filter, setFilter] = useState<IndustryKey | null>(null);
  const [firstHandOnly, setFirstHandOnly] = useState(false);
  const cov = USE_CASE_COVERAGE;

  const industryKeys = (Object.keys(cov.byIndustry) as IndustryKey[]).sort(
    (a, b) => cov.byIndustry[b].total - cov.byIndustry[a].total || a.localeCompare(b),
  );
  const visible = industryKeys.filter((k) => !firstHandOnly || cov.byIndustry[k].firstHand > 0);
  const shown = filter ? visible.filter((k) => k === filter) : visible;

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">Industry Atlas</span>
          <Link href="/storylines" className="ml-auto text-xs font-medium text-primary hover:underline">Storylines →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-6">
          <p className="eyebrow mb-1">Breadth · computed from the registry</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            One operator, <span className="text-primary">{cov.industries} industries</span>
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            The same instruments, applied across the industries where AI is being deployed today. {cov.firstHandDomains}{" "}
            of them are firsthand, and the rest are studied and labeled as such. Every count here is computed from the
            use case registry, not asserted. Pick an industry to see everything in it.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
            <span className="rounded-md border border-line bg-white px-2.5 py-1 text-slatey-400">{cov.industries} industries</span>
            <span className="rounded-md border border-line bg-white px-2.5 py-1 text-slatey-400">{cov.firstHandDomains} firsthand domains</span>
            <span className="rounded-md border border-line bg-white px-2.5 py-1 text-slatey-400">{cov.scenarios} worked scenarios</span>
          </div>
        </div>

        {/* Industry filter */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter(null)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === null ? "border-ink bg-ink text-white" : "border-line bg-white text-slatey-400 hover:text-ink"
            }`}
          >
            All industries
          </button>
          <button
            onClick={() => setFirstHandOnly((v) => !v)}
            aria-pressed={firstHandOnly}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              firstHandOnly ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:text-ink"
            }`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" /> Firsthand only
          </button>
          {visible.map((k) => {
            const ind = INDUSTRIES[k];
            const on = filter === k;
            return (
              <button
                key={k}
                onClick={() => setFilter(on ? null : k)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${on ? "text-white" : "bg-white text-slatey-400 hover:text-ink"}`}
                style={on ? { background: ind.accent, borderColor: ind.accent } : { borderColor: `${ind.accent}44` }}
              >
                <span aria-hidden>{ind.emoji}</span>
                <span>{ind.label}</span>
                <span className={on ? "text-white/80" : "text-slatey-500"}>{cov.byIndustry[k].total}</span>
              </button>
            );
          })}
        </div>

        {/* Coverage grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((k) => {
            const ind = INDUSTRIES[k];
            const c = cov.byIndustry[k];
            const cases = ALL_USE_CASES.filter((uc) => uc.industry === k && (!firstHandOnly || uc.provenance.kind === "firsthand"));
            return (
              <div key={k} className="rounded-xl border bg-white p-4" style={{ borderColor: `${ind.accent}33`, borderLeftWidth: 3, borderLeftColor: ind.accent }}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span aria-hidden className="text-lg">{ind.emoji}</span>
                  <span className="text-sm font-semibold text-ink">{ind.label}</span>
                  {c.firstHand > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: ind.accent }}>
                      {c.firstHand} firsthand
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs text-slatey-500">{c.total} scenario{c.total > 1 ? "s" : ""}</span>
                </div>
                <ul className="space-y-1.5">
                  {cases.map((uc) => {
                    const lab = LAB_META[uc.labId];
                    const fh = uc.provenance.kind === "firsthand";
                    return (
                      <li key={uc.id}>
                        <Link
                          href={labHref(uc.labId, uc.id)}
                          className="group flex items-start gap-2 rounded-md border border-line px-2.5 py-1.5 transition hover:border-ink/30 hover:bg-slate-50"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: fh ? ind.accent : "#cbd5e1" }} title={fh ? "firsthand" : "studied"} />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium leading-tight text-ink">{uc.title}</span>
                            <span className="block text-[11px] text-slatey-500">{lab?.name ?? uc.labId} · {uc.oneLiner}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-8 border-t border-line pt-4 text-xs text-slatey-500">
          Coverage grows as the use case layer is authored across every lab; the counts above are read live from the
          registry. Dot color: <span className="font-semibold text-ink">filled</span> means firsthand (I ran the pattern),
          grey means studied (informed by public industry patterns, with sources on each brief).
        </p>
      </main>
    </div>
  );
}
