"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass, Database, Boxes, Rocket, ShieldCheck, TrendingUp, RefreshCcw, ArrowRight, ArrowDownRight, CheckCircle2, Circle, type LucideIcon,
} from "lucide-react";
import {
  useProgramSource, STORY_SPINE, storyProgress,
  buildDataReadinessHandoff, buildBuildOutputContract, computeReleaseReadiness, deriveGovernanceDecision,
  type ProgramState, type StageKey, type StoryBeat, type StoryHeadline, type StoryTone,
} from "@labs/program-core";
import { ArchetypeExplorer } from "./ArchetypeExplorer";

const ICONS: Record<StageKey, LucideIcon> = {
  frame: Compass, data: Database, build: Boxes, deploy: Rocket, govern: ShieldCheck, realize: TrendingUp, operate: RefreshCcw,
};

const CHIP: Record<StoryTone, string> = {
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  watch: "bg-amber-50 text-amber-700 ring-amber-600/20",
  risk: "bg-rose-50 text-rose-700 ring-rose-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-400/20",
};

export function StorylineView() {
  // Demo mode tells the curated, complete story; Live reflects what's been run.
  const { src, hydrated } = useProgramSource();
  const progress = storyProgress(src);
  const betName = src.initiative?.name ?? null;
  const realize = STORY_SPINE[STORY_SPINE.length - 1];

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <header>
        <p className="eyebrow">The 2-minute story</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          One initiative, from a rough idea to a <span className="text-primary">business case you can defend</span>.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slatey-300">
          {betName
            ? <>Following <span className="font-medium text-ink">&ldquo;{betName}&rdquo;</span> through all six stages. Each stage answers one question and produces one number the next stage builds on — so the final ROI traces all the way back to the first decision.</>
            : <>This is the shape of the whole program: six stages, each answering one question and handing one number to the next. Frame a bet (or switch to Demo) to see it told with real numbers.</>}
        </p>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-medium text-primary-dark">
            {progress.done} of {progress.total} stages told
          </span>
          <span className="text-slatey-400">Read top to bottom — open any stage to go deep.</span>
        </div>
      </header>

      {/* Phase K — the six sample programs, as an invitation */}
      <ArchetypeExplorer />

      {/* Phase F — the whole program in one shape */}
      {betName && <ReadinessRadar state={src} />}

      {/* Beats */}
      <ol className="space-y-3">
        {STORY_SPINE.map((beat, i) => (
          <Beat key={beat.key} beat={beat} state={src} last={i === STORY_SPINE.length - 1} />
        ))}
      </ol>

      {/* Closing payoff */}
      <ClosingCase realize={realize} state={src} />
    </div>
  );
}

function Beat({ beat, state, last }: { beat: StoryBeat; state: Parameters<StoryBeat["read"]>[0]; last: boolean }) {
  const Icon = ICONS[beat.key];
  const done = beat.isDone(state);
  const heads = beat.read(state);

  return (
    <li className="relative">
      <div className="flex gap-4">
        {/* rail */}
        <div className="flex flex-col items-center">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${done ? "bg-primary/10 text-primary ring-primary/20" : "bg-slate-100 text-slatey-400 ring-slate-300/40"}`}>
            <Icon className="h-5 w-5" />
          </span>
          {!last && <span className="my-1 w-px flex-1 bg-line" />}
        </div>

        {/* card */}
        <div className="mb-1 flex-1 rounded-xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slatey-500">{beat.n}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slatey-400">{beat.label}</span>
            {done
              ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
              : <Circle className="ml-auto h-4 w-4 text-slatey-300" />}
          </div>

          <h2 className="mt-1 text-base font-semibold text-ink">{beat.question}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slatey-400">{beat.soWhat(state)}</p>

          {/* headline chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {heads.map((h: StoryHeadline) => (
              <span key={h.label} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${CHIP[h.tone]}`}>
                <span className="text-slatey-500">{h.label}</span>
                <span className="font-semibold">{h.value}</span>
              </span>
            ))}
          </div>

          {/* in / out thread + open */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5 text-[11px] text-slatey-400">
            <span className="inline-flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-slatey-300" />
              in: {beat.inFrom} · out: <span className="text-slatey-300">{beat.outTo}</span>
            </span>
            <Link href={beat.href} className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-dark">
              Open {beat.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

function ClosingCase({ realize, state }: { realize: StoryBeat; state: Parameters<StoryBeat["read"]>[0] }) {
  const heads = realize.read(state);
  const done = realize.isDone(state);
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] to-white p-6 shadow-card">
      <p className="eyebrow text-primary-dark">The payoff</p>
      <h2 className="mt-1 text-xl font-semibold text-ink">{realize.soWhat(state)}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {heads.map((h) => (
          <span key={h.label} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${CHIP[h.tone]}`}>
            <span className="text-slatey-500">{h.label}</span>
            <span className="font-semibold">{h.value}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slatey-400">
        Every number above is produced by a stage and carried forward — nothing is hand-waved. That traceability is the
        difference between a demo and a business case.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/story/brief" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark">
          View the board brief <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/realize" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark">
          {done ? "Open the full business case" : "Build the business case"} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ---- Phase F · program readiness radar ---------------------------------------
// Six axes, one shape: the whole program's health at a glance. Values come from
// the same engines the stages use; the Realize axis is ROI capped at 100.
const RADAR_AXES: { key: StageKey; label: string }[] = [
  { key: "frame", label: "Strategy" }, { key: "data", label: "Data" }, { key: "build", label: "Build" },
  { key: "deploy", label: "Operate" }, { key: "govern", label: "Govern" }, { key: "realize", label: "Realize" },
];

function radarValues(s: ProgramState): Partial<Record<StageKey, number>> {
  if (!s.initiative?.name) return {};
  const sc = s.initiative.scores;
  return {
    frame: sc ? Math.round(sc.value * 0.4 + sc.feasibility * 0.3 + sc.dataReadiness * 0.3) : undefined,
    data: (s.data?.handoff ?? buildDataReadinessHandoff(s)).dataReadinessScore,
    build: (s.rag?.contract ?? buildBuildOutputContract(s)).qualityScore,
    deploy: computeReleaseReadiness(s).score,
    govern: (s.governance?.decision ?? deriveGovernanceDecision(s)).score,
    realize: s.outcomes?.roi !== undefined ? Math.min(100, Math.round(s.outcomes.roi)) : undefined,
  };
}

const TARGET = 80; // the "pilot-ready" reference ring

const bandColor = (v: number) => (v >= 75 ? "#059669" : v >= 55 ? "#d97706" : "#e11d48");

function ReadinessRadar({ state }: { state: ProgramState }) {
  const vals = radarValues(state);
  const axes = RADAR_AXES.filter((a) => vals[a.key] !== undefined);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 60); return () => clearTimeout(t); }, []);
  if (axes.length < 3) return null;

  const CX = 132, CY = 118, R = 80, W = 264, H = 236;
  const pt = (i: number, v: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [CX + Math.cos(ang) * R * (v / 100), CY + Math.sin(ang) * R * (v / 100)] as const;
  };
  const ring = (v: number) => axes.map((_, i) => pt(i, v).join(",")).join(" ");
  const shape = axes.map((a, i) => pt(i, vals[a.key]!).join(",")).join(" ");

  const weakest = axes.reduce((min, a) => (vals[a.key]! < vals[min.key]! ? a : min), axes[0]);
  const weakestIdx = axes.indexOf(weakest);
  const [wx, wy] = pt(weakestIdx, vals[weakest.key]!);
  const avg = Math.round(axes.reduce((s, a) => s + vals[a.key]!, 0) / axes.length);

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-line bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-card">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-64 shrink-0" role="img" aria-label={`Program readiness radar — average ${avg}, weakest ${weakest.label} at ${vals[weakest.key]}`}>
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1f6fc4" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#1f6fc4" stopOpacity="0.10" />
          </radialGradient>
        </defs>

        {/* grid rings + faint scale labels */}
        {[100, 66, 33].map((v) => <polygon key={v} points={ring(v)} fill="none" stroke="#e2e8f0" />)}
        <text x={CX + 4} y={CY - R * 0.33 - 2} fontSize="7.5" fill="#cbd5e1">33</text>
        <text x={CX + 4} y={CY - R * 0.66 - 2} fontSize="7.5" fill="#cbd5e1">66</text>

        {/* spokes + axis labels with band-colored values */}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 100);
          const [lx, ly] = pt(i, 126);
          const v = vals[a.key]!;
          return (
            <g key={a.key}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="#e2e8f0" />
              <text x={lx} y={ly} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={a.key === weakest.key ? "#be123c" : "#64748b"}>
                {a.label}
                <tspan x={lx} dy="9" fontSize="9" fontWeight="700" fill={bandColor(v)}>{v}</tspan>
              </text>
            </g>
          );
        })}

        {/* pilot-ready target ring */}
        <polygon points={ring(TARGET)} fill="none" stroke="#94a3b8" strokeDasharray="4 3" strokeWidth="1.2" />
        <text x={CX + 4} y={CY - R * 0.8 - 3} fontSize="7.5" fontWeight="600" fill="#94a3b8">pilot-ready {TARGET}</text>

        {/* the program shape — draws in on mount */}
        <g style={{
          transformOrigin: `${CX}px ${CY}px`,
          transform: drawn ? "scale(1)" : "scale(0.55)",
          opacity: drawn ? 1 : 0,
          transition: "transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 500ms ease",
        }}>
          <polygon points={shape} fill="url(#radarFill)" stroke="#1f6fc4" strokeWidth="2.25" strokeLinejoin="round">
            <title>{axes.map((a) => `${a.label} ${vals[a.key]}`).join(" · ")}</title>
          </polygon>
          {/* weakest spoke: the next thing to fix */}
          <line x1={CX} y1={CY} x2={wx} y2={wy} stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" />
          {axes.map((a, i) => {
            const [x, y] = pt(i, vals[a.key]!);
            const weak = a.key === weakest.key;
            return (
              <circle key={a.key} cx={x} cy={y} r={weak ? 5 : 3.5} fill={bandColor(vals[a.key]!)} stroke="#fff" strokeWidth="1.5">
                <title>{a.label}: {vals[a.key]}/100</title>
              </circle>
            );
          })}
        </g>

        {/* center average */}
        <text x={CX} y={CY + 3.5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#152433">{avg}</text>
        <text x={CX} y={CY + 13} textAnchor="middle" fontSize="6.5" fill="#94a3b8">avg</text>
      </svg>

      <div className="min-w-[180px] flex-1">
        <p className="eyebrow">Program shape</p>
        <p className="mt-1 text-sm leading-relaxed text-slatey-400">
          The closer the shape hugs the dashed <b className="text-slatey-300">pilot-ready</b> ring, the readier the initiative.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
          {axes.map((a) => (
            <span key={a.key} className="flex justify-between gap-2">
              <span className={a.key === weakest.key ? "font-medium text-rose-700" : "text-slatey-400"}>{a.label}</span>
              <span className="font-mono font-semibold" style={{ color: bandColor(vals[a.key]!) }}>{vals[a.key]}</span>
            </span>
          ))}
        </div>
        <p className="mt-2.5 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-rose-700">
          Shortest spoke: <b>{weakest.label} · {vals[weakest.key]}</b> — fix this next to round out the shape.
        </p>
      </div>
    </div>
  );
}
