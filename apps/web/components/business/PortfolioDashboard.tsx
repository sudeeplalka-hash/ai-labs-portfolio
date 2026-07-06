"use client";

// C3-1 · AI Initiative Portfolio Dashboard (Collection 3 · gallery · flagship).
// Twelve initiatives plotted value × risk (sized by spend), each with a
// risk adjusted ROI and an explicit kill / scale / hold call. Map / Financials /
// Stage-gate views. Thread: capital allocation under uncertainty, nothing scored
// by a black box. SIMULATED; every number is a stated formula over visible inputs.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Share2, RotateCcw, X, Plus, PencilLine } from "lucide-react";
import { Panel, Badge, KpiCard, InsightCard, LiveBadge, FreshnessStamp, LabToolbar, ToolbarButton, Drawer, toast, ToastHost, CommandPalette, ExportMenu, downloadCsv, downloadJson, parseScenarioJson, pickTextFile, parseCsv, svgElementToPng, sortBy, nextSort, pushRecent, loadRecent, saveRecent, ScatterPlot, type ExportAction, type Command, type SortState, type RecentEntry, type BadgeTone } from "@labs/design-system";
import { C31_USE_CASES, LABS } from "@labs/kit";
import { greedyFund, reallocateKills, initiativesFromCsvRows, efficientFrontier } from "@labs/engines";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { CaseStudy } from "../reviewer/CaseStudy";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown } from "../artifact/artifact";

type Stage = "discovery" | "pilot" | "scaling" | "production";
type Rec = "kill" | "hold" | "scale";
interface Initiative {
  id: string; name: string; domain: string; stage: Stage;
  expValueM: number; spendM: number; risk: number; planVar: number;
}

// The model's assumptions, now editable in the UI (the Assumptions drawer). Defaults
// are industry-informed; editing them makes it "your model" (still SIMULATED, the
// figures just reflect your assumptions instead of the defaults).
interface Assumptions { prob: Record<Stage, number>; scaleMultiple: number; scaleRiskCutoff: number }
const DEFAULT_ASSUMPTIONS: Assumptions = {
  prob: { discovery: 0.15, pilot: 0.30, scaling: 0.60, production: 0.85 },
  scaleMultiple: 1.5,
  scaleRiskCutoff: 0.6,
};

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

const probOf = (i: Initiative, A: Assumptions) => A.prob[i.stage];
const riskAdjOf = (i: Initiative, A: Assumptions) => i.expValueM * probOf(i, A) - i.spendM; // $M/yr
function recommendOf(i: Initiative, A: Assumptions): Rec {
  const r = riskAdjOf(i, A);
  if (r < 0) return "kill";
  if ((i.stage === "scaling" || i.stage === "production") && r >= A.scaleMultiple * i.spendM && i.risk < A.scaleRiskCutoff) return "scale";
  return "hold";
}

const REC_LABEL: Record<Rec, string> = { kill: "Kill", hold: "Hold", scale: "Scale" };
const REC_TONE: Record<Rec, BadgeTone> = { kill: "rose", hold: "amber", scale: "emerald" };
const REC_DOT: Record<Rec, string> = { kill: "bg-rose-500", hold: "bg-amber-500", scale: "bg-emerald-500" };
const REC_HEX: Record<Rec, string> = { kill: "#ef4444", hold: "#f59e0b", scale: "#22c55e" };
const fmtM = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(1)}M`;
const STAGES_LIST: Stage[] = ["discovery", "pilot", "scaling", "production"];

type View = "map" | "financials" | "gate" | "fund" | "reallocate";
const RECENT_KEY = "portfolio-recent";

export function PortfolioDashboard() {
  const [view, setView] = useState<View>("map");
  const [scaleMode, setScaleMode] = useState<"linear" | "log">("linear");
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? C31_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(C31_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  // The book is now editable state (bring-your-own-portfolio), not a derived const.
  const [items, setItems] = useState<Initiative[]>(INITIATIVES);
  const [selId, setSelId] = useState<string>("kyc");
  const [editMode, setEditMode] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  useEffect(() => setRecent(loadRecent(RECENT_KEY)), []);
  const scatterRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const sel = items.find((i) => i.id === selId) ?? items[0];
  const baseBook = activeUc ? activeUc.payload.initiatives : INITIATIVES;
  const bookEdited = JSON.stringify(items) !== JSON.stringify(baseBook);
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const book = id ? (C31_USE_CASES.find((u) => u.id === id)?.payload.initiatives ?? INITIATIVES) : INITIATIVES;
    setItems(book);
    setSelId(book[0].id);
  };
  const updateItem = (id: string, patch: Partial<Initiative>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeItem = (id: string) => setItems((xs) => (xs.length > 1 ? xs.filter((x) => x.id !== id) : xs));
  const addItem = () => {
    const id = `custom-${Date.now().toString(36)}`;
    setItems((xs) => [...xs, { id, name: "New initiative", domain: "Custom", stage: "pilot", expValueM: 1.0, spendM: 0.5, risk: 0.5, planVar: 0 }]);
    setSelId(id);
  };

  // Editable assumptions drive every number below. `A` + closures keep the rest of
  // the component untouched (prob/riskAdj/recommend now read the live assumptions).
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const A = assumptions;
  const prob = (i: Initiative) => probOf(i, A);
  const riskAdj = (i: Initiative) => riskAdjOf(i, A);
  const recommend = (i: Initiative) => recommendOf(i, A);
  const edited = JSON.stringify(A) !== JSON.stringify(DEFAULT_ASSUMPTIONS);

  // Restore a shared scenario (?cfg=) once on mount, view, selection, assumptions.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("cfg");
    if (!raw) return;
    try {
      const cfg = JSON.parse(atob(raw)) as { v?: View; s?: string; a?: Partial<Assumptions>; b?: Initiative[] };
      if (cfg.b && Array.isArray(cfg.b) && cfg.b.length) setItems(cfg.b);
      if (cfg.v) setView(cfg.v);
      if (cfg.s) setSelId(cfg.s);
      if (cfg.a) {
        const a = cfg.a;
        setAssumptions({
          prob: { ...DEFAULT_ASSUMPTIONS.prob, ...(a.prob ?? {}) },
          scaleMultiple: a.scaleMultiple ?? DEFAULT_ASSUMPTIONS.scaleMultiple,
          scaleRiskCutoff: a.scaleRiskCutoff ?? DEFAULT_ASSUMPTIONS.scaleRiskCutoff,
        });
      }
    } catch { /* ignore malformed link */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareScenario = () => {
    const cfg = btoa(JSON.stringify({ v: view, s: selId, a: A, b: bookEdited ? items : undefined }));
    const nextRecent = pushRecent(loadRecent(RECENT_KEY), { cfg, label: `${items.length} initiatives · ${view}`, at: Date.now() });
    saveRecent(RECENT_KEY, nextRecent);
    setRecent(nextRecent);
    const params = new URLSearchParams(window.location.search);
    params.set("cfg", cfg);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("Link copied, this exact scenario"), () => toast("Link is in the address bar"));
    } else {
      toast("Link is in the address bar");
    }
  };
  const resetAssumptions = () => { setAssumptions(DEFAULT_ASSUMPTIONS); toast("Assumptions reset to defaults"); };
  const resetAll = () => { setItems(baseBook); setSelId(baseBook[0].id); setAssumptions(DEFAULT_ASSUMPTIONS); setEditMode(false); toast("Reset to the default book & assumptions"); };

  const maxVal = Math.max(...items.map((i) => i.expValueM));
  const totalValue = items.reduce((a, i) => a + i.expValueM, 0);
  const totalSpend = items.reduce((a, i) => a + i.spendM, 0);
  const totalRiskAdj = items.reduce((a, i) => a + riskAdj(i), 0);
  const killCount = items.filter((i) => recommend(i) === "kill").length;

  // Budget-constrained funding, greedy by risk adjusted return per $ (engine).
  const [budgetM, setBudgetM] = useState(5);
  const [sort, setSort] = useState<SortState | null>(null);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [recFilter, setRecFilter] = useState<Rec | null>(null);
  const fund = greedyFund(items, budgetM, riskAdj);
  const frontier = efficientFrontier(items, riskAdj, (i) => i.spendM);
  const frontierFunded = frontier.points.filter((pt) => pt.cumSpend <= budgetM);
  const marginalEff = frontierFunded.length ? frontierFunded[frontierFunded.length - 1].efficiency : (frontier.points[0]?.efficiency ?? 0);
  const topEff = frontier.points[0]?.efficiency ?? 0;
  const funded = new Set(fund.funded);
  const fundSpent = fund.spent;
  const fundCaptured = fund.captured;
  const realloc = reallocateKills(items, riskAdj, (i) => recommend(i) === "scale");
  const sortAccessor: Record<string, (i: Initiative) => number | string> = {
    name: (i) => i.name, stage: (i) => STAGES_LIST.indexOf(i.stage), value: (i) => i.expValueM,
    spend: (i) => i.spendM, riskadj: (i) => riskAdj(i), planvar: (i) => i.planVar,
  };
  const domains = [...new Set(items.map((i) => i.domain))];
  const financialRows = (() => {
    if (editMode) return items;
    let rows = items;
    if (domainFilter) rows = rows.filter((i) => i.domain === domainFilter);
    if (recFilter) rows = rows.filter((i) => recommend(i) === recFilter);
    if (sort && sortAccessor[sort.key]) rows = sortBy(rows, sortAccessor[sort.key], sort.dir);
    return rows;
  })();
  const sortTh = (label: string, k: string) => (
    <th>
      <button onClick={() => setSort((sc) => nextSort(sc, k))} className="inline-flex items-center gap-1 hover:text-ink">
        {label}{sort?.key === k && <span className="text-[8px]">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  const buildReviewPack = (): string => {
    const kills = items.filter((i) => recommend(i) === "kill");
    const rows = items
      .slice()
      .sort((a, b) => riskAdj(b) - riskAdj(a))
      .map((i) => `| ${i.name} | ${i.domain} | ${i.stage} | ${fmtM(i.expValueM)} | ${fmtM(i.spendM)} | ${Math.round(prob(i) * 100)}% | ${fmtM(riskAdj(i))} | ${REC_LABEL[recommend(i)]} |`);
    return [
      "# AI Initiative Portfolio, review pack",
      "",
      `**Book:** ${activeUc ? activeUc.title : "Default (finserv + telecom)"}`,
      `**Totals:** Expected value ${fmtM(totalValue)} · Run-rate spend ${fmtM(totalSpend)} · Risk adjusted ${fmtM(totalRiskAdj)} · Kill list ${killCount}/${items.length}`,
      "",
      "## Initiatives (sorted by risk adjusted value)",
      "",
      "| Initiative | Domain | Stage | Exp. value | Spend | P(success) | Risk-adj | Call |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...rows,
      "",
      "## Kill list",
      "",
      kills.length
        ? kills.map((i) => `- **${i.name}**, risk adjusted ${fmtM(riskAdj(i))} (negative return)`).join("\n")
        : "_None, every initiative clears its risk adjusted hurdle._",
      "",
      "## Method",
      "",
      `Risk adjusted value = expected value × P(success by stage) − spend. **Kill** if risk adjusted < 0; **Scale** if scaling/production AND risk adjusted ≥ ${A.scaleMultiple}× spend AND risk < ${A.scaleRiskCutoff}; else **Hold**. P(success): discovery ${Math.round(A.prob.discovery * 100)}% · pilot ${Math.round(A.prob.pilot * 100)}% · scaling ${Math.round(A.prob.scaling * 100)}% · production ${Math.round(A.prob.production * 100)}%${edited ? ", your model" : ""}.`,
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`portfolio-review-pack-${activeUc ? activeUc.id : "default"}`, buildReviewPack(), {
      scenario: activeUc ? activeUc.title : "Default book",
    });

  // ---- Export suite + command palette, all export the *visible* model (honest). ----
  const slug = activeUc ? activeUc.id : "default";
  const exportCsv = () => {
    const headers = ["Initiative", "Domain", "Stage", "Expected value ($M)", "Spend ($M)", "P(success)", "Risk adjusted ($M)", "Call"];
    const rows = items.slice().sort((a, b) => riskAdj(b) - riskAdj(a)).map((i) => [
      i.name, i.domain, i.stage, i.expValueM, i.spendM, Math.round(prob(i) * 100) / 100, Number(riskAdj(i).toFixed(3)), REC_LABEL[recommend(i)],
    ]);
    downloadCsv(`portfolio-${slug}`, headers, rows);
    toast("Initiatives exported as CSV");
  };
  const exportPng = () => {
    if (!scatterRef.current) { setView("map"); toast("Switch to the Map view, then export the chart"); return; }
    svgElementToPng(scatterRef.current, `portfolio-map-${slug}`).then((ok) => toast(ok ? "Chart exported as PNG" : "Couldn't render the chart"));
  };
  const exportScenario = () => {
    downloadJson(`portfolio-scenario-${slug}`, { version: 1, view, selId, assumptions: A, items });
    toast("Scenario exported as JSON");
  };
  const importScenario = async () => {
    const text = await pickTextFile();
    if (!text) return;
    try {
      const cfg = parseScenarioJson<{ view?: View; selId?: string; assumptions?: Partial<Assumptions>; items?: Initiative[] }>(text);
      if (cfg.items && Array.isArray(cfg.items) && cfg.items.length) { setItems(cfg.items); setSelId(cfg.items[0].id); }
      if (cfg.view) setView(cfg.view);
      if (cfg.selId) setSelId(cfg.selId);
      if (cfg.assumptions) {
        const a = cfg.assumptions;
        setAssumptions({
          prob: { ...DEFAULT_ASSUMPTIONS.prob, ...(a.prob ?? {}) },
          scaleMultiple: a.scaleMultiple ?? DEFAULT_ASSUMPTIONS.scaleMultiple,
          scaleRiskCutoff: a.scaleRiskCutoff ?? DEFAULT_ASSUMPTIONS.scaleRiskCutoff,
        });
      }
      toast("Scenario imported");
    } catch { toast("That file isn't a valid scenario"); }
  };
  const importCsv = async () => {
    const text = await pickTextFile("text/csv,.csv");
    if (!text) return;
    const { items: parsed, skipped } = initiativesFromCsvRows(parseCsv(text));
    if (parsed.length === 0) { toast(skipped ? `No valid rows \u2014 ${skipped} skipped` : "No rows found in that CSV"); return; }
    setItems(parsed);
    setSelId(parsed[0].id);
    toast(`Imported ${parsed.length} initiative${parsed.length === 1 ? "" : "s"}${skipped ? ` \u00b7 ${skipped} skipped` : ""}`);
  };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "Initiatives as CSV", hint: "The financials table", onSelect: exportCsv },
    { id: "png", label: "Value \u00d7 risk chart as PNG", hint: "The bubble map", onSelect: exportPng },
    { id: "json", label: "Export scenario (JSON)", hint: "Book + assumptions, re-importable", onSelect: exportScenario },
    { id: "import", label: "Import scenario (JSON)\u2026", hint: "Load a saved .json", onSelect: importScenario },
    { id: "import-csv", label: "Import book (CSV)\u2026", hint: "Columns: name, domain, stage, expValueM, spendM, risk, planVar", onSelect: importCsv },
    { id: "memo", label: "Review pack (Markdown)", hint: "The full decision memo", onSelect: onGenerate },
  ];
  const paletteCommands: Command[] = [
    { id: "act-assumptions", label: "Edit assumptions", group: "action", keywords: "your model weights", run: () => setDrawerOpen(true) },
    { id: "act-share", label: "Copy share link", group: "action", keywords: "permalink url scenario", run: shareScenario },
    { id: "act-reset", label: "Reset to defaults", group: "action", run: resetAll },
    { id: "view-map", label: "View: Value \u00d7 risk map", group: "view", run: () => setView("map") },
    { id: "view-fin", label: "View: Financials", group: "view", run: () => setView("financials") },
    { id: "view-gate", label: "View: Stage-gate", group: "view", run: () => setView("gate") },
    { id: "view-fund", label: "View: Funding", group: "view", run: () => setView("fund") },
    { id: "view-realloc", label: "View: Reallocate the kills", group: "view", run: () => setView("reallocate") },
    { id: "exp-csv", label: "Export initiatives as CSV", group: "export", run: exportCsv },
    { id: "exp-png", label: "Export chart as PNG", group: "export", run: exportPng },
    { id: "exp-json", label: "Export scenario as JSON", group: "export", run: exportScenario },
    { id: "exp-import", label: "Import scenario\u2026", group: "export", run: importScenario },
    { id: "exp-memo", label: "Download review pack", group: "export", run: onGenerate },
    ...recent.map((r, i) => ({
      id: `recent-${i}`, label: `Recent: ${r.label}`, group: "recent", keywords: "history scenario",
      run: () => { window.location.search = `?cfg=${encodeURIComponent(r.cfg)}`; },
    })),
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

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
            A book of twelve AI initiatives, governed like capital. Each carries a risk adjusted ROI and an explicit
            call, because a portfolio where nothing is ever killed isn&apos;t governed, it&apos;s unattended.
          </p>
        </div>

        <UseCaseRail useCases={C31_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Most AI portfolios are a list everyone is proud of and no one governs. Without a kill discipline, capital spreads thin across initiatives that will never pay." approach="Twelve initiatives governed like capital: each carries an expected value, a stage-based probability of success, and a run cost, yielding a risk adjusted ROI and an explicit kill / hold / scale call across value×risk, financials, stage-gate, funding, and reallocation views." why="Treating initiatives as a capital book, not a wish list, forces the uncomfortable calls: fund the efficient core, kill the negatives, redeploy the freed capital." metric="Risk adjusted ROI per initiative (expected value × stage probability − run cost) and the efficient frontier of cumulative value vs cumulative spend." tradeoff="Funding the single highest-value initiative can starve three efficient ones; the greedy funder and the frontier knee show where diminishing returns begin." outcome="A defensible funding decision within a budget, what to fund, what to kill, and where the freed capital goes, with the value captured quantified." />

        <LabToolbar>
          <ToolbarButton onClick={() => setDrawerOpen(true)} active={edited} title="Edit the model's assumptions">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Assumptions
            {edited && <span className="ml-1 rounded bg-white/25 px-1 py-px text-[10px] font-bold uppercase tracking-wide">your model</span>}
          </ToolbarButton>
          <ToolbarButton onClick={() => { setView("financials"); setEditMode((e) => !e); }} active={editMode || bookEdited} title="Add, remove, or edit initiatives">
            <PencilLine className="h-3.5 w-3.5" /> Edit book
            {bookEdited && <span className="ml-1 rounded bg-white/25 px-1 py-px text-[10px] font-bold uppercase tracking-wide">custom</span>}
          </ToolbarButton>
          <ToolbarButton onClick={shareScenario} title="Copy a link that reproduces this exact scenario">
            <Share2 className="h-3.5 w-3.5" /> Share
          </ToolbarButton>
          <ToolbarButton onClick={resetAll} title="Reset the book and assumptions to defaults">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </ToolbarButton>
          <ToolbarButton onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))} className="ml-auto" title="Command palette (⌘K)">
            ⌘K
          </ToolbarButton>
          <ExportMenu actions={exportActions} />
        </LabToolbar>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Expected annual value" value={fmtM(totalValue)} tone="neutral" interpretation="Sum of unadjusted upside" />
          <KpiCard label="Run-rate spend" value={fmtM(totalSpend)} tone="watch" interpretation="Annualized" />
          <KpiCard label="Risk adjusted value" value={fmtM(totalRiskAdj)} tone={totalRiskAdj > 0 ? "healthy" : "critical"} interpretation="Value × P(success) − spend" />
          <KpiCard label="Recommend to kill" value={`${killCount}/${items.length}`} tone={killCount >= 1 ? "critical" : "healthy"} interpretation="Negative risk adjusted ROI" />
        </div>

        {/* View toggle */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(["map", "financials", "gate", "fund", "reallocate"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${v === view ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
              {v === "gate" ? "Stage-gate" : v === "fund" ? "Funding" : v === "reallocate" ? "Reallocate" : v}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {view === "map" && (
              <Panel>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="stat-label">Value × risk · bubble = run-rate spend</p>
                  <div className="inline-flex overflow-hidden rounded-md border border-line text-[10px]">
                    {(["linear", "log"] as const).map((m) => (
                      <button key={m} onClick={() => setScaleMode(m)}
                        className={`px-2 py-0.5 font-medium transition ${scaleMode === m ? "bg-teal-600 text-white" : "bg-white text-slatey-400 hover:text-ink"}`}>{m === "linear" ? "Linear" : "Log"} Y</button>
                    ))}
                  </div>
                </div>
                {(() => {
                  const yPos = items.map((it) => it.expValueM).filter((v) => v > 0);
                  const yFloor = yPos.length ? Math.min(...yPos) : 1;
                  const hov = items.find((i) => i.id === hoverId) ?? null;
                  const rf = (spend: number) => 6 + spend * 11;
                  return (
                    <ScatterPlot
                      svgRef={scatterRef}
                      data={items.map((i) => ({ x: i.risk, y: i.expValueM, r: rf(i.spendM), color: REC_HEX[recommend(i)], id: i.id }))}
                      xDomain={[0, 1]}
                      yDomain={scaleMode === "log" ? [yFloor, maxVal] : [0, maxVal]}
                      yScale={scaleMode}
                      fmtY={fmtM}
                      selectedId={selId}
                      hoverId={hoverId}
                      onSelect={setSelId}
                      onHover={setHoverId}
                      xLabelLeft="low risk"
                      xLabelRight="high risk \u2192"
                      ariaLabel="Initiatives plotted by expected value (vertical) against risk (horizontal); bubble size is run-rate spend; color is the kill / hold / scale call."
                      overlay={(layout) => (
                        <>
                          <line x1={layout.toX(0.5)} y1={layout.plot.top} x2={layout.toX(0.5)} y2={layout.plot.bottom} stroke="#e4e7eb" strokeDasharray="3 3" />
                          <line x1={layout.plot.left} y1={layout.toY(maxVal / 2)} x2={layout.plot.right} y2={layout.toY(maxVal / 2)} stroke="#e4e7eb" strokeDasharray="3 3" />
                          <text x={layout.plot.left - 30} y={(layout.plot.top + layout.plot.bottom) / 2} textAnchor="middle" fontSize="9" fill="#94a3b8" transform={`rotate(-90 ${layout.plot.left - 30} ${(layout.plot.top + layout.plot.bottom) / 2})`}>expected value</text>
                          <text x={layout.toX(0.25)} y={layout.plot.top - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="#16a34a">safe bets</text>
                          <text x={layout.toX(0.78)} y={layout.plot.top - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="#d97706">big bets</text>
                          <text x={layout.toX(0.78)} y={layout.plot.bottom - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="#e11d48">question marks</text>
                          {hov && (() => {
                            const bx = Math.min(layout.toX(hov.risk) + 10, 520 - 150), by = Math.max(layout.toY(hov.expValueM) - 34, 2);
                            return (
                              <g pointerEvents="none">
                                <rect x={bx} y={by} width={144} height={32} rx={4} fill="#152433" />
                                <text x={bx + 7} y={by + 13} fontSize="9" fontWeight="600" fill="#fff">{hov.name}</text>
                                <text x={bx + 7} y={by + 25} fontSize="8.5" fill="#cbd5e1">{fmtM(riskAdj(hov))} risk-adj \u00b7 {REC_LABEL[recommend(hov)]}</text>
                              </g>
                            );
                          })()}
                        </>
                      )}
                    />
                  );
                })()}
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slatey-500">
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Scale</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Hold</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Kill</span>
                  <span className="ml-auto">bubble size = spend · hover for detail</span>
                </div>
              </Panel>
            )}

            {view === "financials" && (
              <Panel className="overflow-x-auto">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="stat-label">Financials{editMode && <span className="font-normal text-primary"> · editing your book</span>}</p>
                  <button onClick={() => setEditMode((e) => !e)} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-slatey-400 transition-colors hover:border-primary/40 hover:text-ink">
                    <PencilLine className="h-3 w-3" /> {editMode ? "Done" : "Edit book"}
                  </button>
                </div>
                {!editMode && (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slatey-500">Filter</span>
                    {domains.map((d) => (
                      <button key={d} onClick={() => setDomainFilter((f) => (f === d ? null : d))}
                        className={`rounded-full border px-2 py-0.5 font-medium transition ${domainFilter === d ? "border-primary bg-primary text-white" : "border-line text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>{d}</button>
                    ))}
                    <span className="mx-1 text-slate-300">|</span>
                    {(["scale", "hold", "kill"] as Rec[]).map((r) => (
                      <button key={r} onClick={() => setRecFilter((f) => (f === r ? null : r))}
                        className={`rounded-full border px-2 py-0.5 font-medium capitalize transition ${recFilter === r ? "border-primary bg-primary text-white" : "border-line text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>{REC_LABEL[r]}</button>
                    ))}
                    {(domainFilter || recFilter) && (
                      <button onClick={() => { setDomainFilter(null); setRecFilter(null); }} className="ml-1 text-slatey-500 underline hover:text-ink">clear</button>
                    )}
                    <span className="ml-auto text-slatey-500">{financialRows.length}/{items.length}</span>
                  </div>
                )}
                <table className="data-table">
                  <thead>
                    <tr>
                      {editMode ? (
                        <><th>Initiative</th><th>Stage</th><th>Value</th><th>Spend</th><th>Risk</th><th>Risk-adj</th><th aria-label="remove" /></>
                      ) : (
                        <>{sortTh("Initiative", "name")}{sortTh("Stage", "stage")}{sortTh("Value", "value")}{sortTh("Spend", "spend")}{sortTh("Risk-adj", "riskadj")}{sortTh("Plan var", "planvar")}</>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {financialRows.map((i) => (
                      <tr key={i.id} className={editMode ? "" : "cursor-pointer"} onClick={editMode ? undefined : () => setSelId(i.id)}>
                        {editMode ? (
                          <>
                            <td><input value={i.name} onChange={(e) => updateItem(i.id, { name: e.target.value })} className="w-36 rounded border border-line px-1.5 py-0.5 text-xs" /></td>
                            <td>
                              <select value={i.stage} onChange={(e) => updateItem(i.id, { stage: e.target.value as Stage })} className="rounded border border-line px-1 py-0.5 text-xs capitalize">
                                {STAGES_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td><NumCell value={i.expValueM} onChange={(v) => updateItem(i.id, { expValueM: v })} /></td>
                            <td><NumCell value={i.spendM} onChange={(v) => updateItem(i.id, { spendM: v })} /></td>
                            <td><NumCell value={i.risk} step={0.05} onChange={(v) => updateItem(i.id, { risk: Math.max(0, Math.min(1, v)) })} /></td>
                            <td className={riskAdj(i) < 0 ? "text-rose-600" : "text-emerald-700"}>{fmtM(riskAdj(i))}</td>
                            <td><button onClick={() => removeItem(i.id)} aria-label={`Remove ${i.name}`} className="text-slatey-400 transition-colors hover:text-rose-600"><X className="h-3.5 w-3.5" /></button></td>
                          </>
                        ) : (
                          <>
                            <td className="font-medium text-ink">{i.name}</td>
                            <td className="capitalize">{i.stage}</td>
                            <td>{fmtM(i.expValueM)}</td>
                            <td>{fmtM(i.spendM)}</td>
                            <td className={riskAdj(i) < 0 ? "text-rose-600" : "text-emerald-700"}>{fmtM(riskAdj(i))}</td>
                            <td>{Math.abs(i.planVar) > 10 ? <Badge tone={i.planVar > 0 ? "orange" : "blue"}>{i.planVar > 0 ? "+" : ""}{i.planVar}%</Badge> : <span className="text-slatey-500">{i.planVar > 0 ? "+" : ""}{i.planVar}%</span>}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {!editMode && financialRows.length === 0 && (
                      <tr><td colSpan={6} className="py-3 text-center text-xs text-slatey-500">No initiatives match the filter.</td></tr>
                    )}
                  </tbody>
                </table>
                {editMode ? (
                  <button onClick={addItem} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-slatey-400 transition-colors hover:border-primary/40 hover:text-ink">
                    <Plus className="h-3.5 w-3.5" /> Add initiative
                  </button>
                ) : (
                  <p className="mt-2 text-[11px] text-slatey-500">Plan variance flagged beyond ±10%. Hit <span className="font-semibold">Edit book</span> to bring your own initiatives, every number recomputes.</p>
                )}
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

            {view === "fund" && (
              <Panel>
                <p className="stat-label mb-2">Budget-constrained funding <span className="font-normal text-slatey-500">· greedy by risk adjusted return per $</span></p>
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between"><label className="text-xs text-slatey-400">Capital available</label><span className="font-mono text-sm font-semibold text-ink">{fmtM(budgetM)}</span></div>
                  <input type="range" min={0} max={Math.ceil(totalSpend)} step={0.1} value={Math.min(budgetM, Math.ceil(totalSpend))} onChange={(e) => setBudgetM(Number(e.target.value))} className="w-full accent-primary" />
                  <div className="mt-1 flex justify-between text-[10px] text-slatey-500"><span>$0</span><span>full book {fmtM(totalSpend)}</span></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Fund ({funded.size}) · {fmtM(fundSpent)}</p>
                    <div className="space-y-1">
                      {items.filter((i) => funded.has(i.id)).sort((a, b) => riskAdj(b) - riskAdj(a)).map((i) => (
                        <button key={i.id} onClick={() => setSelId(i.id)} className="block w-full rounded-md border border-emerald-200 bg-emerald-50/50 px-2 py-1 text-left text-xs">
                          <span className="font-medium text-ink">{i.name}</span>
                          <span className="block text-[10px] text-slatey-500">{fmtM(i.spendM)} spend · {fmtM(riskAdj(i))} risk-adj</span>
                        </button>
                      ))}
                      {funded.size === 0 && <p className="text-[11px] text-slatey-500">No budget allocated yet, raise the slider.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cut ({items.length - funded.size})</p>
                    <div className="space-y-1">
                      {items.filter((i) => !funded.has(i.id)).sort((a, b) => riskAdj(b) - riskAdj(a)).map((i) => (
                        <button key={i.id} onClick={() => setSelId(i.id)} className="block w-full rounded-md border border-line px-2 py-1 text-left text-xs opacity-80">
                          <span className="font-medium text-ink">{i.name}</span>
                          <span className="block text-[10px] text-slatey-500">{riskAdj(i) < 0 ? "negative ROI, never fund" : `didn't fit · ${fmtM(riskAdj(i))} risk-adj`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-3 rounded-md bg-primary/[0.05] px-3 py-2 text-xs text-ink">
                  <span className="font-semibold">With {fmtM(budgetM)} you fund {funded.size} of {items.length}</span>, capturing {fmtM(fundCaptured)}/yr of risk adjusted value. Greedy by return-per-dollar, a defensible first cut, not a solved optimum.
                </p>
                <div className="mt-4 border-t border-line pt-3">
                  <p className="stat-label mb-2">Efficient frontier <span className="font-normal text-slatey-500">· cumulative value vs cumulative spend</span></p>
                  {(() => {
                    const W = 520, H = 200, padL = 44, padR = 12, padT = 12, padB = 28;
                    const plotW = W - padL - padR, plotH = H - padT - padB;
                    const maxS = frontier.totalSpend || 1, maxV = frontier.totalValue || 1;
                    const X = (sp: number) => padL + (sp / maxS) * plotW;
                    const Y = (v: number) => padT + (1 - v / maxV) * plotH;
                    const path = [`M ${X(0)} ${Y(0)}`, ...frontier.points.map((pt) => `L ${X(pt.cumSpend)} ${Y(pt.cumValue)}`)].join(" ");
                    const bx = X(Math.min(budgetM, maxS));
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Efficient frontier: cumulative risk adjusted value against cumulative spend, most-efficient initiatives first.">
                        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#cbd2d9" />
                        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#cbd2d9" />
                        <line x1={X(0)} y1={Y(0)} x2={X(maxS)} y2={Y(maxV)} stroke="#e4e7eb" strokeDasharray="3 3" />
                        <path d={path} fill="none" stroke="#0d9488" strokeWidth="2" />
                        {frontier.points.map((pt) => <circle key={pt.index} cx={X(pt.cumSpend)} cy={Y(pt.cumValue)} r="2.5" fill="#0d9488" />)}
                        {frontier.kneeCount > 0 && frontier.kneeCount < frontier.points.length && (
                          <g>
                            <line x1={X(frontier.kneeSpend)} y1={padT} x2={X(frontier.kneeSpend)} y2={H - padB} stroke="#d97706" strokeDasharray="3 3" />
                            <text x={X(frontier.kneeSpend) + 3} y={padT + 8} fontSize="8" fill="#d97706">knee · {frontier.kneeCount} in the core</text>
                          </g>
                        )}
                        <line x1={bx} y1={padT} x2={bx} y2={H - padB} stroke="#152433" strokeWidth="1" opacity="0.25" />
                        <text x={bx} y={H - 4} fontSize="8" textAnchor="middle" fill="#64748b">budget {fmtM(budgetM)}</text>
                        <text x={padL - 6} y={Y(maxV) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{fmtM(maxV)}</text>
                        <text x={padL - 6} y={Y(0)} textAnchor="end" fontSize="8" fill="#94a3b8">$0</text>
                        <text x={W - padR} y={H - padB + 16} textAnchor="end" fontSize="8" fill="#94a3b8">spend {fmtM(maxS)} &rarr;</text>
                      </svg>
                    );
                  })()}
                  <p className="mt-1 text-[10px] text-slatey-500">Steepest first: the concave curve shows diminishing returns. The knee (amber) is where per-initiative efficiency drops below the book average &mdash; the {frontier.kneeCount} before it are the efficient core.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button onClick={() => setBudgetM(Number(frontier.kneeSpend.toFixed(1)))} className="rounded-md border border-teal-500/40 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 hover:bg-teal-100">Fund the efficient core ({frontier.kneeCount})</button>
                    <button onClick={() => setBudgetM(Number(frontier.totalSpend.toFixed(1)))} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-slatey-400 hover:text-ink">Fund all</button>
                    <span className="text-[10px] text-slatey-500">Marginal return-per-$ at budget &asymp; <span className="font-mono text-ink">{marginalEff.toFixed(2)}</span> vs <span className="font-mono">{topEff.toFixed(2)}</span> at the top.</span>
                  </div>
                </div>
              </Panel>
            )}
            {view === "reallocate" && (
              <Panel>
                <p className="stat-label mb-2">Redeploy the kills <span className="font-normal text-slatey-500">· cut the losers, fund the winners</span></p>
                {realloc.killed.length === 0 ? (
                  <p className="text-sm text-slatey-400">No initiative carries a negative risk adjusted ROI, nothing to cut. The book is already clean.</p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700">Cut ({realloc.killed.length}) · frees {fmtM(realloc.freedCapitalM)}</p>
                        <div className="space-y-1">
                          {realloc.killed.map((id) => { const i = items.find((x) => x.id === id); return i ? (
                            <button key={id} onClick={() => setSelId(id)} className="block w-full rounded-md border border-rose-200 bg-rose-50/50 px-2 py-1 text-left text-xs">
                              <span className="font-medium text-ink">{i.name}</span>
                              <span className="block text-[10px] text-slatey-500">{fmtM(i.spendM)} freed · {fmtM(riskAdj(i))} risk-adj drag</span>
                            </button>
                          ) : null; })}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Redeploy into Scale ({realloc.targets.length})</p>
                        <div className="space-y-1">
                          {realloc.targets.map((t) => { const i = items.find((x) => x.id === t.id); return i ? (
                            <button key={t.id} onClick={() => setSelId(t.id)} className="block w-full rounded-md border border-emerald-200 bg-emerald-50/50 px-2 py-1 text-left text-xs">
                              <span className="font-medium text-ink">{i.name}</span>
                              <span className="block text-[10px] text-slatey-500">+{fmtM(t.allocatedM)} capital → +{fmtM(t.addedValueM)}/yr (illustrative)</span>
                            </button>
                          ) : null; })}
                          {realloc.targets.length === 0 && <p className="text-[11px] text-slatey-500">No Scale-rated initiative to redeploy into, hold the freed capital.</p>}
                          {realloc.reserveM > 0.05 && <p className="text-[11px] text-slatey-500">{fmtM(realloc.reserveM)} held in reserve (past the 1× double-down cap).</p>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs">
                      <div className="text-center"><p className="text-[10px] uppercase tracking-wide text-slatey-500">Now</p><p className="font-mono font-semibold text-ink">{fmtM(realloc.baseRiskAdjM)}</p></div>
                      <span className="text-slatey-500">→</span>
                      <div className="text-center"><p className="text-[10px] uppercase tracking-wide text-slatey-500">After cut <span className="text-emerald-700">(real)</span></p><p className="font-mono font-semibold text-ink">{fmtM(realloc.afterCutRiskAdjM)}</p></div>
                      <span className="text-slatey-500">→</span>
                      <div className="text-center"><p className="text-[10px] uppercase tracking-wide text-slatey-500">After redeploy <span className="text-slatey-400">(illustrative)</span></p><p className="font-mono font-semibold text-ink">{fmtM(realloc.afterRedeployRiskAdjM)}</p></div>
                    </div>
                    <p className="mt-3 rounded-md bg-primary/[0.05] px-3 py-2 text-xs text-ink">
                      Cutting the kills lifts risk adjusted value by <span className="font-semibold">{fmtM(realloc.dragRemovedM)}/yr</span>, that part is just accounting. Redeploying the freed {fmtM(realloc.freedCapitalM)} into your Scale initiatives at their current return-per-dollar <span className="italic">could</span> add ~{fmtM(realloc.redeployedValueM)}/yr, illustrative (each dollar credited at the initiative&apos;s current efficiency, capped at a 1× double-down), not a guaranteed return.
                    </p>
                  </>
                )}
              </Panel>
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
                  Risk adjusted ROI = expected value ({fmtM(sel.expValueM)}) × stage probability ({Math.round(prob(sel) * 100)}% for {sel.stage}) − run-rate spend ({fmtM(sel.spendM)}) = <span className="font-semibold text-ink">{fmtM(riskAdj(sel))}</span>/yr.
                </p>
                <p className="mt-1.5 leading-relaxed">
                  Call: {riskAdj(sel) < 0 ? "negative risk adjusted ROI → kill." : recommend(sel) === "scale" ? `proven stage, risk adjusted ROI ≥ ${A.scaleMultiple}× spend, risk < ${A.scaleRiskCutoff} → scale.` : "positive but not yet scale-worthy → hold and de-risk."}
                </p>
              </details>
            </Panel>

            <InsightCard title={killCount > 0 ? `${killCount} to cut this quarter` : "No kills, a lean book"} tone={killCount > 0 ? "danger" : "info"}>
              {killCount} of {items.length} carry a negative risk adjusted ROI. Keeping them funds optionality theatre, the capital
              they hold is the capital the Scale column needs.
            </InsightCard>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Fund the efficient core, kill the negative-ROI initiatives, and redeploy freed capital into scale targets." lift="Risk adjusted value captured within budget, plus the value recovered by cutting losers and doubling down on winners at current efficiency." measure="Realized vs modeled risk adjusted ROI per initiative; kill-decision cycle time; portfolio value-per-dollar trend quarter over quarter." />
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "A portfolio where nothing gets killed isn't governed, it's unattended. Two of these twelve should die this quarter."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built &amp; assumptions</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Stage probabilities{edited ? " (your model)" : " (defaults)"}: discovery {Math.round(A.prob.discovery * 100)}% · pilot {Math.round(A.prob.pilot * 100)}% · scaling {Math.round(A.prob.scaling * 100)}% · production {Math.round(A.prob.production * 100)}%, editable in the Assumptions drawer.</p>
              <p>Risk adjusted ROI = expected annual value × stage probability − run-rate cost. Kill if &lt; 0; scale if proven-stage and ≥ {A.scaleMultiple}× spend with risk &lt; {A.scaleRiskCutoff}; else hold. Plan variance flagged beyond ±10%.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic client side math over authored, anonymized finserv + telecom initiatives.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> probabilities are stage-based defaults, not per-initiative Bayesian estimates; value figures are illustrative. The instrument frames the allocation decision, it doesn&apos;t replace the finance model behind it.</p>
        </div>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Model assumptions">
          <div className="space-y-5">
            <p className="text-xs leading-relaxed text-slatey-400">
              These drive every risk adjusted number and every kill / hold / scale call. Editing them makes this{" "}
              <span className="font-semibold text-ink">your model</span>, the figures stay SIMULATED, but they reflect your assumptions, not the defaults.
            </p>

            <div>
              <p className="stat-label mb-2">P(success) by stage</p>
              <div className="space-y-3">
                {(["discovery", "pilot", "scaling", "production"] as Stage[]).map((st) => (
                  <AssumptionRow key={st} label={st} value={Math.round(A.prob[st] * 100)} min={5} max={95} step={5} suffix="%"
                    onChange={(v) => setAssumptions((p) => ({ ...p, prob: { ...p.prob, [st]: v / 100 } }))} />
                ))}
              </div>
            </div>

            <div>
              <p className="stat-label mb-2">Scale rule</p>
              <div className="space-y-3">
                <AssumptionRow label="Scale if risk-adj ≥ N× spend" value={A.scaleMultiple} min={1} max={3} step={0.1} fixed={1}
                  onChange={(v) => setAssumptions((p) => ({ ...p, scaleMultiple: v }))} />
                <AssumptionRow label="…and risk below" value={A.scaleRiskCutoff} min={0.3} max={0.9} step={0.05} fixed={2}
                  onChange={(v) => setAssumptions((p) => ({ ...p, scaleRiskCutoff: v }))} />
              </div>
              <p className="mt-2 text-[11px] text-slatey-500">Kill is fixed at risk adjusted &lt; 0, that&apos;s definitional, not a knob.</p>
            </div>

            <button onClick={resetAssumptions} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-400 transition-colors hover:border-primary/40 hover:text-ink">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
          </div>
        </Drawer>
        <ToastHost />
        <CommandPalette commands={paletteCommands} />
      </main>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md border border-line bg-white px-2.5 py-1.5"><p className="text-[11px] text-slatey-500">{k}</p><p className="font-mono text-sm font-semibold text-ink">{v}</p></div>;
}

function AssumptionRow({
  label, value, min, max, step, suffix, fixed, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string; fixed?: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-medium capitalize text-slatey-400">{label}</label>
        <span className="font-mono text-xs font-semibold text-ink">{fixed !== undefined ? value.toFixed(fixed) : value}{suffix ?? ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

function NumCell({ value, step = 0.1, onChange }: { value: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input type="number" step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-16 rounded border border-line px-1.5 py-0.5 text-right text-xs" />
  );
}
