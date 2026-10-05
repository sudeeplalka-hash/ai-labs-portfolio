"use client";

// GAP-08 · Human Review and Autonomy Control Simulator (Collection 2 · toolkit).
// Raise autonomy and throughput climbs, until a deliberately-engineered edge case
// slips through unreviewed. Find the level where risk tier and throughput balance.
// Autonomy is set per risk tier, not per enthusiasm. Bridges EL-05 / C1 Govern.
// SIMULATED.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_ITEMS, reviewed, reviewPolicy, recommendLevel } from "@labs/engines";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstrumentShell, DecisionSummary, Provenance, Panel, Badge, KpiCard, LiveBadge, FreshnessStamp, InsightCard, CommandPalette, ExportMenu, ToastHost, toast, downloadCsv, downloadJson, type ExportAction, type Command } from "@labs/design-system";
import { ChangeReceipt, EvidenceTable, signed } from "./AgentExperience";
import { GAP08_USE_CASES, type Gap08Tier, LABS } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

const ITEMS = DEFAULT_ITEMS;

const LEVELS = [
  { n: 1, label: "Review all" },
  { n: 2, label: "Review high + med" },
  { n: 3, label: "Review high only" },
  { n: 4, label: "Sample ~20%" },
  { n: 5, label: "Full autonomy" },
];

const TIER_GUIDE = [
  { tier: "Illustrative high-risk tier", tone: "rose" as const, max: "L1 to L2" },
  { tier: "Limited / significant", tone: "amber" as const, max: "L3" },
  { tier: "Minimal / internal", tone: "emerald" as const, max: "L4 to L5" },
];

export function HitlSimulator() {
  const [level, setLevel] = useState(1);
  const [baselineLevel, setBaselineLevel] = useState(1);
  const [selectedItem, setSelectedItem] = useState(0);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP08_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP08_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP08_USE_CASES.find((u) => u.id === id) : null;
    setLevel(uc ? uc.payload.defaultLevel : 1); setBaselineLevel(uc ? uc.payload.defaultLevel : 1); setSelectedItem(0);
  };
  const tierGuide: Gap08Tier[] = activeUc ? activeUc.payload.tiers : TIER_GUIDE;

  const cells = ITEMS.map((it, idx) => {
    const rev = reviewed(level, it, idx);
    const slipped = it.edge && !rev;
    return { it, idx, rev, slipped, state: rev ? "reviewed" : slipped ? "slipped" : "auto" as const };
  });
  const policy = reviewPolicy(ITEMS, level);
  const reviewedCount = policy.reviewedCount;
  const slips = cells.filter((c) => c.slipped);
  const exposure = policy.exposureK;
  const throughput = policy.throughput;
  const sweet = recommendLevel(ITEMS);
  const baselinePolicy = reviewPolicy(ITEMS, baselineLevel);
  const changedItems = cells.filter((cell) => cell.rev !== reviewed(baselineLevel, cell.it, cell.idx));
  const selected = cells[selectedItem];

  const router = useRouter();
  const exportPolicy = () => {
    downloadCsv("hitl-policy", ["Level", "Human review load", "Throughput/hr", "Edges slipped", "Exposure ($k)", "Edge coverage %"],
      [1, 2, 3, 4, 5].map((l) => { const r = reviewPolicy(ITEMS, l); return [l, r.reviewedCount, r.throughput, r.slipped, r.exposureK, r.coveragePct]; }));
    toast("Policy table exported as CSV");
  };
  const exportScenario = () => { downloadJson("hitl-scenario", { version: 1, mode: "SIMULATED", useCaseId: activeUcId, level, recommended: sweet, baselineLevel, queue: ITEMS, result: policy }); toast("Scenario exported as JSON"); };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "Policy table (CSV)", hint: "All 5 levels compared", onSelect: exportPolicy },
    { id: "json", label: "Export scenario (JSON)", hint: "Current + recommended level", onSelect: exportScenario },
  ];
  const paletteCommands: Command[] = [
    { id: "act-rec", label: `Set recommended level (L${sweet})`, group: "action", keywords: "sweet spot safe", run: () => setLevel(sweet) },
    ...[1, 2, 3, 4, 5].map((l) => ({ id: `lvl-${l}`, label: `Autonomy L${l}`, group: "action", keywords: "level", run: () => setLevel(l) })),
    { id: "exp-csv", label: "Export policy table (CSV)", group: "export", run: exportPolicy },
    { id: "exp-json", label: "Export scenario (JSON)", group: "export", run: exportScenario },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  return (
    <InstrumentShell title="Human Review and Autonomy Control Simulator" eyebrow="GAP-08 · Agent architecture" description="Find the throughput and review balance for this supplied queue."
      breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Agent architecture", href: "/#collections" }, { label: "Human Review and Autonomy Control Simulator" }]}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Default illustrative scenario"} method="Deterministic policy applied to a synthetic queue" note="Illustrative results support review; they do not establish a production outcome." />} actions={<ExportMenu actions={exportActions} />}>
        <DecisionSummary title={slips.length ? `${slips.length} supplied edge cases bypass review at L${level}` : `All supplied edge cases reach review at L${level}`} tone={slips.length ? "caution" : "positive"} explanation={`The highest zero-slip level for this fixed queue is L${sweet}. This does not establish a safe level for an unseen production population.`} metrics={[{ label: "Review load", value: `${reviewedCount}/${ITEMS.length}` }, { label: "Modeled throughput", value: `${throughput}/hour` }, { label: "Modeled exposure", value: `$${exposure}k` }]} />
        <UseCaseRail useCases={GAP08_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Too much review can make automation uneconomic, and too little review can allow high risk edge cases to slip through. The right autonomy level depends on risk tier, impact, reversibility, and the organization's control posture." approach="The simulator processes a modeled queue across autonomy levels. It shows how throughput, human load, and edge case exposure change as review requirements loosen." why="This connects autonomy to operating capacity, risk exposure, customer impact, compliance, and workforce design." metric="Edge case coverage versus throughput; the recommended (highest zero slip) level." tradeoff="More autonomy means more throughput and, eventually, an unreviewed high severity error." outcome="The autonomy level to run per risk tier, the most speed that still catches every edge." />

        <ChangeReceipt title={`Policy changes from pinned L${baselineLevel}`} onPin={() => setBaselineLevel(level)}>
          <p>{changedItems.length} items changed review path. Review load {signed(reviewedCount - baselinePolicy.reviewedCount)}; modeled throughput {signed(throughput - baselinePolicy.throughput)}/hour; exposure {signed(exposure - baselinePolicy.exposureK)} thousand dollars.</p>
          <p className="mt-1">Only changed items carry the blue outline below. Select any queue item to inspect its actual rule outcome.</p>
        </ChangeReceipt>
        <Panel className="mb-4">
          <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">Autonomy level</label><span className="font-mono text-xs font-semibold text-ink">L{level} · {LEVELS[level - 1].label}</span></div>
          <input type="range" aria-label="Autonomy level" min={1} max={5} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full accent-teal-600" />
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-slatey-500">Recommended: <span className="font-semibold text-ink">L{sweet}</span>, the most autonomy that still catches every edge case.</span>
            {level !== sweet && <button onClick={() => setLevel(sweet)} className="rounded border border-primary/40 bg-primary/5 px-1.5 py-0.5 font-semibold text-primary">Set L{sweet}</button>}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slatey-500">{LEVELS.map((l) => <span key={l.n}>L{l.n}</span>)}</div>
        </Panel>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Throughput" value={`${throughput}/hr`} tone="healthy" interpretation="Items processed" />
          <KpiCard label="Human review load" value={`${reviewedCount}/20`} tone={reviewedCount > 12 ? "risk" : "watch"} interpretation="Items sent to a human" />
          <KpiCard label="Edge cases slipped" value={`${slips.length}/4`} tone={slips.length > 0 ? "critical" : "healthy"} interpretation="Unreviewed errors" />
          <KpiCard label="Risk exposure" value={`$${exposure}k`} tone={exposure > 0 ? "critical" : "healthy"} interpretation="Cost of the slips" />
        </div>

        <Panel className="mb-4">
          <p className="stat-label mb-2">The queue <span className="font-normal text-slatey-500">· ● edge case</span></p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {cells.map((c) => {
              const bg = c.state === "slipped" ? "bg-rose-500 text-white" : c.state === "reviewed" ? "bg-primary-soft text-primary-dark" : "bg-emerald-50 text-emerald-700";
              return (
                <button type="button" key={c.idx} aria-pressed={selectedItem === c.idx} aria-label={`Item ${c.idx + 1}: ${c.it.risk} risk, ${c.it.edge ? "edge case, " : ""}${c.state}${changedItems.includes(c) ? ", review path changed" : ""}`} onClick={() => setSelectedItem(c.idx)} className={`relative flex min-h-11 aspect-square items-center justify-center rounded-md border-2 text-xs font-semibold ${bg} ${changedItems.includes(c) ? "border-primary" : "border-transparent"} ${selectedItem === c.idx ? "ring-2 ring-ink ring-offset-2" : ""}`}>
                  {c.idx + 1} · {c.it.risk[0].toUpperCase()}
                  {c.it.edge && <span className={`absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ${c.slipped ? "bg-white" : "bg-ink/60"}`} />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-line bg-slate-50 p-3 text-sm"><p className="font-semibold">Item {selected.idx + 1} · {selected.it.risk} risk · {selected.it.edge ? "Supplied edge case" : "Ordinary supplied item"}</p><p>Current path: {selected.rev ? "Human review" : "Automatic handling"}. {selected.slipped ? `This edge bypasses review; its modeled severity is $${selected.it.sev}k.` : "No unreviewed error is modeled for this item at the selected level."}</p><p>Baseline L{baselineLevel}: {reviewed(baselineLevel, selected.it, selected.idx) ? "Human review" : "Automatic handling"}.</p></div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slatey-500">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-50 ring-1 ring-emerald-200" /> Auto approved</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-primary-soft ring-1 ring-primary/30" /> Human reviewed</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-rose-500" /> Slipped edge case</span>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <InsightCard title={slips.length === 0 ? `L${level} clears every edge case` : `L${level}: ${slips.length} edge case${slips.length > 1 ? "s" : ""} slipped ($${exposure}k)`} tone={slips.length === 0 ? "success" : "danger"}>
            {level < sweet
              ? <>Every supplied item is reviewed, with no modeled slips, but you&apos;re paying for a human on trivial approvals. There&apos;s throughput to reclaim.</>
              : level === sweet
                ? <>The sweet spot: reviewing high and medium risk catches all four edge cases at {throughput}/hr. One step further trades a $20k medium risk error for a little more speed.</>
                : <>Past the balance point: a medium risk edge case now auto approves and becomes an incident. Speed bought with unpriced risk.</>}
          </InsightCard>

          <Panel>
            <p className="stat-label mb-2">Autonomy by risk tier <span className="font-normal text-slatey-500">· bridges <Link href="/engagement/compliance" className="text-primary hover:underline">EL-05</Link> / <Link href="/govern" className="text-primary hover:underline">Govern</Link></span></p>
            <div className="space-y-1.5">
              {tierGuide.map((g) => (
                <div key={g.tier} className="flex items-center justify-between rounded-md border border-line px-2.5 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5"><Badge tone={g.tone}>{g.tier}</Badge></span>
                  <span className="font-mono text-slatey-400">max {g.max}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slatey-500">These are illustrative review-policy tiers, not regulatory limits. Set a production policy using its actual impact, controls and applicable obligations.</p>
          </Panel>
        </div>

        <details className="mt-4 rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold">Read all queue and policy values</summary><EvidenceTable caption="Queue review paths" headers={["Item", "Risk", "Edge case", `Baseline L${baselineLevel}`, `Current L${level}`, "Modeled slipped exposure"]} rows={cells.map((cell) => [cell.idx + 1, cell.it.risk, cell.it.edge ? "Yes" : "No", reviewed(baselineLevel, cell.it, cell.idx) ? "Review" : "Automatic", cell.rev ? "Review" : "Automatic", cell.slipped ? `$${cell.it.sev}k` : "$0"])} /><EvidenceTable caption="All five policy levels" headers={["Level", "Reviewed", "Throughput/hour", "Slipped edges", "Exposure"]} rows={LEVELS.map((item) => { const result = reviewPolicy(ITEMS, item.n); return [`L${item.n}: ${item.label}`, result.reviewedCount, result.throughput, result.slipped, `$${result.exposureK}k`]; })} /></details>
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Set autonomy by risk tier and impact, not by automation enthusiasm." lift="Increases throughput while keeping edge case exposure within an acceptable control boundary." measure="Review load, throughput, edge case slip through rate, escalation rate, control exceptions." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "The question is not how much autonomy is possible. The question is how much autonomy is appropriate for the risk tier."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Twenty items carry a risk tier and four are edge cases (errors if auto approved). Each level defines a review policy; an edge case slips when it isn&apos;t reviewed. Throughput rises with autonomy; exposure = Σ severity of slipped edges. The medium risk edge is engineered to slip exactly one level past the balance point.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a simplified queue simulation. Production workflows would require live performance data, risk policy, audit logging, escalation paths, and ongoing exception review.</p>
        </div>
      <ToastHost />
      <CommandPalette commands={paletteCommands} />
    </InstrumentShell>
  );
}
