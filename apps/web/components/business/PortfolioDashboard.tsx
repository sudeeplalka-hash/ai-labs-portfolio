"use client";

// C3-1 · AI Initiative Portfolio Dashboard (Collection 3 · gallery · flagship).
// Twelve initiatives plotted value × risk (sized by spend), each with a
// risk-adjusted ROI and an explicit kill / scale / hold call. Map / Financials /
// Stage-gate views. Thread: capital allocation under uncertainty — nothing scored
// by a black box. SIMULATED; every number is a stated formula over visible inputs.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, KpiCard, InsightCard, LiveBadge, FreshnessStamp, type BadgeTone } from "@labs/design-system";
import { C31_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

type Stage = "discovery" | "pilot" | "scaling" | "production";
type Rec = "kill" | "hold" | "scale";
interface Initiative {
  id: string; name: string; domain: string; stage: Stage;
  expValueM: number; spendM: number; risk: number; planVar: number;
}

// Stage-based probability of success — industry-informed defaults, editable.
const STAGE_PROB: Record<Stage, number> = { discovery: 0.15, pilot: 0.30, scaling: 0.60, production: 0.85 };

const INITIATIVES: Initiative[] = [
  { id: "servicing", name: "Card-member servicing assist", domain: "Finserv", stage: "production", expValueM: 3.2, spendM: 0.9, risk: 0.25, planVar: 4 },
  { id: "disputes", name: "Disputes automation", domain: "Finserv", stage: "scaling", expValueM: 2.1, spendM: 1.1, risk: 0.55, planVar: 12 },
  { id: "fraud", name: "Fraud alert triage", domain: "Finserv", stage: "production", expValueM: 4.0, spendM: 1.2, risk: 0.30, planVar: -3 },
  { id: "kyc", name: "KYC document intelligence", domain: "Finserv", stage: "pilot", expValueM: 1.4, spendM: 1.1, risk: 0.75, planVar: 18 },
  { id: "wealth", name: "Wealth ops copilot", domain: "Finserv", stage: "scaling", expValueM: 1.8, spendM: 0.8, risk: 0.50, planVar: 6 },
  { id: "statements", name: "Statements Q&A assistant", domain: "Finserv", stage: "discovery", expValueM: 0.9, spendM: 0.5, risk: 0.60, planVar: 9 },
  { id: "routing", name: "Care contact routing", domain: "Telecom", stage: "production", expValueM: 2.6, spendM: 0.7, risk: 0.30, planVar: 2 },
  { id: "netops", name: "Network-ops copilot", domain: "Telecom", stage: "scaling", expValueM: 1.6, spendM: 0.9, risk: 0.60, planVar: 14 },
  { id: "churn", name: "Churn / retention model", domain: "Telecom", stage: "production", expValueM: 2.2, spendM: 0.8, risk: 0.45, planVar: -5 },
  { id: "dispatch", name: "Field-service dispatch", domain: "Telecom", stage: "pilot", expValueM: 3.0, spendM: 0.8, risk: 0.60, planVar: 15 },
  { id: "billing", name: "Billing anomaly detection", domain: "Telecom", stage: "scaling", expValueM: 1.9, spendM: 0.85, risk: 0.50, planVar: 7 },
  { id: "kb", name: "Field-tech knowledge assistant", domain: "Telecom", stage: "production", expValueM: 2.0, spendM: 0.75, risk: 0.55, planVar: 5 },
];

const prob = (i: Initiative) => STAGE_PROB[i.stage];
const riskAdj = (i: Initiative) => i.expValueM * prob(i) - i.spendM; // $M/yr
function recommend(i: Initiative): Rec {
  const r = riskAdj(i);
  if (r < 0) return "kill";
  if ((i.stage === "scaling" || i.stage === "production") && r >= 1.5 * i.spendM && i.risk < 0.6) return "scale";
  return "hold";
}

const REC_LABEL: Record<Rec, string> = { kill: "Kill", hold: "Hold", scale: "Scale" };
const REC_TONE: Record<Rec, BadgeTone> = { kill: "rose", hold: "amber", scale: "emerald" };
const REC_DOT: Record<Rec, string> = { kill: "bg-rose-500", hold: "bg-amber-500", scale: "bg-emerald-500" };
const fmtM = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(1)}M`;

type View = "map" | "financials" | "gate";

export function PortfolioDashboard() {
  const [view, setView] = useState<View>("map");
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? C31_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(C31_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const items: Initiative[] = activeUc ? activeUc.payload.initiatives : INITIATIVES;
  const [selId, setSelId] = useState<string>("kyc");
  const sel = items.find((i) => i.id === selId) ?? items[0];
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const book = id ? (C31_USE_CASES.find((u) => u.id === id)?.payload.initiatives ?? INITIATIVES) : INITIATIVES;
    setSelId(book[0].id);
  };

  const maxVal = Math.max(...items.map((i) => i.expValueM));
  const totalValue = items.reduce((a, i) => a + i.expValueM, 0);
  const totalSpend = items.reduce((a, i) => a + i.spendM, 0);
  const totalRiskAdj = items.reduce((a, i) => a + riskAdj(i), 0);
  const killCount = items.filter((i) => recommend(i) === "kill").length;

  const buildReviewPack = (): string => {
    const kills = items.filter((i) => recommend(i) === "kill");
    const rows = items
      .slice()
      .sort((a, b) => riskAdj(b) - riskAdj(a))
      .map((i) => `| ${i.name} | ${i.domain} | ${i.stage} | ${fmtM(i.expValueM)} | ${fmtM(i.spendM)} | ${Math.round(prob(i) * 100)}% | ${fmtM(riskAdj(i))} | ${REC_LABEL[recommend(i)]} |`);
    return [
      "# AI Initiative Portfolio — review pack",
      "",
      `**Book:** ${activeUc ? activeUc.title : "Default (finserv + telecom)"}`,
      `**Totals:** Expected value ${fmtM(totalValue)} · Run-rate spend ${fmtM(totalSpend)} · Risk-adjusted ${fmtM(totalRiskAdj)} · Kill list ${killCount}/${items.length}`,
      "",
      "## Initiatives (sorted by risk-adjusted value)",
      "",
      "| Initiative | Domain | Stage | Exp. value | Spend | P(success) | Risk-adj | Call |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...rows,
      "",
      "## Kill list",
      "",
      kills.length
        ? kills.map((i) => `- **${i.name}** — risk-adjusted ${fmtM(riskAdj(i))} (negative return)`).join("\n")
        : "_None — every initiative clears its risk-adjusted hurdle._",
      "",
      "## Method",
      "",
      "Risk-adjusted value = expected value × P(success by stage) − spend. **Kill** if risk-adjusted < 0; **Scale** if scaling/production AND risk-adjusted ≥ 1.5× spend AND risk < 0.6; else **Hold**.",
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`portfolio-review-pack-${activeUc ? activeUc.id : "default"}`, buildReviewPack(), {
      scenario: activeUc ? activeUc.title : "Default book",
    });

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">C3-1</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Business of AI · Gallery</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">AI Initiative Portfolio Dashboard</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            A book of twelve AI initiatives, governed like capital. Each carries a risk-adjusted ROI and an explicit
            call — because a portfolio where nothing is ever killed isn&apos;t governed, it&apos;s unattended.
          </p>
        </div>

        <UseCaseRail useCases={C31_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        <div className="mb-4 flex justify-end">
          <ArtifactButton label="Download the review pack" onClick={onGenerate} title="Download the portfolio review pack as Markdown" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Expected annual value" value={fmtM(totalValue)} tone="neutral" interpretation="Sum of unadjusted upside" />
          <KpiCard label="Run-rate spend" value={fmtM(totalSpend)} tone="watch" interpretation="Annualized" />
          <KpiCard label="Risk-adjusted value" value={fmtM(totalRiskAdj)} tone={totalRiskAdj > 0 ? "healthy" : "critical"} interpretation="Value × P(success) − spend" />
          <KpiCard label="Recommend to kill" value={`${killCount}/${items.length}`} tone={killCount >= 1 ? "critical" : "healthy"} interpretation="Negative risk-adjusted ROI" />
        </div>

        {/* View toggle */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(["map", "financials", "gate"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${v === view ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
              {v === "gate" ? "Stage-gate" : v}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {view === "map" && (
              <Panel>
                <p className="stat-label mb-3">Value × risk · bubble = run-rate spend</p>
                <div className="relative mx-auto h-72 w-full rounded-lg border border-line bg-slate-50/50">
                  <span className="absolute left-2 top-1 text-[10px] text-slatey-500">high value</span>
                  <span className="absolute bottom-1 left-2 text-[10px] text-slatey-500">low value</span>
                  <span className="absolute bottom-1 right-2 text-[10px] text-slatey-500">high risk →</span>
                  <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-line" />
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                  {items.map((i) => {
                    const rec = recommend(i);
                    const size = 14 + i.spendM * 20;
                    const left = `${i.risk * 88 + 6}%`;
                    const top = `${(1 - i.expValueM / maxVal) * 82 + 6}%`;
                    const on = i.id === selId;
                    return (
                      <button key={i.id} onClick={() => setSelId(i.id)} aria-label={`${i.name}: ${REC_LABEL[rec]}`} title={`${i.name} · ${REC_LABEL[rec]}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left, top }}>
                        <span className={`block rounded-full opacity-80 ring-1 ring-white ${REC_DOT[rec]} ${on ? "ring-2 ring-ink" : ""}`} style={{ width: size, height: size }} />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slatey-500">
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Scale</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Hold</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Kill</span>
                </div>
              </Panel>
            )}

            {view === "financials" && (
              <Panel className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Initiative</th><th>Stage</th><th>Value</th><th>Spend</th><th>Risk-adj</th><th>Plan var</th></tr></thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="cursor-pointer" onClick={() => setSelId(i.id)}>
                        <td className="font-medium text-ink">{i.name}</td>
                        <td className="capitalize">{i.stage}</td>
                        <td>{fmtM(i.expValueM)}</td>
                        <td>{fmtM(i.spendM)}</td>
                        <td className={riskAdj(i) < 0 ? "text-rose-600" : "text-emerald-700"}>{fmtM(riskAdj(i))}</td>
                        <td>{Math.abs(i.planVar) > 10 ? <Badge tone={i.planVar > 0 ? "orange" : "blue"}>{i.planVar > 0 ? "+" : ""}{i.planVar}%</Badge> : <span className="text-slatey-500">{i.planVar > 0 ? "+" : ""}{i.planVar}%</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-slatey-500">Plan variance flagged beyond ±10%.</p>
              </Panel>
            )}

            {view === "gate" && (
              <div className="grid gap-3 sm:grid-cols-3">
                {(["scale", "hold", "kill"] as Rec[]).map((r) => (
                  <div key={r} className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${REC_DOT[r]}`} /><p className="text-sm font-semibold text-ink">{REC_LABEL[r]}</p><span className="text-[11px] text-slatey-500">{items.filter((i) => recommend(i) === r).length}</span></div>
                    <div className="space-y-1.5">
                      {items.filter((i) => recommend(i) === r).map((i) => (
                        <button key={i.id} onClick={() => setSelId(i.id)} className={`block w-full rounded-md border px-2 py-1.5 text-left text-xs transition ${i.id === selId ? "border-primary bg-primary-soft" : "border-line hover:border-primary/40"}`}>
                          <span className="font-medium text-ink">{i.name}</span>
                          <span className="block text-[11px] text-slatey-500">{fmtM(riskAdj(i))} risk-adj</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <div><h3 className="text-sm font-semibold text-ink">{sel.name}</h3><p className="text-[11px] text-slatey-500">{sel.domain} · {sel.stage}</p></div>
                <Badge tone={REC_TONE[recommend(sel)]}>{REC_LABEL[recommend(sel)]}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Fact k="Expected value" v={fmtM(sel.expValueM)} />
                <Fact k="P(success)" v={`${Math.round(prob(sel) * 100)}%`} />
                <Fact k="Run-rate spend" v={fmtM(sel.spendM)} />
                <Fact k="Risk score" v={sel.risk.toFixed(2)} />
              </div>
              <details className="mt-3 rounded-md bg-slate-50 p-2.5 text-xs text-slatey-300">
                <summary className="cursor-pointer font-semibold text-ink">How this number is computed</summary>
                <p className="mt-1.5 leading-relaxed">
                  Risk-adjusted ROI = expected value ({fmtM(sel.expValueM)}) × stage probability ({Math.round(prob(sel) * 100)}% for {sel.stage}) − run-rate spend ({fmtM(sel.spendM)}) = <span className="font-semibold text-ink">{fmtM(riskAdj(sel))}</span>/yr.
                </p>
                <p className="mt-1.5 leading-relaxed">
                  Call: {riskAdj(sel) < 0 ? "negative risk-adjusted ROI → kill." : recommend(sel) === "scale" ? "proven stage, risk-adjusted ROI ≥ 1.5× spend, risk < 0.6 → scale." : "positive but not yet scale-worthy → hold and de-risk."}
                </p>
              </details>
            </Panel>

            <InsightCard title={killCount > 0 ? `${killCount} to cut this quarter` : "No kills — a lean book"} tone={killCount > 0 ? "danger" : "info"}>
              {killCount} of {items.length} carry a negative risk-adjusted ROI. Keeping them funds optionality theatre — the capital
              they hold is the capital the Scale column needs.
            </InsightCard>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "A portfolio where nothing gets killed isn't governed — it's unattended. Two of these twelve should die this quarter."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built &amp; assumptions</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Stage probabilities (editable defaults): discovery 15% · pilot 30% · scaling 60% · production 85%.</p>
              <p>Risk-adjusted ROI = expected annual value × stage probability − run-rate cost. Kill if &lt; 0; scale if proven-stage and ≥ 1.5× spend with risk &lt; 0.6; else hold. Plan variance flagged beyond ±10%.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client-side math over authored, anonymized finserv + telecom initiatives.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> probabilities are stage-based defaults, not per-initiative Bayesian estimates; value figures are illustrative. The instrument frames the allocation decision — it doesn&apos;t replace the finance model behind it.</p>
        </div>
      </main>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md border border-line bg-white px-2.5 py-1.5"><p className="text-[11px] text-slatey-500">{k}</p><p className="font-mono text-sm font-semibold text-ink">{v}</p></div>;
}
