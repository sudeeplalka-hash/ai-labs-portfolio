import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GAP07_USE_CASES, progress, type LabEntry } from "@labs/kit";
import { evaluate, type PKey } from "@labs/engines";
const LABEL: Record<PKey, string> = { fc: "Function calling", mcp: "MCP", a2a: "A2A", hybrid: "MCP + A2A" };
const BEATS: Record<string, string[]> = {
 "GAP-03": ["One request", "Actual handoffs", "Cost / quality verdict"],
 "GAP-07": ["Six criteria", "Four protocols", "One explainable choice"],
 "C3-5": ["Assumption", "Cash flow", "Fund or defer"],
 "C3-1": ["Initiative", "Constraint", "Capital allocation"],
 "EL-01": ["Readiness", "Gating factor", "Next intervention"]
};
export function HeroCaseStudies({ labs }: { labs: LabEntry[] }) {
 const sample = GAP07_USE_CASES[0];
 const result = evaluate(sample.payload.answers);
 const ranked = (Object.entries(result.scores) as [PKey, number][]).sort((a,b)=>b[1]-a[1]);
 return <section id="cases" className="mb-10 mt-10 scroll-mt-24">
  <p className="eyebrow text-primary">Five decisions. Inspectable evidence.</p>
  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Start with a choice, then challenge it.</h2>
  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slatey-400">Open a case, change an assumption, and see why the recommendation holds or changes. The other {progress().total-labs.length} artifacts show the wider range.</p>
  <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
   <article className="rounded-2xl border border-line bg-ink p-6 text-white md:p-8">
    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-white/30 px-2 py-1">Featured case · Architecture</span><span className="text-amber-200">SIMULATED · published scoring model</span></div>
    <h3 className="mt-5 text-2xl font-semibold leading-tight">Why this protocol, and what would change the call?</h3>
    <p className="mt-3 text-sm leading-relaxed text-slate-300">{sample.title}</p>
    <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-4">
      <p className="text-xs text-slate-300">Recommendation at the supplied scenario</p>
      <p className="mt-1 text-2xl font-semibold">{LABEL[result.primary]}</p>
      <div className="mt-4 space-y-3">{ranked.map(([key,score])=><div key={key}><div className="flex items-baseline justify-between gap-2 text-xs"><span>{LABEL[key]}</span><span className="font-mono">{score.toFixed(2)} points</span></div><div className="mt-1 h-1.5 rounded bg-white/15" aria-hidden><div className="h-full rounded bg-blue-300" style={{width:`${score / ranked[0][1]*100}%`}} /></div></div>)}</div>
      <p className="mt-4 text-xs leading-relaxed text-slate-300">Runner-up: {LABEL[result.runnerUp]}. Lead: {(result.scores[result.primary]-result.scores[result.runnerUp]).toFixed(2)} points. Scores express model fit, not a probability of success.</p>
    </div>
    <Link href={`/agents/protocol-selection?uc=${sample.id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink">Challenge this recommendation <ArrowRight size={16}/></Link>
   </article>
   <div className="grid gap-3">{labs.filter(l=>l.id!=="GAP-07").map(l=><Link href={l.href!} key={l.id} className="group rounded-xl border border-line bg-white p-5 transition hover:border-primary/50 hover:shadow-card"><div className="flex flex-wrap items-center gap-2 text-[11px] text-slatey-400"><span className="font-mono text-primary">{l.id}</span><span>{l.live}</span></div><h3 className="mt-2 text-base font-semibold group-hover:text-primary">{l.title}</h3><p className="mt-2 text-sm text-slatey-400">{l.problem}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs">{BEATS[l.id]?.map((beat,i)=><span key={beat} className="inline-flex items-center gap-2">{i>0&&<ArrowRight size={12} aria-hidden/>}<span className="rounded bg-canvas px-2 py-1">{beat}</span></span>)}</div></Link>)}</div>
  </div>
 </section>;
}
