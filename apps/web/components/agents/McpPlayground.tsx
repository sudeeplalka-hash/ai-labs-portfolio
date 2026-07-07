"use client";

// GAP-01 · MCP Server Contract Workbench (Collection 2 · toolkit · flagship).
// Pick a mock enterprise system → its MCP manifest generates (tools / resources /
// prompts) → compose a tool call → read the full JSON-RPC round trip, both
// directions, annotated in plain English, including how malformed arguments get
// rejected at the contract boundary. MCP is just a disciplined contract; this
// reads the wire. SIMULATED (frames are constructed deterministically).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Wrench, FileText, MessageSquare, Share2, RotateCcw, Eye, X } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, LabToolbar, ToolbarButton, toast, ToastHost, CommandPalette, ExportMenu, downloadCsv, downloadJson, copyToClipboard, type ExportAction, type Command } from "@labs/design-system";
import { GAP01_USE_CASES, LABS } from "@labs/kit";
import { diffManifests, validateToolDef, manifestWithTool, lifecycleFrames, traceToJson } from "@labs/engines";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { CaseStudy } from "../reviewer/CaseStudy";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

type ArgType = "string" | "number" | "enum";
interface Arg { name: string; type: ArgType; required: boolean; example: string; enumVals?: string[] }
interface Tool { name: string; description: string; args: Arg[]; result: (a: Record<string, string>) => object }
interface Resource { uri: string; name: string }
interface Prompt { name: string; args: string[] }
interface System { key: string; label: string; blurb: string; tools: Tool[]; resources: Resource[]; prompts: Prompt[] }
type Frame = { dir: "req" | "res"; body: object; note: string; error?: boolean };
interface Call { id: number; tool: string; sysLabel: string; frames: Frame[]; error: boolean; ms: number; bytes: number }

const SYSTEMS: System[] = [
  {
    key: "disputes", label: "Disputes API", blurb: "Card disputes system of record (finserv).",
    tools: [
      { name: "get_dispute", description: "Fetch the status and history of a dispute.", args: [{ name: "dispute_id", type: "string", required: true, example: "DSP-48213" }],
        result: (a) => ({ dispute_id: a.dispute_id, status: "under_review", amount_usd: 214.5, opened: "2026-06-28", stage: "issuer_review" }) },
      { name: "open_dispute", description: "Open a new dispute against a transaction.", args: [
          { name: "account_id", type: "string", required: true, example: "ACCT-90021" },
          { name: "amount_usd", type: "number", required: true, example: "214.50" },
          { name: "reason", type: "enum", required: true, example: "not_recognized", enumVals: ["not_recognized", "duplicate", "product_not_received"] }],
        result: (a) => ({ dispute_id: "DSP-48999", status: "open", account_id: a.account_id, amount_usd: Number(a.amount_usd), reason: a.reason }) },
    ],
    resources: [{ uri: "disputes://policy/chargeback", name: "Chargeback policy v4" }, { uri: "disputes://account/{id}/history", name: "Account dispute history" }],
    prompts: [{ name: "draft_member_response", args: ["dispute_id", "tone"] }],
  },
  {
    key: "hr", label: "HR knowledge base", blurb: "Policy + employee self service (internal).",
    tools: [
      { name: "search_policy", description: "Semantic search over HR policy.", args: [{ name: "query", type: "string", required: true, example: "parental leave eligibility" }],
        result: (a) => ({ query: a.query, matches: [{ doc: "leave_policy_v7", section: "3.2", snippet: "Eligible after 12 months of continuous service…" }] }) },
      { name: "request_time_off", description: "File a time off request.", args: [
          { name: "employee_id", type: "string", required: true, example: "EMP-3391" },
          { name: "days", type: "number", required: true, example: "5" },
          { name: "start_date", type: "string", required: true, example: "2026-08-04" }],
        result: (a) => ({ request_id: "TOR-11872", employee_id: a.employee_id, days: Number(a.days), start_date: a.start_date, status: "pending_manager" }) },
    ],
    resources: [{ uri: "hr://handbook/leave", name: "Leave handbook" }, { uri: "hr://employee/{id}/balance", name: "PTO balance" }],
    prompts: [{ name: "summarize_policy", args: ["topic"] }],
  },
];

const TABS = [
  { key: "tools", label: "Tools", Icon: Wrench },
  { key: "resources", label: "Resources", Icon: FileText },
  { key: "prompts", label: "Prompts", Icon: MessageSquare },
] as const;

let idCounter = 41;

export function McpPlayground() {
  const [sysKey, setSysKey] = useState(SYSTEMS[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP01_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP01_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const sys: System = activeUc
    ? { key: activeUc.id, label: activeUc.payload.label, blurb: activeUc.payload.blurb, tools: activeUc.payload.tools, resources: activeUc.payload.resources, prompts: activeUc.payload.prompts }
    : SYSTEMS.find((s) => s.key === sysKey)!;
  const [tab, setTab] = useState<"tools" | "resources" | "prompts">("tools");
  const [customTools, setCustomTools] = useState<Tool[]>([]);
  const allTools = customTools.length ? [...sys.tools, ...customTools] : sys.tools;
  const lifecycle = lifecycleFrames({ name: sys.label, tools: allTools.map((t) => t.name), resources: sys.resources.map((r) => r.name), prompts: sys.prompts.map((pp) => pp.name) });
  const [ntName, setNtName] = useState("");
  const [ntDesc, setNtDesc] = useState("");
  const [ntArgs, setNtArgs] = useState<{ name: string; type: ArgType; required: boolean }[]>([{ name: "", type: "string", required: true }]);
  const [ntErrors, setNtErrors] = useState<string[]>([]);
  const [toolName, setToolName] = useState(sys.tools[0].name);
  const tool = allTools.find((t) => t.name === toolName) ?? allTools[0];
  const [argVals, setArgVals] = useState<Record<string, string>>(() => Object.fromEntries(sys.tools[0].args.map((a) => [a.name, a.example])));
  const [annotate, setAnnotate] = useState(true);
  const [malformed, setMalformed] = useState(false);
  const [history, setHistory] = useState<Call[]>([]);
  const [viewCallId, setViewCallId] = useState<number | null>(null);

  // systems × consumers crossover
  const [nSys, setNSys] = useState(8);
  const [nCon, setNCon] = useState(6);
  const [prevSys, setPrevSys] = useState<System | null>(null);

  const onSystem = (k: string) => {
    const s = SYSTEMS.find((x) => x.key === k)!;
    setPrevSys(sys);
    setSysKey(k); setActiveUcId(null); setToolName(s.tools[0].name);
    setArgVals(Object.fromEntries(s.tools[0].args.map((a) => [a.name, a.example])));
    setHistory([]); setViewCallId(null); setTab("tools"); setCustomTools([]);
  };
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP01_USE_CASES.find((u) => u.id === id) : null;
    const tools = uc ? uc.payload.tools : SYSTEMS[0].tools;
    setToolName(tools[0].name);
    setArgVals(Object.fromEntries(tools[0].args.map((a) => [a.name, a.example])));
    setHistory([]); setViewCallId(null); setTab("tools"); setCustomTools([]);
    setNSys(uc ? uc.payload.nSys : 8); setNCon(uc ? uc.payload.nCon : 6);
  };
  const onTool = (name: string) => {
    const t = allTools.find((x) => x.name === name)!;
    setToolName(name);
    setArgVals(Object.fromEntries(t.args.map((a) => [a.name, a.example])));
  };

  const send = () => {
    const id = ++idCounter;
    const args: Record<string, string | number> = {};
    for (const a of tool.args) args[a.name] = a.type === "number" ? Number(argVals[a.name]) : argVals[a.name];

    // malformed injection: break the first numeric field's type
    const numArg = tool.args.find((a) => a.type === "number");
    if (malformed && numArg) args[numArg.name] = `${argVals[numArg.name] || "50"}-GBP` as unknown as string;

    const request = { jsonrpc: "2.0", id, method: "tools/call", params: { name: tool.name, arguments: args } };

    // validate
    const missing = tool.args.find((a) => a.required && !String(argVals[a.name] ?? "").trim());
    const badNum = malformed && numArg ? numArg : tool.args.find((a) => a.type === "number" && argVals[a.name] !== "" && Number.isNaN(Number(argVals[a.name])));

    const reqFrame: Frame = { dir: "req", body: request, note: "The client asks the server to run one named tool with typed arguments, nothing else is on the wire." };
    let frames: Frame[]; let isError: boolean;
    if (missing || badNum) {
      const field = missing?.name ?? badNum!.name;
      const message = missing ? `Missing required parameter: ${field}` : `Invalid type for parameter '${field}': expected number`;
      const error = { jsonrpc: "2.0", id, error: { code: -32602, message, data: { param: field } } };
      frames = [reqFrame, { dir: "res", body: error, note: "Bad arguments are rejected at the contract boundary with a typed JSON RPC error (-32602), not a 500, not a hallucinated answer.", error: true }];
      isError = true;
    } else {
      const response = { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(tool.result(argVals)) }], isError: false } };
      frames = [reqFrame, { dir: "res", body: response, note: "The server returns structured content the client can trust the shape of, the same envelope for every tool." }];
      isError = false;
    }
    // Byte size is real (serialized frames); latency is a deterministic pseudo-figure, labeled as illustrative in the log.
    const bytes = frames.reduce((n, f) => n + JSON.stringify(f.body).length, 0);
    const ms = 38 + tool.name.length * 3 + Object.keys(argVals).length * 7;
    setHistory((h) => [{ id, tool: tool.name, sysLabel: sys.label, frames, error: isError, ms, bytes }, ...h]);
    setViewCallId(id);
  };

  const addTool = () => {
    const v = validateToolDef({ name: ntName, description: ntDesc, args: ntArgs.map((a) => ({ name: a.name, type: a.type, required: a.required, example: "" })) }, allTools.map((t) => t.name));
    if (!v.ok || !v.def) { setNtErrors(v.errors); return; }
    const def = v.def;
    const t: Tool = { name: def.name, description: def.description, args: def.args.map((a) => ({ name: a.name, type: a.type, required: a.required, example: a.example, enumVals: a.enumVals })), result: (a) => ({ ok: true, tool: def.name, arguments: a, note: "custom tool \u2014 deterministic echo of your typed arguments" }) };
    setCustomTools((cs) => manifestWithTool(cs, t));
    setToolName(def.name);
    setArgVals(Object.fromEntries(def.args.map((a) => [a.name, a.example])));
    setNtName(""); setNtDesc(""); setNtArgs([{ name: "", type: "string", required: true }]); setNtErrors([]);
    setTab("tools");
    toast(`Added \u201c${def.name}\u201d to ${sys.label}`);
  };

  // Restore a shared call (?cfg=) once on mount.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("cfg");
    if (!raw) return;
    try {
      const cfg = JSON.parse(atob(raw)) as { sys?: string; tool?: string; args?: Record<string, string>; nSys?: number; nCon?: number; tab?: "tools" | "resources" | "prompts"; ann?: boolean; mal?: boolean };
      if (cfg.sys) setSysKey(cfg.sys);
      if (cfg.tool) setToolName(cfg.tool);
      if (cfg.args) setArgVals(cfg.args);
      if (typeof cfg.nSys === "number") setNSys(cfg.nSys);
      if (typeof cfg.nCon === "number") setNCon(cfg.nCon);
      if (cfg.tab) setTab(cfg.tab);
      if (typeof cfg.ann === "boolean") setAnnotate(cfg.ann);
      if (typeof cfg.mal === "boolean") setMalformed(cfg.mal);
    } catch { /* ignore malformed link */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();
  const shareScenario = () => {
    const cfg = btoa(JSON.stringify({ sys: sysKey, tool: toolName, args: argVals, nSys, nCon, tab, ann: annotate, mal: malformed }));
    const params = new URLSearchParams(window.location.search);
    params.set("cfg", cfg);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("Link copied, this exact call"), () => toast("Link is in the address bar"));
    } else { toast("Link is in the address bar"); }
  };
  const resetLab = () => { onSystem(SYSTEMS[0].key); setNSys(8); setNCon(6); setMalformed(false); setAnnotate(true); toast("Playground reset"); };

  const manifestDiff = prevSys && prevSys.key !== sys.key ? diffManifests(prevSys, sys) : null;

  // ---- Export suite + command palette ----
  const exportCsv = () => {
    const headers = ["#", "Tool", "System", "Status", "Latency (ms)", "Bytes"];
    const rows = history.map((c) => [c.id, c.tool, c.sysLabel, c.error ? "error" : "ok", c.ms, c.bytes]);
    downloadCsv("mcp-session-log", headers, rows);
    toast(history.length ? "Session log exported as CSV" : "No calls yet, run one first");
  };
  const exportSession = () => {
    downloadJson("mcp-session", { version: 1, system: sysKey, tool: toolName, args: argVals, calls: history });
    toast("Session exported as JSON");
  };
  const exportActions: ExportAction[] = [
    { id: "csv", label: "Session log as CSV", hint: "Every call: latency + bytes", onSelect: exportCsv },
    { id: "json", label: "Export session (JSON)", hint: "Calls + current config", onSelect: exportSession },
  ];
  const paletteCommands: Command[] = [
    { id: "act-share", label: "Copy share link", group: "action", keywords: "permalink url call", run: shareScenario },
    { id: "act-reset", label: "Reset playground", group: "action", run: resetLab },
    { id: "act-annot", label: "Toggle exec annotations", group: "action", run: () => setAnnotate((v) => !v) },
    { id: "act-malformed", label: "Toggle malformed arguments", group: "action", keywords: "error -32602", run: () => setMalformed((v) => !v) },
    { id: "act-clear", label: "Clear session log", group: "action", run: () => { setHistory([]); setViewCallId(null); toast("Session log cleared"); } },
    { id: "exp-csv", label: "Export session log as CSV", group: "export", run: exportCsv },
    { id: "exp-json", label: "Export session as JSON", group: "export", run: exportSession },
    ...LABS.filter((l) => l.href && l.status !== "planned").map((l) => ({
      id: `nav-${l.id}`, label: `Go to ${l.title}`, group: l.id, keywords: l.id, run: () => router.push(l.href as string),
    })),
  ];

  const bespoke = nSys * nCon;
  const mcp = nSys + nCon;

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-01</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent Architecture and Protocol Strategy Artifacts</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">MCP Server Contract Workbench</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            MCP is not a magic layer. It is an integration contract. This artifact shows how a shared protocol can reduce
            bespoke connector work as the number of tools and agent consumers grows.
          </p>
        </div>

        <UseCaseRail useCases={GAP01_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Enterprise agent programs often stall because every new tool requires custom integration work. When systems and agent consumers multiply, point to point integration becomes an operating burden that MCP can reduce when the integration surface is large enough." approach="The workbench shows a modeled MCP client interacting with server manifests, tools, resources, prompts, structured requests, typed errors, and the initialization handshake, making the protocol contract and its integration tradeoff visible rather than claiming production MCP coverage." why="This artifact connects protocol design to delivery speed, integration cost, change failure risk, and operating maintainability, showing why integration strategy matters before agent work scales across teams." metric="The crossover in the producers×consumers chart: the consumer count at which the shared protocol becomes cheaper than bespoke glue." tradeoff="A protocol layer is overhead for a tiny surface (a few tools, one consumer). The lab shows exactly where the surface is large enough that standardizing pays." outcome="A defensible recommendation to adopt (or not adopt) MCP for a given integration surface, with the crossover math and honest failure modes on the wire, not a slide asserting it." />

        <LabToolbar>
          <ToolbarButton onClick={shareScenario} title="Copy a link that reproduces this exact call">
            <Share2 className="h-3.5 w-3.5" /> Share
          </ToolbarButton>
          <ToolbarButton onClick={resetLab} title="Reset the playground to defaults">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </ToolbarButton>
          <ToolbarButton onClick={() => setAnnotate((v) => !v)} active={annotate} title="Toggle the plain English annotation under each frame">
            <Eye className="h-3.5 w-3.5" /> Exec annotations
          </ToolbarButton>
          <ToolbarButton onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))} className="ml-auto" title="Command palette (⌘K)">
            ⌘K
          </ToolbarButton>
          <ExportMenu actions={exportActions} />
        </LabToolbar>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {!activeUc && SYSTEMS.map((s) => (
            <button key={s.key} onClick={() => onSystem(s.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${s.key === sysKey ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{s.label}</button>
          ))}
          <span className="text-[11px] text-slatey-500">{sys.blurb}</span>
        </div>

        {manifestDiff && manifestDiff.changed && (
          <div className="mb-5 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-card">
            <p className="mb-1 font-semibold text-ink">Switched from {prevSys?.label} <span className="font-normal text-slatey-500">· what the contract changed</span></p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {([["Tools", manifestDiff.tools], ["Resources", manifestDiff.resources], ["Prompts", manifestDiff.prompts]] as const).map(([label, d]) => (
                <span key={label} className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-slatey-500">{label}:</span>
                  {d.added.length === 0 && d.removed.length === 0 ? (
                    <span className="text-slatey-400">unchanged</span>
                  ) : (
                    <>
                      {d.added.map((n) => <span key={n} className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">+{n}</span>)}
                      {d.removed.map((n) => <span key={n} className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-rose-700 line-through">{n}</span>)}
                    </>
                  )}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-slatey-500">Same protocol, different surface, a client written to the MCP contract adapts without new integration code.</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Manifest */}
          <Panel>
            <p className="stat-label mb-2">Server manifest <span className="font-normal text-slatey-500">· {sys.label}</span></p>
            <div className="mb-3 flex gap-1.5">
              {TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${tab === key ? "border-teal-600 bg-teal-50 text-teal-700" : "border-line text-slatey-400 hover:text-ink"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label} · {key === "tools" ? allTools.length : key === "resources" ? sys.resources.length : sys.prompts.length}
                </button>
              ))}
            </div>

            {tab === "tools" && (
              <div className="space-y-2">
                {allTools.map((t) => (
                  <button key={t.name} onClick={() => onTool(t.name)}
                    className={`block w-full rounded-lg border p-2.5 text-left transition ${t.name === toolName ? "border-teal-600 bg-teal-50/60" : "border-line hover:border-teal-500/40"}`}>
                    <p className="font-mono text-xs font-semibold text-ink">{t.name}<span className="ml-1 font-sans font-normal text-slatey-500">({t.args.map((a) => a.name).join(", ")})</span>{customTools.some((c) => c.name === t.name) && <span className="ml-1 rounded bg-teal-100 px-1 py-0.5 align-middle text-[9px] font-semibold text-teal-700">custom</span>}</p>
                    <p className="mt-0.5 text-[11px] text-slatey-400">{t.description}</p>
                  </button>
                ))}
                <details className="rounded-lg border border-dashed border-teal-500/40 bg-teal-50/20 p-2.5">
                  <summary className="cursor-pointer text-xs font-semibold text-teal-700">+ Build a custom tool</summary>
                  <div className="mt-2 space-y-2">
                    <input value={ntName} onChange={(e) => setNtName(e.target.value)} placeholder="tool_name (lower_snake_case)" className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 font-mono text-xs" />
                    <input value={ntDesc} onChange={(e) => setNtDesc(e.target.value)} placeholder="description (optional)" className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs" />
                    <div className="space-y-1.5">
                      {ntArgs.map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input value={a.name} onChange={(e) => setNtArgs((xs) => xs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="arg_name" className="min-w-0 flex-1 rounded-md border border-line bg-white px-2 py-1 font-mono text-[11px]" />
                          <select value={a.type} onChange={(e) => setNtArgs((xs) => xs.map((x, j) => (j === i ? { ...x, type: e.target.value as ArgType } : x)))} className="rounded-md border border-line bg-white px-1.5 py-1 text-[11px]">
                            <option value="string">string</option>
                            <option value="number">number</option>
                          </select>
                          <label className="inline-flex items-center gap-1 text-[10px] text-slatey-500"><input type="checkbox" checked={a.required} onChange={(e) => setNtArgs((xs) => xs.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />req</label>
                          {ntArgs.length > 1 && <button type="button" onClick={() => setNtArgs((xs) => xs.filter((_, j) => j !== i))} className="text-slatey-400 hover:text-rose-600" aria-label="Remove argument"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setNtArgs((xs) => [...xs, { name: "", type: "string", required: false }])} className="text-[11px] font-medium text-teal-700 hover:underline">+ Arg</button>
                      <button type="button" onClick={addTool} className="ml-auto rounded-md bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700">Add to server</button>
                    </div>
                    {ntErrors.length > 0 && <ul className="space-y-0.5">{ntErrors.map((e, i) => <li key={i} className="text-[10.5px] text-rose-600">&bull; {e}</li>)}</ul>}
                    <p className="text-[10px] text-slatey-500">Validated against the MCP tool shape, then callable above with real JSON RPC frames (honest -32602 on bad args).</p>
                  </div>
                </details>
              </div>
            )}
            {tab === "resources" && (
              <ul className="space-y-1.5 text-xs">
                {sys.resources.map((r) => (<li key={r.uri} className="rounded-md border border-line p-2"><p className="font-mono text-teal-700">{r.uri}</p><p className="text-slatey-400">{r.name}</p></li>))}
              </ul>
            )}
            {tab === "prompts" && (
              <ul className="space-y-1.5 text-xs">
                {sys.prompts.map((p) => (<li key={p.name} className="rounded-md border border-line p-2"><p className="font-mono font-semibold text-ink">{p.name}</p><p className="text-slatey-400">args: {p.args.join(", ")}</p></li>))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-slatey-500">Most demos stop at tools. Resources (read only context) and prompts (reusable templates) are part of the same contract.</p>
            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-xs font-semibold text-slatey-400">Session lifecycle <span className="font-normal text-slatey-500">· the initialize handshake</span></summary>
              <ol className="mt-2 space-y-1.5">
                {lifecycle.map((f) => (
                  <li key={f.seq} className="rounded-md border border-line p-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-mono text-slatey-500">{f.dir}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slatey-600">{f.kind}</span>
                      {f.method && <span className="font-mono font-semibold text-teal-700">{f.method}</span>}
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[10px] leading-relaxed text-slate-200">{JSON.stringify(f.body, null, 2)}</pre>
                    <p className="mt-1 text-[10px] text-slatey-500">{f.note}</p>
                  </li>
                ))}
              </ol>
            </details>
          </Panel>

          {/* Composer + trace */}
          <div className="space-y-4">
            <Panel>
              <p className="stat-label mb-2">Call <span className="font-mono text-teal-700">{tool.name}</span></p>
              <div className="space-y-2">
                {tool.args.map((a) => (
                  <div key={a.name}>
                    <label className="mb-0.5 block text-[11px] font-medium text-slatey-400">{a.name} <span className="text-slatey-500">· {a.type}{a.required ? " · required" : ""}</span></label>
                    {a.type === "enum" ? (
                      <select aria-label={a.name} value={argVals[a.name] ?? ""} onChange={(e) => setArgVals((v) => ({ ...v, [a.name]: e.target.value }))} className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs">
                        {a.enumVals!.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input aria-label={a.name} value={argVals[a.name] ?? ""} onChange={(e) => setArgVals((v) => ({ ...v, [a.name]: e.target.value }))} className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 font-mono text-xs" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={send} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Send <ArrowRight className="h-3.5 w-3.5" /></button>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-slatey-500">
                  <input type="checkbox" checked={malformed} onChange={(e) => setMalformed(e.target.checked)} className="accent-rose-500" /> Inject malformed args
                </label>
              </div>
            </Panel>

            {history.length > 0 && (() => {
              const viewCall = history.find((c) => c.id === viewCallId) ?? history[0];
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="stat-label">Call trace <span className="font-normal text-slatey-500">· #{viewCall.id} · {viewCall.tool}</span></p>
                    <button onClick={() => { downloadJson(`mcp-trace-${viewCall.id}`, traceToJson(viewCall)); toast("Trace downloaded as JSON"); }} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-slatey-400 hover:text-ink">Download trace</button>
                  </div>
                  {viewCall.frames.map((f, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                        {f.dir === "req"
                          ? <span className="text-slatey-500">→ request <span className="font-normal normal-case">#{viewCall.id} · {viewCall.tool}</span></span>
                          : <span className={f.error ? "text-rose-600" : "text-teal-700"}>← response{f.error ? " · error" : ""}</span>}
                        <button onClick={() => { copyToClipboard(JSON.stringify(f.body, null, 2)); toast("Frame copied"); }} className="ml-auto rounded border border-line px-1.5 py-0.5 text-[10px] font-medium normal-case text-slatey-400 hover:text-ink">copy</button>
                      </div>
                      <pre className={`overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed ${f.error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-line bg-ink text-slate-100"}`}>{JSON.stringify(f.body, null, 2)}</pre>
                      {annotate && <p className="mt-1 text-[11px] italic text-slatey-500">{f.note}</p>}
                    </div>
                  ))}
                </div>
              );
            })()}

            {history.length > 0 && (
              <Panel>
                <div className="mb-2 flex items-center justify-between">
                  <p className="stat-label">Session log <span className="font-normal text-slatey-500">· {history.length} call{history.length > 1 ? "s" : ""}</span></p>
                  <button onClick={() => { setHistory([]); setViewCallId(null); }} className="text-[11px] font-medium text-slatey-400 hover:text-ink">Clear</button>
                </div>
                <ul className="space-y-1">
                  {history.map((c) => {
                    const on = c.id === (viewCallId ?? history[0].id);
                    return (
                      <li key={c.id}>
                        <button onClick={() => setViewCallId(c.id)} className={`flex w-full items-center gap-2 rounded-md border px-2 py-1 text-left text-[11px] transition ${on ? "border-teal-500 bg-teal-50/60" : "border-line hover:border-teal-500/40"}`}>
                          <span className="font-mono text-slatey-500">#{c.id}</span>
                          <span className="font-mono font-semibold text-ink">{c.tool}</span>
                          <Badge tone={c.error ? "rose" : "emerald"}>{c.error ? "error" : "ok"}</Badge>
                          <span className="ml-auto font-mono text-slatey-500">~{c.ms}ms · {c.bytes}B</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[10px] text-slatey-500">Byte sizes are the real serialized frames; latency is illustrative.</p>
              </Panel>
            )}
          </div>
        </div>

        {/* Crossover */}
        <Panel className="mt-6">
          <p className="stat-label mb-2">MCP vs bespoke, the crossover</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Slider label="Systems to expose" value={nSys} min={1} max={40} onChange={setNSys} />
              <Slider label="Agent consumers" value={nCon} min={1} max={40} onChange={setNCon} />
            </div>
            <div className="grid grid-cols-2 gap-3 self-center text-center">
              <div className="rounded-lg border border-line bg-white p-3"><p className="text-[11px] text-slatey-500">Bespoke integrations</p><p className="font-mono text-2xl font-semibold text-rose-600">{bespoke}</p><p className="text-[10px] text-slatey-500">systems × consumers</p></div>
              <div className="rounded-lg border border-line bg-white p-3"><p className="text-[11px] text-slatey-500">MCP endpoints</p><p className="font-mono text-2xl font-semibold text-teal-700">{mcp}</p><p className="text-[10px] text-slatey-500">systems + consumers</p></div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slatey-500">Bespoke integration grows as N×M; a shared protocol grows as N+M. The crossover is early, {bespoke > mcp ? `here MCP is ${(bespoke / mcp).toFixed(1)}× fewer connections` : "at tiny scale bespoke can still win"}.</p>
        </Panel>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Adopt MCP when the number of systems and agent consumers makes bespoke integration inefficient." lift="Reduces repeated connector work by moving shared tools behind a reusable protocol contract." measure="Connector count reduced, tool onboarding time, protocol adoption share, integration change failure rate." />
          <InsightCard title="What the wire teaches" tone="info">
            Every tool call is the same envelope: a named tool, typed arguments, structured content back, typed errors on failure. That uniformity is the whole value, one contract, many systems, many consumers.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "The MCP decision is not ideological. Count the systems, count the consumers, and identify the crossover where standardization becomes cheaper than custom glue."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Manifests are authored per mock system (tools with typed args, resources, prompts). The composer builds a real JSON RPC 2.0 `tools/call` frame; arguments are validated against the tool&apos;s schema, and failures return a −32602 error frame, the same path a real server takes.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic, client side. No live server, the round trip is constructed, not fetched, and labeled SIMULATED.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this is a deterministic portfolio artifact. A production MCP implementation would require authentication, authorization, capability negotiation, streaming, pagination, observability, and enterprise security controls.</p>
        </div>
        <ToastHost />
        <CommandPalette commands={paletteCommands} />
      </main>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">{label}</label><span className="font-mono text-xs font-semibold text-ink">{value}</span></div>
      <input type="range" aria-label={label} min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-teal-600" />
    </div>
  );
}
