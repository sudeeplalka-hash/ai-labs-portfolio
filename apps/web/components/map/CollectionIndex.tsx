"use client";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { LABS, ALL_USE_CASES, INDUSTRIES } from "@labs/kit";
import { useDiscovery } from "./useDiscovery";
const DOMAIN: Record<number, string> = { 1: "Enterprise AI lifecycle", 2: "Agent architecture", 3: "Investment & economics", 4: "People & adoption", 5: "Live builds" };
const KEYS = ["q", "collection", "industry"] as const;
export function CollectionIndex() {
  const { values, update, remember } = useDiscovery(KEYS);
  const { q = "", collection = "", industry = "" } = values;
  const labs = LABS.filter((lab) => lab.collection > 0 && lab.status === "shipped" && lab.id !== "C1-backlog");
  const results = labs.filter((lab) => (!collection || String(lab.collection) === collection)
    && (!industry || ALL_USE_CASES.some((uc) => uc.labId === lab.id && uc.industry === industry))
    && `${lab.title} ${lab.problem} ${lab.decision}`.toLowerCase().includes(q.toLowerCase().trim()));
  return <section id="collections" className="mt-12 scroll-mt-24 pb-10" aria-labelledby="catalog-title">
    <p className="eyebrow text-primary">Find the right instrument</p>
    <h2 id="catalog-title" className="mt-2 text-2xl font-semibold tracking-tight">The collection</h2>
    <p className="mt-2 max-w-2xl text-sm text-slatey-400">Search by the decision you need to make. Every artifact shows its execution mode and exposes its assumptions.</p>
    <div className="my-5 grid gap-3 rounded-xl border border-line bg-white p-4 md:grid-cols-[2fr_1fr_1fr]">
      <label className="text-xs font-semibold text-slatey-400">Search artifacts
        <span className="mt-1 flex items-center gap-2 rounded-lg border border-line px-3"><Search size={16} aria-hidden /><input type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Funding, protocol, readiness…" className="min-w-0 w-full bg-transparent py-3 text-sm text-ink outline-none" /></span>
      </label>
      <label className="text-xs font-semibold text-slatey-400">Decision domain<select value={collection} onChange={(e) => update({ collection: e.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink"><option value="">All domains</option>{Object.entries(DOMAIN).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="text-xs font-semibold text-slatey-400">Industry<select value={industry} onChange={(e) => update({ industry: e.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink"><option value="">All industries</option>{Object.entries(INDUSTRIES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
    </div>
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs"><span role="status">{results.length} matching artifacts</span>{KEYS.filter((key) => values[key]).map((key) => <button key={key} onClick={() => update({ [key]: "" })} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-white px-3" aria-label={`Remove ${key} filter: ${values[key]}`}>{key === "collection" ? DOMAIN[Number(values[key])] : values[key]}<X size={12} /></button>)}</div>
    {results.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-white p-6"><h3 className="font-semibold">No artifacts match these filters</h3><p className="mt-2 text-sm text-slatey-400">Keep your search and widen the domain or industry.</p><button onClick={() => update({ collection: "", industry: "" })} className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm text-white">Clear domain and industry</button>{q && <button className="ml-3 text-sm underline" onClick={() => update({ q: "" })}>Clear search</button>}</div> : <div className="grid gap-3 md:grid-cols-2">
      {results.map((lab) => <Link key={lab.id} id={`catalog-${lab.id}`} href={lab.href!} onClick={() => remember(`catalog-${lab.id}`)} className="catalog-card group flex min-w-0 flex-col rounded-xl border border-line bg-white p-5 transition hover:border-primary/50 hover:shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-medium text-slatey-400">{DOMAIN[lab.collection]}</span><span className={`rounded-full border px-2 py-1 font-mono text-[10px] font-semibold ${lab.live === "LIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : lab.live === "RECORDED" ? "border-indigo-200 bg-indigo-50 text-indigo-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{lab.live}</span></div>
        <h3 className="mt-3 text-base font-semibold leading-snug group-hover:text-primary">{lab.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slatey-400">{lab.decision}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">{lab.live === "RECORDED" ? "Inspect the recorded evidence" : "Open the instrument"}<ArrowRight size={15} aria-hidden /></span>
      </Link>)}
    </div>}
    <p className="mt-4 text-xs leading-relaxed text-slatey-400">LIVE means real browser computation; SIMULATED means an explicit decision model; RECORDED means captured execution. Scenario provenance appears inside each instrument.</p>
  </section>;
}
