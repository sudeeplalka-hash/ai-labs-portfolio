"use client";

// EL-02 · Stakeholder & Sponsor Alignment Cockpit (Collection 4 · control room).
// Power/interest grid + sentiment trajectories over program weeks. The sponsor
// drifting from champion to neutral gets flagged; selecting a stakeholder drafts
// the pre-steering briefing — who needs to hear what, from whom, before the meeting.
// Programs lose sponsors in the silence between meetings, not in them. SIMULATED.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, type BadgeTone } from "@labs/design-system";
import { EL02_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

interface SH {
  key: string; name: string; role: string; power: number; interest: number; traj: number[];
  brief: { why: string; who: string; message: string; before: string };
}

const SENT = ["Blocker", "Skeptic", "Neutral", "Supporter", "Champion"];
const SENT_TONE: BadgeTone[] = ["rose", "orange", "amber", "blue", "emerald"];
const SENT_HEX = ["#e24b4a", "#ea580c", "#d97706", "#1f6fc4", "#16a34a"];

const STAKEHOLDERS: SH[] = [
  { key: "cio", name: "Exec sponsor (CIO)", role: "Manage closely", power: 0.9, interest: 0.85, traj: [4, 4, 3, 3, 2, 2],
    brief: { why: "Two quiet weeks — no win shared since the pilot demo, and a peer flagged cost. Champion energy is cooling to neutral.", who: "You, in a 1:1 before the steering — not during it.", message: "Bring one concrete win (containment +5 pts) and the single decision you need; re-anchor the why.", before: "48 hours before the pre-read goes out." } },
  { key: "vp", name: "Business owner (VP Servicing)", role: "Manage closely", power: 0.8, interest: 0.9, traj: [3, 3, 3, 3, 3, 3],
    brief: { why: "Steady supporter; owns the outcome and the floor.", who: "Delivery lead, weekly.", message: "Keep sharing adoption numbers; ask them to co-present the win at steering.", before: "In the normal weekly." } },
  { key: "risk", name: "Head of Risk", role: "Keep satisfied", power: 0.85, interest: 0.5, traj: [2, 1, 1, 1, 1, 1],
    brief: { why: "Skeptical since the autonomy question went unanswered; can block at gate.", who: "You + delivery lead, ahead of steering.", message: "Walk the risk-tiering and human-oversight design; convert the objection into a control they own.", before: "This week, before the gate review." } },
  { key: "fin", name: "Finance partner", role: "Keep informed", power: 0.6, interest: 0.8, traj: [2, 2, 2, 2, 2, 2],
    brief: { why: "Neutral, cost-focused; wants the run-rate story.", who: "You, with the ROI range.", message: "Share the NPV range and the caching savings; pre-empt the cost question.", before: "With the pre-read." } },
  { key: "del", name: "Delivery lead", role: "Keep informed", power: 0.55, interest: 0.9, traj: [4, 4, 4, 4, 4, 4],
    brief: { why: "Champion and closest to the work.", who: "Peer-to-peer.", message: "Use them to co-present and to reach Risk and Security.", before: "Ongoing." } },
  { key: "floor", name: "Floor manager", role: "Keep informed", power: 0.3, interest: 0.85, traj: [3, 3, 2, 3, 3, 3],
    brief: { why: "Supportive but anxious about the team; a mid-program wobble.", who: "Change lead, on the floor.", message: "Reassure on the champion model and the feedback loop; surface a floor win.", before: "This week." } },
  { key: "sec", name: "Security lead", role: "Keep satisfied", power: 0.6, interest: 0.55, traj: [2, 2, 2, 1, 1, 1],
    brief: { why: "Drifting to skeptic after the data-flow review raised questions.", who: "You + delivery lead.", message: "Bring the data-handling and logging design; close the two open items in writing.", before: "Before the gate." } },
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
  const flags = shs.filter((x) => drifting(x.traj));

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-02</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Engagement Leadership · Control room</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Stakeholder &amp; Sponsor Alignment Cockpit</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            A snapshot lies; a trajectory tells the truth. The grid places each stakeholder by power and interest, the
            sparklines show where sentiment is heading — {activeUc ? activeUc.payload.drivingLine : `and ${flags.length} are drifting, including the sponsor.`}
          </p>
        </div>

        <UseCaseRail useCases={EL02_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        <div className="grid gap-6 lg:grid-cols-2">
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
                const cur = last(x.traj);
                const on = x.key === sel;
                return (
                  <button key={x.key} onClick={() => setSel(x.key)} aria-label={`${x.name}: ${SENT[last(x.traj)]}`} title={x.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x.interest * 86 + 7}%`, top: `${(1 - x.power) * 82 + 8}%` }}>
                    <span className={`block rounded-full ring-2 ring-white ${on ? "h-4 w-4 outline outline-2 outline-ink" : "h-3 w-3"} ${drifting(x.traj) ? "outline outline-2 outline-rose-500/70" : ""}`} style={{ background: SENT_HEX[cur] }} />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slatey-500">Dot color = current sentiment; rose outline = drifting. X = interest, Y = power.</p>
          </Panel>

          {/* List */}
          <Panel>
            <p className="stat-label mb-2">Stakeholders <span className="font-normal text-slatey-500">· 6-week trajectory</span></p>
            <div className="space-y-1">
              {shs.map((x) => {
                const cur = last(x.traj);
                const on = x.key === sel;
                return (
                  <button key={x.key} onClick={() => setSel(x.key)} className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-1.5 text-left transition ${on ? "border-primary bg-primary-soft" : "border-transparent hover:bg-slate-50"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink">{x.name}</p>
                      <p className="text-[10px] text-slatey-500">{x.role}</p>
                    </div>
                    <Spark traj={x.traj} />
                    <Badge tone={SENT_TONE[cur]}>{SENT[cur]}</Badge>
                    {drifting(x.traj) && <TrendingDown className="h-4 w-4 shrink-0 text-rose-600" />}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Briefing */}
        <Panel className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="stat-label">Pre-steering briefing</p>
            <span className="text-sm font-semibold text-ink">{s.name}</span>
            <Badge tone={SENT_TONE[last(s.traj)]}>{SENT[last(s.traj)]}</Badge>
            {drifting(s.traj) && <Badge tone="rose">drifting</Badge>}
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Field k="Why now" v={s.brief.why} />
            <Field k="Who talks to them" v={s.brief.who} />
            <Field k="The message" v={s.brief.message} />
            <Field k="By when" v={s.brief.before} />
          </div>
        </Panel>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title={`${flags.length} stakeholders drifting`} tone="warn">
            Sentiment moves between meetings, not in them. The sponsor cooling from champion to neutral is invisible on a
            status report and obvious on a trajectory — and it&apos;s recoverable with one well-aimed 1:1 before the room.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "Programs don't lose sponsors in meetings; they lose them in the silence between meetings."}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo — multi-stakeholder consulting delivery (Deloitte/Verizon, Genpact/Morgan Stanley).</p>}
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each stakeholder carries a power/interest coordinate (grid placement) and a six-week sentiment trajectory (Blocker→Champion). Drift = latest sentiment below the starting point; the briefing is authored per stakeholder around who, what, from whom, and by when.</p>
              <p>Stack: Next.js (static) + shared design system; client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> sentiment is a judgment read, not instrumented; archetypes are illustrative. It structures the alignment work between meetings, not a CRM.</p>
        </div>
      </main>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md border border-line bg-white p-2.5"><p className="text-[11px] font-semibold text-slatey-400">{k}</p><p className="mt-0.5 text-slatey-300">{v}</p></div>;
}
