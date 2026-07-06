"use client";

// EL-05 · AI Compliance Readiness Navigator (Collection 4 · control room).
// Describe an initiative → EU AI Act risk tier (+ finserv overlay) → required
// controls, gap-highlighted → audit-readiness checklist. Compliance isn't an end
// gate; it's a design input — retrofit costs 10×. SIMULATED · illustrative, not
// legal advice · classification logic as of July 2026 (obligations phasing in).

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, type BadgeTone } from "@labs/design-system";
import { EL05_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

type Tier = "prohibited" | "high" | "limited" | "minimal";
const ORDER: Record<Tier, number> = { prohibited: 3, high: 2, limited: 1, minimal: 0 };
const TIER_LABEL: Record<Tier, string> = { prohibited: "Prohibited", high: "High-risk", limited: "Limited-risk", minimal: "Minimal-risk" };
const TIER_TONE: Record<Tier, BadgeTone> = { prohibited: "rose", high: "orange", limited: "amber", minimal: "emerald" };

const FUNCTIONS: { key: string; label: string; base: Tier }[] = [
  { key: "credit", label: "Credit / eligibility decisioning", base: "high" },
  { key: "fraud", label: "Fraud / risk scoring", base: "high" },
  { key: "assist_ext", label: "Customer-facing assistant", base: "limited" },
  { key: "content", label: "Content generation", base: "limited" },
  { key: "assist_int", label: "Internal employee assist", base: "minimal" },
  { key: "biometric", label: "Biometric / social scoring", base: "prohibited" },
];
const AUTONOMY = [{ v: "advisory", l: "Advisory" }, { v: "hitl", l: "Human-in-loop" }, { v: "auto", l: "Autonomous" }];
const DATA = [{ v: "none", l: "None / public" }, { v: "personal", l: "Personal" }, { v: "sensitive", l: "Sensitive" }];
const IMPACT = [{ v: "low", l: "Low" }, { v: "significant", l: "Significant" }, { v: "rights", l: "Rights-affecting" }];

interface Control { label: string; met: boolean }
function controlsFor(tier: Tier, finserv: boolean, content: boolean): Control[] {
  if (tier === "prohibited") return [{ label: "Do not deploy — this is a prohibited practice under the Act", met: false }];
  if (tier === "high") {
    const base: Control[] = [
      { label: "Risk management system (documented, iterative)", met: false },
      { label: "Data governance & quality controls", met: true },
      { label: "Technical documentation", met: false },
      { label: "Record-keeping / event logging", met: true },
      { label: "Human oversight design", met: true },
      { label: "Accuracy, robustness & cybersecurity", met: false },
      { label: "Transparency to affected users", met: true },
      { label: "Conformity assessment", met: false },
      { label: "Post-market monitoring", met: false },
    ];
    if (finserv) base.push({ label: "Model risk management (SR 11-7 style)", met: false }, { label: "Fair-lending / bias testing", met: true });
    return base;
  }
  if (tier === "limited") {
    const base: Control[] = [
      { label: "Disclose AI use to users", met: true },
      { label: "Interaction logging", met: true },
      { label: "Lightweight human oversight / escalation", met: false },
    ];
    if (content) base.push({ label: "Label AI-generated content", met: false });
    if (finserv) base.push({ label: "Fair-treatment / bias check", met: true });
    return base;
  }
  return [
    { label: "Voluntary code of conduct", met: false },
    { label: "Basic logging & data hygiene", met: true },
    { label: "Access controls on training data", met: true },
  ];
}

export function ComplianceNavigator() {
  const [fn, setFn] = useState("credit");
  const [autonomy, setAutonomy] = useState("hitl");
  const [data, setData] = useState("sensitive");
  const [impact, setImpact] = useState("significant");
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL05_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL05_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    setOverride({});
    const uc = id ? EL05_USE_CASES.find((u) => u.id === id) ?? null : null;
    if (uc) { setAutonomy(uc.payload.autonomy); setData(uc.payload.data); setImpact(uc.payload.impact); }
  };

  const base = activeUc ? activeUc.payload.base : FUNCTIONS.find((f) => f.key === fn)!.base;
  let tier: Tier = base;
  const bump = (t: Tier) => { if (ORDER[t] > ORDER[tier]) tier = t; };
  if (impact === "rights") bump("high");
  if (data === "sensitive" && autonomy === "auto") bump("limited");
  const finserv = !activeUc && data === "sensitive";
  const isContent = !activeUc && fn === "content";

  const overlay = activeUc && (tier === "high" || tier === "limited") ? activeUc.payload.overlay : [];
  const controls = [...controlsFor(tier, finserv, isContent), ...overlay].map((c) => ({ ...c, met: override[c.label] ?? c.met }));
  const met = controls.filter((c) => c.met).length;
  const readiness = tier === "prohibited" ? 0 : Math.round((met / controls.length) * 100);

  const rationale =
    tier === "prohibited" ? "This function class is prohibited regardless of controls."
      : tier === "high" ? `High-risk: ${impact === "rights" ? "rights-affecting impact" : "decisioning on people or essential services"}${finserv ? " with sensitive data (finserv overlay applies)" : ""}.`
        : tier === "limited" ? "Limited-risk: user-facing system with transparency obligations."
          : "Minimal-risk: internal, low-impact — voluntary measures.";
  const rationaleFull = rationale + (activeUc && (tier === "high" || tier === "limited") ? ` ${activeUc.payload.rationaleOverlay}` : "");

  const buildAuditPacket = (): string => {
    const fnLabel = activeUc ? activeUc.payload.fnLabel : (FUNCTIONS.find((f) => f.key === fn)?.label ?? fn);
    const gapsList = controls.filter((c) => !c.met);
    return [
      "# AI Compliance — audit-readiness packet",
      "",
      `**Function:** ${fnLabel}`,
      `**Classification:** ${TIER_LABEL[tier]}`,
      tier === "prohibited"
        ? "**Audit readiness:** N/A — prohibited practice, do not deploy"
        : `**Audit readiness:** ${readiness}% (${controls.filter((c) => c.met).length}/${controls.length} controls in place)`,
      "",
      `**Rationale:** ${rationaleFull}`,
      "",
      "## Required controls",
      "",
      "| Control | Status |",
      "| --- | --- |",
      ...controls.map((c) => `| ${c.label} | ${c.met ? "In place" : "**GAP**"} |`),
      "",
      "## Open gaps",
      "",
      gapsList.length ? gapsList.map((c) => `- ${c.label}`).join("\n") : "_All required controls are in place._",
      "",
      "## Basis & caveat",
      "",
      `Tier and controls follow the EU AI Act structure${activeUc ? ` plus the ${activeUc.payload.overlayLabel}` : ""}, as of July 2026 (obligations phasing in). Illustrative, not legal advice — confirm classification and obligations with counsel for any real deployment.`,
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`audit-readiness-${activeUc ? activeUc.id : fn}`, buildAuditPacket(), {
      scenario: `${activeUc ? activeUc.payload.fnLabel : (FUNCTIONS.find((f) => f.key === fn)?.label ?? fn)} · ${TIER_LABEL[tier]}`,
      note: "Illustrative simplified compliance model as of July 2026 — not legal advice.",
    });

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-05</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Engagement Leadership · Control room</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">AI Compliance Readiness Navigator</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02", asOf: "2026-07", note: "EU AI Act obligations phasing in" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Classify the initiative, see the controls its tier demands, and measure how ready you are — because compliance
            found at the end costs ten times what it costs as a design input. Bridges the{" "}
            <Link href="/govern" className="font-medium text-primary hover:underline">Govern stage</Link>.
          </p>
        </div>

        <UseCaseRail useCases={EL05_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="What tier is this AI, and what controls does it owe?" approach="Classify the system's risk tier under the EU AI Act plus finserv overlays, then map the required controls and the coverage gap." why="The controls owed follow the tier, not the team's enthusiasm." metric="Risk tier; control coverage versus what the tier requires." tradeoff="Control burden and time-to-market versus regulatory and reputational exposure." outcome="A risk-tier and required-controls map with the gap to close before go-live." />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <Panel className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium text-slatey-400">Function</p>
              {activeUc ? (
                <div className="rounded-md border border-primary bg-primary-soft px-2.5 py-2 text-[11px] font-medium text-ink">{activeUc.payload.fnLabel}<span className="ml-2 font-normal text-slatey-500">· preset</span></div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {FUNCTIONS.map((f) => (
                    <button key={f.key} onClick={() => setFn(f.key)} className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${fn === f.key ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:text-ink"}`}>{f.label}</button>
                  ))}
                </div>
              )}
            </div>
            <Seg label="Autonomy" value={autonomy} onChange={setAutonomy} opts={AUTONOMY} />
            <Seg label="Data" value={data} onChange={setData} opts={DATA} />
            <Seg label="User impact" value={impact} onChange={setImpact} opts={IMPACT} />
          </Panel>

          {/* Result */}
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between">
                <p className="stat-label">Classification</p>
                <Badge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</Badge>
              </div>
              <p className="mt-2 text-sm text-slatey-300">{rationaleFull}</p>
              {tier !== "prohibited" && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="text-slatey-400">Audit readiness</span><span className="font-mono font-semibold text-ink">{readiness}%</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${readiness >= 80 ? "bg-emerald-500" : readiness >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${readiness}%` }} /></div>
                </div>
              )}
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Required controls <span className="font-normal text-slatey-500">· {activeUc ? `incl. ${activeUc.payload.overlayLabel}` : "tap to mark in place"}</span></p>
              <ul className="space-y-1">
                {controls.map((c) => (
                  <li key={c.label}>
                    <button onClick={() => setOverride((o) => ({ ...o, [c.label]: !c.met }))} className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-xs hover:bg-slate-50">
                      {c.met ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slatey-500" />}
                      <span className={c.met ? "text-slatey-300" : "text-ink"}>{c.label}</span>
                      {!c.met && tier !== "prohibited" && <Badge tone="rose" className="ml-auto shrink-0">gap</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
              {tier !== "prohibited" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ArtifactButton label="Download the audit packet" onClick={onGenerate} title="Download this audit-readiness packet as Markdown" />
                  <span className="text-[11px] text-slatey-500">or print this page (⌘/Ctrl-P) for a PDF.</span>
                </div>
              )}
            </Panel>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title={tier === "prohibited" ? "Stop — prohibited practice" : `${controls.filter((c) => !c.met).length} controls still open`} tone={tier === "prohibited" || readiness < 50 ? "danger" : readiness < 80 ? "warn" : "success"}>
            {tier === "prohibited"
              ? "This class of use isn't a compliance project — it's a no-go. Re-scope the function before anything else."
              : <>Every open control here is cheaper to design in now than to retrofit after launch. Sequence the gaps into the build plan, not a pre-launch scramble.</>}
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Classify the system's tier and close the required-control gaps before go-live." lift="Enter production with tier-appropriate controls in place, not a post-audit scramble." measure="Control coverage vs the tier's requirement; audit findings; time-to-close on gaps." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "Compliance isn't a gate at the end; it's a design input at the start. Retrofit costs 10×."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo — regulated-industry delivery across AMEX, Morgan Stanley, and S&P/CRISIL.</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Tier = the function&apos;s base class, escalated by rights-affecting impact and by sensitive-data + autonomy. Controls are the tier&apos;s obligations (EU AI Act structure) plus a finserv overlay when data is sensitive; readiness = controls in place ÷ required.</p>
              <p>Classification logic dated July 2026 as obligations phase in. Stack: Next.js (static) + shared design system; client-side.</p>
            </div>
          </details>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-semibold">Illustrative, not legal advice.</span> Tiers and controls are a simplified model as of July 2026; confirm classification and obligations with counsel for any real deployment.</p>
        </div>
      </main>
    </div>
  );
}

function Seg({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: { v: string; l: string }[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slatey-400">{label}</p>
      <div className="flex gap-1">
        {opts.map((o) => (
          <button key={o.v} onClick={() => onChange(o.v)} className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${value === o.v ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:text-ink"}`}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}
