"use client";

// EL-02 · Stakeholder & Sponsor Alignment Cockpit (Collection 4 · control room).
// Power/interest grid + sentiment trajectories over program weeks. The sponsor
// drifting from champion to neutral gets flagged; selecting a stakeholder drafts
// the pre-steering briefing, who needs to hear what, from whom, before the meeting.
// Programs lose sponsors in the silence between meetings, not in them. SIMULATED.

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown } from "lucide-react";
import { useInViewport, usePlayback, InstrumentShell, DecisionSummary, Provenance, Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, type BadgeTone } from "@labs/design-system";
import { EL02_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { EvidenceTable, NumericControl, useScenarioLink, ScenarioActions, validateScenario, oneOf, bounded, bool, shortString, recordOf } from "../business/DecisionTools";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown, ArtifactButton } from "../artifact/artifact";

interface SH {
  key: string; name: string; role: string; power: number; interest: number; traj: number[];
  brief: { why: string; who: string; message: string; before: string };
}

const SENT = ["Blocker", "Skeptic", "Neutral", "Supporter", "Champion"];
const SENT_TONE: BadgeTone[] = ["rose", "orange", "amber", "blue", "emerald"];
const SENT_HEX = ["#e24b4a", "#ea580c", "#d97706", "#1f6fc4", "#16a34a"];

const STAKEHOLDERS: SH[] = [
  { key: "cio", name: "Exec sponsor (CIO)", role: "Manage closely", power: 0.9, interest: 0.85, traj: [4, 4, 3, 3, 2, 2],
    brief: { why: "Two quiet weeks, no win shared since the pilot demo, and a peer flagged cost. Champion energy is cooling to neutral.", who: "You, in a 1:1 before the steering, not during it.", message: "Bring one concrete win (containment +5 pts) and the single decision you need; re anchor the why.", before: "48 hours before the pre read goes out." } },
  { key: "vp", name: "Business owner (VP Servicing)", role: "Manage closely", power: 0.8, interest: 0.9, traj: [3, 3, 3, 3, 3, 3],
    brief: { why: "Steady supporter; owns the outcome and the floor.", who: "Delivery lead, weekly.", message: "Keep sharing adoption numbers; ask them to co present the win at steering.", before: "In the normal weekly." } },
  { key: "risk", name: "Head of Risk", role: "Keep satisfied", power: 0.85, interest: 0.5, traj: [2, 1, 1, 1, 1, 1],
    brief: { why: "Skeptical since the autonomy question went unanswered; can block at gate.", who: "You + delivery lead, ahead of steering.", message: "Walk the risk tiering and human oversight design; convert the objection into a control they own.", before: "This week, before the gate review." } },
  { key: "fin", name: "Finance partner", role: "Keep informed", power: 0.6, interest: 0.8, traj: [2, 2, 2, 2, 2, 2],
    brief: { why: "Neutral, cost focused; wants the run rate story.", who: "You, with the ROI range.", message: "Share the NPV range and the caching savings; preempt the cost question.", before: "With the pre read." } },
  { key: "del", name: "Delivery lead", role: "Keep informed", power: 0.55, interest: 0.9, traj: [4, 4, 4, 4, 4, 4],
    brief: { why: "Champion and closest to the work.", who: "Peer-to-peer.", message: "Use them to co present and to reach Risk and Security.", before: "Ongoing." } },
  { key: "floor", name: "Floor manager", role: "Keep informed", power: 0.3, interest: 0.85, traj: [3, 3, 2, 3, 3, 3],
    brief: { why: "Supportive but anxious about the team; a mid program wobble.", who: "Change lead, on the floor.", message: "Reassure on the champion model and the feedback loop; surface a floor win.", before: "This week." } },
  { key: "sec", name: "Security lead", role: "Keep satisfied", power: 0.6, interest: 0.55, traj: [2, 2, 2, 1, 1, 1],
    brief: { why: "Drifting to skeptic after the data flow review raised questions.", who: "You + delivery lead.", message: "Bring the data handling and logging design; close the two open items in writing.", before: "Before the gate." } },
  { key: "comms", name: "Change / comms lead", role: "Keep informed", power: 0.35, interest: 0.8, traj: [3, 4, 4, 4, 4, 4],
    brief: { why: "Rising champion; driving the adoption narrative.", who: "Peer.", message: "Equip them with the wins to broadcast; point them at the floor manager.", before: "Ongoing." } },
];

const last = (t: number[]) => t[t.length - 1];
const drifting = (t: number[]) => last(t) < t[0];

function Spark({ traj }: { traj: number[] }) {
  const W = 64, H = 18;
  const pts = traj.map((v, i) => `${(i / (traj.length - 1)) * W},${H - (v / 4) * H}`).join(" ");
  const down = drifting(traj);
  return <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0"><polyline points={pts} fill="none" stroke={down ? "#e24b4a" : "#0d9488"} strokeWidth="1.5" /></svg>;
}

export function StakeholderCockpit() {
  const historyRef = useRef<HTMLDivElement>(null);
  const historyVisible = useInViewport(historyRef);
  const weeks = usePlayback({ steps: 5, intervalMs: 1400, initiallyComplete: true, visible: historyVisible });
  const [sel, setSel] = useState("cio");
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL02_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL02_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const shs: SH[] = activeUc ? activeUc.payload.stakeholders : STAKEHOLDERS;
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? EL02_USE_CASES.find((u) => u.id === id) ?? null : null;
    setSel((uc ? uc.payload.stakeholders : STAKEHOLDERS)[0].key);
  };
  const s = shs.find((x) => x.key === sel) ?? shs[0];
  const currentSentiment = (x: SH) => x.traj[Math.min(weeks.index, x.traj.length - 1)];
  const isDrifting = (x: SH) => currentSentiment(x) < x.traj[0];
  const flags = shs.filter(isDrifting);

  const buildBriefing = (): string => {
    const targets: SH[] = flags.length ? flags : [s];
    const block = (x: SH): string =>
      [
        `### ${x.name}, ${SENT[currentSentiment(x)]}${isDrifting(x) ? " (drifting)" : ""}`,
        `- **Why now:** ${x.brief.why}`,
        `- **Who talks to them:** ${x.brief.who}`,
        `- **The message:** ${x.brief.message}`,
        `- **By when:** ${x.brief.before}`,
        "",
      ].join("\n");
    return [
      "# Pre-steering stakeholder briefing",
      "",
      `**Drifting stakeholders:** ${flags.length} of ${shs.length}`,
      "",
      ...targets.map(block),
      "## The move",
      "",
      "Sentiment moves between meetings, not in them. Each 1:1 above is aimed to re-anchor a specific stakeholder before the room, who, what, from whom, by when.",
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown("stakeholder-briefing", buildBriefing(), { scenario: activeUc ? activeUc.title : "Default program" });

  const savedState = { sel, week: weeks.index };
  const scenarioLink = useScenarioLink({ id: "EL-02", state: savedState, activeId: activeUcId,
    restore: (s) => { setSel(s.sel); weeks.setIndex(s.week); },
    validate: (v): v is typeof savedState => validateScenario(v, { sel: shortString, week: oneOf([0,1,2,3,4,5]) }),
  });

  return (
    <InstrumentShell title="Stakeholder alignment" eyebrow="Operating model & engagement" description="Know who needs a conversation, why it matters and what to ask."
      breadcrumbs={[{ label: "Portfolio", href: "/#collections" }, { label: "EL-02" }]}
      decision={<DecisionSummary title={`${flags.length} stakeholders are drifting`} explanation={`Selected: ${s.name}. ${s.brief.why}`} nextAction={s.brief.message} tone={flags.length ? "caution" : "positive"} />}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Authored sample with editable assumptions"} method="Deterministic browser model" note={`Authored sample reference date: ${activeUc?.lastVerified ?? "2026-07-02"}. Projected outcomes; no live telemetry or independent verification.`} />}
      controls={<><UseCaseRail useCases={EL02_USE_CASES} activeId={activeUcId} onSelect={(id) => { scenarioLink.clear(); selectUseCase(id); }} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}<ScenarioActions {...scenarioLink} reset={() => { selectUseCase(activeUcId); scenarioLink.clear(); }} /></>}
      method={<CaseStudy problem="Programs rarely lose executive support all at once. Support erodes when concerns go unaddressed between meetings. A useful alignment view shows influence, interest, sentiment, drift, and the next conversation required." approach="The cockpit maps stakeholders by power and interest, tracks sentiment over six weeks, flags downward drift, and generates a pre steering briefing for the selected stakeholder." why="This connects stakeholder governance to program momentum, decision speed, escalation prevention, and sponsor confidence." metric="Alignment gap per stakeholder; who is drifting and how much influence they hold." tradeoff="Time spent aligning ahead of the meeting versus a blindside inside it." outcome="Who needs to hear what, from whom, before the meeting." />}

    >

        <div ref={historyRef}><Panel className="mb-5"><div className="grid gap-4 sm:grid-cols-[1fr_auto]"><NumericControl label="Historical sentiment snapshot" value={weeks.index + 1} min={1} max={6} onChange={(v) => { weeks.pause(); weeks.setIndex(v - 1); }} format={(v) => `Week ${v} of 6`} /><div className="flex flex-wrap items-center gap-2"><button className="rounded-lg border border-line px-3 py-2 text-sm" onClick={weeks.playing ? weeks.pause : weeks.replay}>{weeks.playing ? "Pause history" : "Replay six weeks"}</button><button className="rounded-lg border border-line px-3 py-2 text-sm" onClick={weeks.next} disabled={weeks.index >= 5}>Next week</button><button className="rounded-lg border border-line px-3 py-2 text-sm" onClick={weeks.complete}>Latest</button></div></div><p className="mt-3 text-sm text-slatey-400" aria-live="polite">Week {weeks.index + 1}: {flags.length} stakeholders are below their starting sentiment. The briefing is authored from the latest six-week context.</p><EvidenceTable caption="All stakeholder sentiment values" headings={["Stakeholder", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]} rows={shs.map((x) => [x.name, ...x.traj.map((value) => SENT[value])])} /></Panel>

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
          {/* Grid */}
          <Panel>
            <p className="stat-label mb-2">Power × interest</p>
            <div className="relative mx-auto h-64 w-full rounded-lg border border-line bg-slate-50/50">
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
              <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-line" />
              <span className="absolute left-2 top-1 text-[10px] text-slatey-500">Keep satisfied</span>
              <span className="absolute right-2 top-1 text-[10px] text-slatey-500">Manage closely</span>
              <span className="absolute bottom-1 left-2 text-[10px] text-slatey-500">Monitor</span>
              <span className="absolute bottom-1 right-2 text-[10px] text-slatey-500">Keep informed</span>
              {shs.map((x) => {
                const cur = currentSentiment(x);
                const on = x.key === sel;
                return (
                  <button key={x.key} aria-pressed={x.key === sel} onClick={() => setSel(x.key)} aria-label={`${x.name}: ${SENT[currentSentiment(x)]}`} title={x.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" style={{ left: `${x.interest * 86 + 7}%`, top: `${(1 - x.power) * 82 + 8}%` }}>
                    <span className={`block rounded-full ring-2 ring-white ${on ? "h-4 w-4 outline outline-2 outline-ink" : "h-3 w-3"} ${isDrifting(x) ? "outline outline-2 outline-rose-500/70" : ""}`} style={{ background: SENT_HEX[cur] }} />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slatey-500">Dot color = selected-week sentiment; rose outline = drifting. X = interest, Y = power.</p>
          </Panel>

          {/* List */}
          <Panel>
            <p className="stat-label mb-2">Stakeholders <span className="font-normal text-slatey-500">· 6-week trajectory</span></p>
            <div className="space-y-1">
              {shs.map((x) => {
                const cur = currentSentiment(x);
                const on = x.key === sel;
                return (
                  <button key={x.key} aria-pressed={x.key === sel} onClick={() => setSel(x.key)} className={`flex w-full flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition ${on ? "border-primary bg-primary-soft" : "border-transparent hover:bg-slate-50"}`}>
                    <div className="min-w-0 basis-28 flex-1">
                      <p className="truncate text-xs font-medium text-ink">{x.name}</p>
                      <p className="text-[10px] text-slatey-500">{x.role}</p>
                    </div>
                    <Spark traj={x.traj} />
                    <Badge tone={SENT_TONE[cur]}>{SENT[cur]}</Badge>
                    {isDrifting(x) && <TrendingDown className="h-4 w-4 shrink-0 text-rose-600" />}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        </div>
        {/* Briefing */}
        <Panel className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="stat-label">Pre steering briefing</p>
            <span className="text-sm font-semibold text-ink">{s.name}</span>
            <Badge tone={SENT_TONE[currentSentiment(s)]}>{SENT[currentSentiment(s)]}</Badge>
            {isDrifting(s) && <Badge tone="rose">drifting</Badge>}
            <span className="ml-auto"><ArtifactButton label="Download the briefing" onClick={onGenerate} title="Download the pre steering briefing as Markdown" /></span>
          </div>
          <div className="grid min-w-0 items-start gap-2 text-sm sm:grid-cols-2">
            <Field k="Why now" v={s.brief.why} />
            <Field k="Who talks to them" v={s.brief.who} />
            <Field k="The message" v={s.brief.message} />
            <Field k="By when" v={s.brief.before} />
          </div>
        </Panel>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Intervene with the right stakeholder before support loss becomes visible in steering." lift="Reduces avoidable escalations and protects decision momentum." measure="Alignment score, drift flags, sponsor sentiment, decision delays, escalation frequency." />
          <InsightCard title={`${flags.length} stakeholders drifting`} tone="warn">
            Sentiment moves between meetings, not in them. The sponsor cooling from champion to neutral is invisible on a
            status report and obvious on a trajectory, and it&apos;s recoverable with one well-aimed 1:1 before the room.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "Programs do not lose sponsors in the meeting. They lose them in the silence before the meeting."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo, multi stakeholder consulting delivery (Deloitte/Verizon, Genpact/Morgan Stanley).</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each stakeholder carries a power/interest coordinate (grid placement) and a six week sentiment trajectory (Blocker→Champion). Drift = latest sentiment below the starting point; the briefing is authored per stakeholder around who, what, from whom, and by when.</p>
              <p>Stack: Next.js (static) + shared design system; client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a simulated stakeholder model. Real use would require stakeholder interviews, relationship context, meeting history, sentiment inputs, and judgment from the delivery lead.</p>
        </div>

    </InstrumentShell>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md border border-line bg-white p-2.5"><p className="text-[11px] font-semibold text-slatey-400">{k}</p><p className="mt-0.5 text-slatey-300">{v}</p></div>;
}
