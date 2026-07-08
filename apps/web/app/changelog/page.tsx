import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge } from "@labs/design-system";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's shipped and what's next on the AI delivery portfolio, dated and honest.",
};

interface Entry { date: string; tag: string; tone: "emerald" | "blue" | "amber"; title: string; items: string[] }

const ENTRIES: Entry[] = [
  {
    date: "2026-07", tag: "Data", tone: "emerald", title: "Corpus Intelligence: from file scorer to corpus operating tool",
    items: [
      "Corpus Readiness Board: all ten guidelines scored corpus-wide with a per-file matrix, plus a Remediation Backlog whose fix and accept-risk actions re-score the board, the gates, and the handoff together.",
      "Version & Duplicate Resolution: pairwise detections grouped into sets with a deterministic keep-latest recommendation; accepted exclusions flow to blocked sources, Build's re-rank, and Govern findings with no extra wiring.",
      "Corpus Atlas: the similarity map's axes upgraded to true PCA (shared engine with Build's projector), decision overlays (PII rings, staleness dimming, token sizing), and a house-built 3D view.",
      "Deep signals: parsability measured on the visitor's own upload (extraction yield, encoding damage, boilerplate share), heuristic language profiling, and deterministic topic groups where the human confirms every label.",
      "Cleaning-to-quality proof: the same baseline retriever run raw vs cleaned against an authored golden set, in-browser, with the measured accuracy delta and stale-evidence share, plus a downloadable readiness dossier.",
    ],
  },
  {
    date: "2026-07", tag: "Operate", tone: "emerald", title: "Operate: the 7th stage, day two observability plus the loop back to Frame",
    items: [
      "Day two observability added to the Enterprise AI Program lifecycle: the four signal families (system SLOs, model quality canary, RAG freshness and staleness, agent and cost) on a 12 week time axis.",
      "The engineered week 7 incident: SLOs stay green while the answers decay, silent drift caught by canary evals, not infra dashboards.",
      "The loop closes: a retrain, reindex, rollback, or rescope decision routes a typed feedback contract back to Frame, Build, Deploy, Realize, and Govern. A lifecycle line becomes a program loop.",
      "Two downloadable artifacts (weekly ops review, incident report), the first real artifact engine implementations.",
    ],
  },
  {
    date: "2026-07", tag: "Honesty pass", tone: "emerald", title: "Post review corrections",
    items: [
      "LIVE ready labs (multiagent, structured output) relabeled to authored/illustrative. No LIVE badge without a wired call path.",
      "Model catalog freshened: other provider entries shown as generic tiers, not version pinned; Anthropic models current.",
      "Registry count fixed to the 23 new labs; internal QA audit trail corrected.",
      "Public changelog shipped (this page).",
    ],
  },
  {
    date: "2026-07", tag: "Launch", tone: "blue", title: "Portfolio v1: 23 interactive labs",
    items: [
      "Collection 2 · Agent & Protocol (8): MCP playground, loop/failure inspector, orchestration, structured output, context/memory, cost simulator, protocol selection, human in the loop approval.",
      "Collection 3 · Business of AI (5): portfolio dashboard, build versus buy, cost forecaster, vendor monitor, ROI builder.",
      "Collection 4 · Engagement Leadership (10): adoption, stakeholders, capacity, RAID radar, compliance, talent, RFP, estimation, onboarding, exec comms.",
      "Layer 0 Competency Map landing, driven by a shared labs registry.",
    ],
  },
  {
    date: "2026-07", tag: "Foundations", tone: "blue", title: "Shared spine",
    items: [
      "@labs/kit: dated model, pricing, and protocol config plus the registry that auto updates the map as labs ship.",
      "One design system across every new collection (matches the Command Center).",
      "Credibility block on every lab: badge · freshness stamp · steering takeaway · how it's built · limitations.",
    ],
  },
  {
    date: "Next", tag: "Roadmap", tone: "amber", title: "In flight",
    items: [
      "Genuine LIVE calls on the flagship agent labs (once the deploy host is set).",
      "Use Case Layer: 3 real world, cross industry scenarios per lab plus an Industry Atlas.",
      "Collection index pages (the toolkit / gallery / control room structures).",
      "Shareability and accessibility: per lab OG images, sitemap, full accessibility pass.",
    ],
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">Changelog</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-5">
        <p className="eyebrow mb-1">Building in public</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Changelog</h1>
        <p className="mt-2 text-sm leading-relaxed text-slatey-400">Dated and honest: what&apos;s shipped, what&apos;s corrected, and what&apos;s next. A fuller engineering log lives in the repo&apos;s <span className="font-mono text-[13px]">BUILD-LOG.md</span>.</p>
        <div className="mt-6 space-y-4">
          {ENTRIES.map((e, i) => (
            <Panel key={i}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={e.tone}>{e.tag}</Badge>
                <span className="font-mono text-xs text-slatey-500">{e.date}</span>
                <h2 className="text-sm font-semibold text-ink">{e.title}</h2>
              </div>
              <ul className="space-y-1.5 text-sm text-slatey-300">
                {e.items.map((it, j) => (
                  <li key={j} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slatey-500" /><span className="leading-relaxed">{it}</span></li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
        <p className="mt-6 text-xs text-slatey-500">Honest by design: every lab states whether it&apos;s LIVE or SIMULATED, and every number expands to its formula.</p>
      </main>
    </div>
  );
}
