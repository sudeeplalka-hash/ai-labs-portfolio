"use client";

// EL-10 · Executive Communication Decision Studio (Collection 4 · control room).
// Consumes EL-04's delivery data (shared portfolioData) and produces a steering
// pre read / weekly update / QBR outline, disciplined into Status → Decisions →
// Risks & mitigations → Asks, reordered and reframed per audience, with a talk
// track per section. The senior-EM tell: every artifact forces a decision.
// SIMULATED; the per-section talk track can be generated LIVE via LIVE_MODEL.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp } from "@labs/design-system";
import { EL10_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";
import { SCENARIOS, healthIndex, type Scenario } from "./portfolioData";

type ArtKey = "weekly" | "steering" | "qbr";
type AudKey = "cio" | "sponsor" | "procurement";

const ARTIFACTS: { key: ArtKey; label: string; blurb: string; sections: string[] }[] = [
  { key: "weekly", label: "Weekly leadership update", blurb: "Tight status + the asks", sections: ["status", "decisions", "risks", "asks"] },
  { key: "steering", label: "Steering pre read", blurb: "Decisions to make in the room", sections: ["status", "decisions", "risks", "asks"] },
  { key: "qbr", label: "QBR outline", blurb: "Quarter in review + forward asks", sections: ["status", "outcomes", "decisions", "risks", "asks"] },
];

const AUDIENCES: { key: AudKey; label: string; frame: string; order: string[] }[] = [
  { key: "cio", label: "CIO", frame: "Risk posture and delivery health, decisions front and center.", order: ["status", "decisions", "risks", "outcomes", "asks"] },
  { key: "sponsor", label: "Program sponsor", frame: "Outcomes, adoption, and the support I need from you.", order: ["status", "outcomes", "decisions", "asks", "risks"] },
  { key: "procurement", label: "Procurement", frame: "Spend to plan, vendor dependencies, and the commitments in play.", order: ["status", "risks", "decisions", "outcomes", "asks"] },
];

const isDecision = (ask: string) => /decision needed|decide|steering call today|this steering|by friday/i.test(ask);

export function ExecCommStudio() {
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const [art, setArt] = useState<ArtKey>("steering");
  const [aud, setAud] = useState<AudKey>("cio");

  const activeUc = activeUcId ? EL10_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL10_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? EL10_USE_CASES.find((u) => u.id === id) ?? null : null;
    if (uc) { setArt(uc.payload.defaultArtifact); setAud(uc.payload.defaultAud); }
  };

  const scenario: Scenario = activeUc ? activeUc.payload.portfolio : SCENARIOS.find((s) => s.key === scenarioKey)!;
  const artifact = ARTIFACTS.find((a) => a.key === art)!;
  const audience = AUDIENCES.find((a) => a.key === aud)!;
  const ws = scenario.workstreams;

  const green = ws.filter((w) => w.actual === "green").length;
  const amber = ws.filter((w) => w.actual === "amber").length;
  const red = ws.filter((w) => w.actual === "red").length;
  const gaps = ws.filter((w) => w.reported !== w.actual).length;
  const idx = healthIndex(ws);
  const decisions = ws.filter((w) => isDecision(w.brief.ask));
  const highRisks = ws.flatMap((w) => w.raid.risks.filter((r) => r.sev === "high").map((r) => ({ text: r.text, w })));
  const deps = ws.flatMap((w) => w.raid.dependencies);
  const vendorDeps = deps.filter((d) => /vendor/i.test(d.text));
  const wins = ws.filter((w) => w.trend === "up");

  const statusHeadline =
    aud === "cio"
      ? `Portfolio health ${idx}/100, ${red} red, ${amber} amber, ${green} green, with ${gaps} reported-vs-actual gap${gaps === 1 ? "" : "s"}. ${decisions.length} decision${decisions.length === 1 ? "" : "s"} need this forum.`
      : aud === "sponsor"
      ? `Adoption at ${scenario.adoptionIndex}% of target; ${green} of ${ws.length} workstreams on track. ${wins.length} improving, ${decisions.length} decision${decisions.length === 1 ? "" : "s"} to land below.`
      : `Spend ${scenario.burnVariance >= 0 ? "+" : ""}${scenario.burnVariance}% vs plan; ${deps.length} dependencies in flight (${vendorDeps.length} vendor). ${decisions.length} decision${decisions.length === 1 ? "" : "s"} carry commercial impact.`;

  const talk: Record<string, string> = {
    status: aud === "cio" ? "Open with the red and the gaps, don't bury the decisions." : aud === "sponsor" ? "Lead with adoption and the wins, then the asks." : "Anchor on spend-to-plan and the vendor dependencies.",
    outcomes: "Quantify the wins and tie each to the metric this audience cares about.",
    decisions: "Name the decision, the options, and the date, don't leave without a call.",
    risks: "Pair every risk with the mitigation already in motion, show control, not alarm.",
    asks: "Restate each ask as a yes/no with an owner and a date.",
  };

  const SECTION: Record<string, { title: string; node: ReactNode }> = {
    status: {
      title: "Status",
      node: (
        <div className="space-y-2">
          <p className="text-sm text-slatey-300">{statusHeadline}</p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="emerald">{green} on track</Badge>
            <Badge tone="amber">{amber} at risk</Badge>
            <Badge tone="rose">{red} off track</Badge>
            {gaps > 0 && <Badge tone="orange">{gaps} reported-vs-actual gap{gaps === 1 ? "" : "s"}</Badge>}
            <Badge tone="blue">Adoption {scenario.adoptionIndex}%</Badge>
            <Badge tone="slate">Burn {scenario.burnVariance >= 0 ? "+" : ""}{scenario.burnVariance}% vs plan</Badge>
          </div>
        </div>
      ),
    },
    outcomes: {
      title: "Quarter highlights",
      node: wins.length ? (
        <ul className="space-y-1.5 text-sm text-slatey-300">
          {wins.map((w) => (
            <li key={w.id} className="flex gap-2"><span className="font-semibold text-emerald-700">▲</span><span><span className="font-medium text-ink">{w.name}</span>, {w.brief.whatChanged}</span></li>
          ))}
          <li className="flex gap-2 text-slatey-400"><span className="font-semibold text-primary">•</span><span>Adoption reached {scenario.adoptionIndex}% of target users across the portfolio.</span></li>
        </ul>
      ) : <p className="text-sm text-slatey-400">No workstreams improved this quarter, the story is stabilization, not wins.</p>,
    },
    decisions: {
      title: "Decisions needed",
      node: decisions.length ? (
        <ol className="space-y-2 text-sm">
          {decisions.map((w) => (
            <li key={w.id} className="rounded-md border border-line bg-white p-2.5">
              <div className="mb-0.5 flex items-center gap-2"><Badge tone="blue">Decision</Badge><span className="font-medium text-ink">{w.name}</span></div>
              <p className="text-slatey-300">{w.brief.ask}</p>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-slatey-400">No decisions required this cycle, informational update only.</p>,
    },
    risks: {
      title: "Risks & mitigations",
      node: highRisks.length ? (
        <ul className="space-y-2 text-sm">
          {highRisks.map((r, i) => (
            <li key={i} className="rounded-md border border-line bg-white p-2.5">
              <div className="flex items-start gap-1.5"><Badge tone="rose" className="mt-px shrink-0">high</Badge><span className="text-ink">{r.text}</span></div>
              <p className="mt-1 text-slatey-400"><span className="font-medium text-slatey-300">Mitigation:</span> {r.w.brief.ask}</p>
              <p className="text-[11px] text-slatey-500">{r.w.name} · {r.w.owner}</p>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slatey-400">No high severity risks open.</p>,
    },
    asks: {
      title: "Asks",
      node: (
        <ul className="space-y-1.5 text-sm text-slatey-300">
          {ws.map((w) => (
            <li key={w.id} className="flex items-start gap-2">
              <Badge tone={isDecision(w.brief.ask) ? "blue" : "slate"} className="mt-px shrink-0">{isDecision(w.brief.ask) ? "Decision" : "FYI"}</Badge>
              <span>{w.brief.ask}</span>
            </li>
          ))}
        </ul>
      ),
    },
  };

  const orderedKeys = audience.order.filter((k) => artifact.sections.includes(k));

  const sectionMd: Record<string, () => string> = {
    status: () =>
      `${statusHeadline}\n\n- ${green} on track · ${amber} at risk · ${red} off track${gaps > 0 ? ` · ${gaps} reported-vs-actual gap${gaps === 1 ? "" : "s"}` : ""}\n- Adoption ${scenario.adoptionIndex}% · Burn ${scenario.burnVariance >= 0 ? "+" : ""}${scenario.burnVariance}% vs plan`,
    outcomes: () =>
      wins.length
        ? `${wins.map((w) => `- ▲ **${w.name}**, ${w.brief.whatChanged}`).join("\n")}\n- Adoption reached ${scenario.adoptionIndex}% of target users across the portfolio.`
        : "_No workstreams improved this quarter, the story is stabilization, not wins._",
    decisions: () =>
      decisions.length
        ? decisions.map((w, i) => `${i + 1}. **${w.name}**, ${w.brief.ask}`).join("\n")
        : "_No decisions required this cycle, informational update only._",
    risks: () =>
      highRisks.length
        ? highRisks.map((r) => `- **[high]** ${r.text}\n  - _Mitigation:_ ${r.w.brief.ask} (${r.w.name} · ${r.w.owner})`).join("\n")
        : "_No high severity risks open._",
    asks: () =>
      ws.map((w) => `- ${isDecision(w.brief.ask) ? "**[Decision]**" : "[FYI]"} ${w.brief.ask}`).join("\n"),
  };
  const buildPreRead = (): string => {
    const out: string[] = [`# ${artifact.label}, ${scenario.label}`, "", `**For ${audience.label}.** ${audience.frame}`];
    for (const k of orderedKeys) {
      out.push("", `## ${SECTION[k].title}`, `_Talk track, ${talk[k]}_`, "", sectionMd[k] ? sectionMd[k]() : "");
    }
    return out.join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`${artifact.key}-${scenario.key}-${audience.key}`, buildPreRead(), {
      scenario: `${scenario.label} · ${artifact.label} · for ${audience.label}`,
    });

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-10</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Operating Model and Transformation Leadership Artifacts</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Executive Communication Decision Studio</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Executive communication should not only report status. It should clarify what changed, what decision is needed,
            what risk is being managed, and what action is being requested. Every draft here ends in an <span className="font-semibold text-ink">ask</span>.
          </p>
        </div>

        <UseCaseRail useCases={EL10_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Different stakeholders need the same delivery facts framed differently. A CIO may need risk and strategic implication, a sponsor may need adoption and value, and procurement may need commercial and vendor exposure." approach="The studio consumes shared delivery data and generates executive artifacts such as weekly updates, steering pre reads, and QBR outlines, each organized around status, decisions, risks, mitigations, and asks." why="This connects delivery communication to decision speed, sponsor confidence, stakeholder alignment, risk escalation, and executive operating rhythm." metric="Whether a decision is actually asked; audience fit of the framing." tradeoff="A comfortable status update versus forcing an uncomfortable but necessary decision." outcome="The decision to force this week, framed per audience." />

        {/* Controls */}
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {!activeUc && (
            <Control label="Portfolio">
              {SCENARIOS.map((s) => (
                <Chip key={s.key} on={s.key === scenarioKey} onClick={() => setScenarioKey(s.key)}>{s.label}</Chip>
              ))}
            </Control>
          )}
          <Control label="Artifact">
            {ARTIFACTS.map((a) => (
              <Chip key={a.key} on={a.key === art} onClick={() => setArt(a.key)}>{a.label}</Chip>
            ))}
          </Control>
          <Control label="Audience">
            {AUDIENCES.map((a) => (
              <Chip key={a.key} on={a.key === aud} onClick={() => setAud(a.key)}>{a.label}</Chip>
            ))}
          </Control>
        </div>

        {/* Data-in strip, proves it consumes EL-04's delivery data */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-line bg-white px-3 py-2 text-[11px] text-slatey-500">
          <span className="font-mono uppercase tracking-wide text-slatey-400">Data in →</span>
          {activeUc
            ? <span className="font-medium text-ink">{scenario.label}</span>
            : <Link href="/engagement/raid-radar" className="font-medium text-primary hover:underline">RAID from EL-04</Link>}
          <span>· {green}G / {amber}A / {red}R</span>
          <span>· Adoption {scenario.adoptionIndex}%</span>
          <span>· Burn {scenario.burnVariance >= 0 ? "+" : ""}{scenario.burnVariance}% vs plan</span>
        </div>

        {/* Generated artifact */}
        <Panel className="p-0">
          <div className="flex items-start justify-between gap-3 border-b border-line bg-slate-50 px-5 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{artifact.label} · {scenario.label}</p>
              <p className="mt-0.5 text-sm text-slatey-400"><span className="font-medium text-ink">For {audience.label}.</span> {audience.frame}</p>
            </div>
            <ArtifactButton label="Generate the pre read" onClick={onGenerate} title="Download this pre read as Markdown" />
          </div>
          <div className="divide-y divide-line">
            {orderedKeys.map((k) => {
              const sec = SECTION[k];
              return (
                <section key={k} className="px-5 py-4">
                  <h2 className="text-sm font-semibold text-ink">{sec.title}</h2>
                  <p className="mb-2 mt-0.5 text-[11px] italic text-slatey-500">Talk track, {talk[k]}</p>
                  {sec.node}
                </section>
              );
            })}
          </div>
        </Panel>

        {/* Credibility block */}
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Send executive updates that end in decisions, asks, and accountable next steps." lift="Improves leadership alignment by converting delivery data into decision ready communication." measure="Decisions requested, decisions made, risk acceptance, action closure, stakeholder response time." />
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "An executive update with no decision request is a diary entry. Every pre read should ask for something."}
          </p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, weekly leadership updates and QBRs across multiple AMEX portfolios.</p>}

          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Stack: Next.js (static) + the shared design system; client side state only.</p>
              <p>Input: the same authored portfolio data EL-04 reads (RAID + trend + adoption + burn), a single source, so this genuinely consumes the delivery instrument rather than restating it.</p>
              <p>Generation: deterministic. Decisions are extracted from each workstream&apos;s ask; risks pull the high severity items and pair each with the mitigation already in motion; the status headline and section order rewrite by audience.</p>
              <p>The per section talk track is templated here; a LIVE variant can generate it via LIVE_MODEL without changing the Status → Decisions → Risks → Asks discipline.</p>
            </div>
          </details>

          <p className="text-xs text-slatey-500">
            <span className="font-semibold text-slatey-400">Limitations:</span> this artifact uses modeled portfolio data and generated framing. Real executive communication requires current facts, stakeholder context, political judgment, and review by the accountable delivery lead.
          </p>
        </div>
      </main>
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="stat-label mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${on ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
      {children}
    </button>
  );
}
