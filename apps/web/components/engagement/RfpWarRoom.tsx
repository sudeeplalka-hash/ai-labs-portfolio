"use client";

// EL-07 · RFP/RFI Response War Room (Collection 4 · control room · commercial wing).
// Decompose an RFP into a compliance matrix, set win themes, red-team the draft
// against the RFP's own criteria, and land a bid / no-bid call from fit × win-prob
// × capacity × margin floor. One sample is a deliberate no-bid, declining bad work
// is senior judgment. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, type BadgeTone } from "@labs/design-system";
import { EL07_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

type Status = "met" | "partial" | "gap";
interface Req { text: string; owner: string; evidence: string; status: Status }
interface Criterion { name: string; weight: number; score: number }
interface Rfp {
  key: string; label: string; excerpt: string;
  requirements: Req[]; criteria: Criterion[]; winThemes: string[];
  fit: number; winProb: number; capacity: number; marginPct: number; marginFloor: number;
}

const STATUS_TONE: Record<Status, BadgeTone> = { met: "emerald", partial: "amber", gap: "rose" };
const STATUS_W: Record<Status, number> = { met: 1, partial: 0.5, gap: 0 };

const RFPS: Rfp[] = [
  {
    key: "disputes", label: "Disputes automation program (finserv)",
    excerpt: "Seeking a partner to deliver an AI-assisted disputes automation capability in a regulated environment. Must demonstrate proven RAG delivery, a named engagement manager, an AI governance framework, and a blended onshore/offshore model. 24-week fixed-price delivery with milestone acceptance.",
    requirements: [
      { text: "Proven RAG delivery in regulated finserv", owner: "Delivery lead", evidence: "Disputes RAG case study", status: "met" },
      { text: "Named EM, 4+ yrs client-facing delivery", owner: "Staffing", evidence: "EM profile + references", status: "met" },
      { text: "Data & AI governance framework", owner: "Governance", evidence: "Risk-tiering + guardrails lab", status: "met" },
      { text: "Blended onshore/offshore model", owner: "Resourcing", evidence: "Mobilization plan (draft)", status: "partial" },
      { text: "24-week fixed price with milestones", owner: "Commercial", evidence: "PERT estimate + change control", status: "partial" },
    ],
    criteria: [
      { name: "Technical approach", weight: 0.30, score: 82 },
      { name: "Relevant experience", weight: 0.25, score: 88 },
      { name: "Team & delivery model", weight: 0.20, score: 80 },
      { name: "Price", weight: 0.15, score: 70 },
      { name: "Governance", weight: 0.10, score: 85 },
    ],
    winThemes: ["Proven disputes RAG", "Named senior EM", "Governance-first delivery"],
    fit: 0.85, winProb: 0.55, capacity: 0.8, marginPct: 34, marginFloor: 25,
  },
  {
    key: "greenfield", label: "Greenfield agentic platform (new domain)",
    excerpt: "Fixed-price build of a production multiagent platform in a domain new to the bidder, delivered in 12 weeks with slip penalties. Client data available from week 4. Strong incumbent relationship in place. Lowest price weighted heavily.",
    requirements: [
      { text: "Production multiagent platform in 12 weeks", owner: "Delivery", evidence: "N/A", status: "gap" },
      { text: "Fixed price with slip penalties", owner: "Commercial", evidence: "N/A", status: "gap" },
      { text: "Deliver with data withheld until week 4", owner: "Data", evidence: "critical-path risk", status: "gap" },
      { text: "Displace a strong incumbent", owner: "Sales", evidence: "N/A", status: "gap" },
      { text: "Domain expertise (net-new to us)", owner: "Delivery", evidence: "adjacent only", status: "partial" },
    ],
    criteria: [
      { name: "Technical approach", weight: 0.30, score: 60 },
      { name: "Relevant experience", weight: 0.25, score: 45 },
      { name: "Team & delivery model", weight: 0.20, score: 70 },
      { name: "Price", weight: 0.15, score: 40 },
      { name: "Governance", weight: 0.10, score: 65 },
    ],
    winThemes: ["Thin, no clear differentiator"],
    fit: 0.40, winProb: 0.20, capacity: 0.5, marginPct: 14, marginFloor: 25,
  },
];

export function RfpWarRoom() {
  const [rfpKey, setRfpKey] = useState(RFPS[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL07_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL07_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => setActiveUcId(id);
  const rfp: Rfp = activeUc ? activeUc.payload.rfp : RFPS.find((r) => r.key === rfpKey)!;

  const coverage = Math.round((rfp.requirements.reduce((a, r) => a + STATUS_W[r.status], 0) / rfp.requirements.length) * 100);
  const redTeam = Math.round(rfp.criteria.reduce((a, c) => a + c.weight * c.score, 0));
  const portfolio = Math.round(rfp.fit * rfp.winProb * rfp.capacity * 100);
  const marginOk = rfp.marginPct >= rfp.marginFloor;
  const bid = marginOk && portfolio >= 35;

  const buildBidMemo = (): string => {
    const rec = bid
      ? `Bid. Coverage ${coverage}%, red-team ${redTeam}/100, margin above floor, pursue it and thread the win themes through every scored section.`
      : `No-bid. Margin ${rfp.marginPct}% vs a ${rfp.marginFloor}% floor and a pursuit score of ${portfolio}, chasing it burns senior time owed to winnable bids. Decline, and say why in one paragraph.`;
    return [
      `# Bid / No-bid memo, ${rfp.label}`,
      "",
      `**Decision: ${bid ? "BID" : "NO-BID"}**`,
      "",
      "## Qualification",
      "",
      "| Factor | Value |",
      "| --- | --- |",
      `| Requirement coverage | ${coverage}% |`,
      `| Red-team score (vs their criteria) | ${redTeam}/100 |`,
      `| Strategic fit | ${Math.round(rfp.fit * 100)} |`,
      `| Win probability | ${Math.round(rfp.winProb * 100)} |`,
      `| Delivery capacity | ${Math.round(rfp.capacity * 100)} |`,
      `| Pursuit score (fit×win×capacity) | ${portfolio} |`,
      `| Margin vs floor | ${rfp.marginPct}% / ${rfp.marginFloor}% |`,
      "",
      "## Compliance matrix",
      "",
      "| Requirement | Owner | Evidence | Status |",
      "| --- | --- | --- | --- |",
      ...rfp.requirements.map((q) => `| ${q.text} | ${q.owner} | ${q.evidence} | ${q.status} |`),
      "",
      "## Win themes",
      "",
      rfp.winThemes.map((t) => `- ${t}`).join("\n"),
      "",
      "## Recommendation",
      "",
      rec,
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`bid-memo-${rfp.key}`, buildBidMemo(), { scenario: rfp.label });

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-07</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Engagement Leadership · Commercial wing</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">RFP/RFI Response War Room</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Decompose the ask, red-team the response against the RFP&apos;s own scoring, and make the call. The RFPs you
            decline fund the ones you win, bid/no-bid is a portfolio decision, not a reflex.
          </p>
        </div>

        <UseCaseRail useCases={EL07_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Should we even bid this, and where is the response weak?" approach="Score the opportunity on fit, win-probability, capacity, and margin, and find the weakest sections of the draft response." why="Bid/no-bid is a portfolio decision, not an enthusiasm decision." metric="The composite bid score; the weakest response section." tradeoff="Chasing a marginal bid versus keeping capacity for a better one." outcome="A bid/no-bid call plus where to strengthen the response if you bid." />

        {!activeUc && (
          <div className="mb-5 flex flex-wrap gap-2">
            {RFPS.map((r) => (
              <button key={r.key} onClick={() => setRfpKey(r.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${r.key === rfpKey ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>{r.label}</button>
            ))}
          </div>
        )}

        <Panel className="mb-4">
          <p className="stat-label mb-1">RFP excerpt</p>
          <p className="text-sm italic leading-relaxed text-slatey-300">&ldquo;{rfp.excerpt}&rdquo;</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rfp.winThemes.map((t) => <Badge key={t} tone="blue">{t}</Badge>)}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Compliance matrix */}
          <Panel className="overflow-x-auto">
            <p className="stat-label mb-2">Compliance matrix <span className="font-normal text-slatey-500">· {coverage}% covered</span></p>
            <table className="data-table">
              <thead><tr><th>Requirement</th><th>Owner</th><th>Evidence</th><th>Status</th></tr></thead>
              <tbody>
                {rfp.requirements.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium text-ink">{r.text}</td>
                    <td>{r.owner}</td>
                    <td className="text-slatey-400">{r.evidence}</td>
                    <td><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Bid/no-bid */}
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between">
                <p className="stat-label">Bid / no-bid</p>
                <Badge tone={bid ? "emerald" : "rose"}>{bid ? "Bid" : "No-bid"}</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <Factor label="Strategic fit" pct={Math.round(rfp.fit * 100)} />
                <Factor label="Win probability" pct={Math.round(rfp.winProb * 100)} />
                <Factor label="Delivery capacity" pct={Math.round(rfp.capacity * 100)} />
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="text-slatey-400">Margin vs floor</span>
                  <span className={`font-mono font-semibold ${marginOk ? "text-emerald-700" : "text-rose-600"}`}>{rfp.marginPct}% / {rfp.marginFloor}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slatey-400">Pursuit score (fit×win×capacity)</span>
                  <span className="font-mono font-semibold text-ink">{portfolio}</span>
                </div>
              </div>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Red-team scorecard <span className="font-normal text-slatey-500">· {redTeam}/100</span></p>
              <div className="space-y-2">
                {rfp.criteria.map((c) => (
                  <div key={c.name}>
                    <div className="mb-0.5 flex items-center justify-between text-[11px]"><span className="text-slatey-400">{c.name} <span className="text-slatey-500">·{Math.round(c.weight * 100)}%</span></span><span className={`font-mono font-semibold ${c.score < 60 ? "text-rose-600" : c.score < 75 ? "text-amber-600" : "text-emerald-700"}`}>{c.score}</span></div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${c.score < 60 ? "bg-rose-500" : c.score < 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${c.score}%` }} /></div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title={bid ? "Bid, and lead with the win themes" : "No-bid, and that's the senior call"} tone={bid ? "success" : "danger"}>
            {bid
              ? <>Coverage {coverage}%, red-team {redTeam}/100, margin above floor. Pursue it and thread the win themes through every section the RFP scores.</>
              : <>Margin {rfp.marginPct}% sits below the {rfp.marginFloor}% floor and the pursuit score is {portfolio}. Chasing it burns senior time you owe the bids you can win. Decline, and say why in one paragraph.</>}
          </InsightCard>
          <div className="mt-3"><ArtifactButton label={bid ? "Download the bid memo" : "Download the no-bid memo"} onClick={onGenerate} title="Download this bid/no-bid memo as Markdown" /></div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Bid only where fit times win-probability times margin clears the bar and capacity exists; else no-bid." lift="Win-rate and margin improve by not chasing low-probability, low-fit bids." measure="Win rate on bids above the bar; margin on won work; capacity freed by no-bidding." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "The RFPs you decline fund the ones you win. Bid/no-bid is a portfolio decision, not a reflex."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, $9M pipeline, the instrument of how a pipeline gets built, one qualified pursuit at a time.</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Coverage = mean of requirement status (met 1 · partial 0.5 · gap 0). Red-team = Σ(criterion weight × score) against the RFP&apos;s own evaluation scheme.</p>
              <p>Bid rule: margin ≥ floor AND pursuit score (fit × win-prob × capacity) ≥ 35. The second sample is engineered to fail both, the honest answer is no-bid.</p>
              <p>Stack: Next.js (static) + shared design system; client side only.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> fit/win-prob/capacity are judgment inputs, not a CRM model; scoring is illustrative. It disciplines the qualify-and-decline decision, not the full proposal build.</p>
        </div>
      </main>
    </div>
  );
}

function Factor({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slatey-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
        <span className="w-8 text-right font-mono font-semibold text-ink">{pct}</span>
      </div>
    </div>
  );
}
