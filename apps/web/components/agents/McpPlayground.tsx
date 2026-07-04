"use client";

// GAP-01 · MCP Server Playground (Collection 2 · toolkit · flagship).
// Pick a mock enterprise system → its MCP manifest generates (tools / resources /
// prompts) → compose a tool call → read the full JSON-RPC round trip, both
// directions, annotated in plain English — including how malformed arguments get
// rejected at the contract boundary. MCP is just a disciplined contract; this
// reads the wire. SIMULATED (frames are constructed deterministically).

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Wrench, FileText, MessageSquare } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";

type ArgType = "string" | "number" | "enum";
interface Arg { name: string; type: ArgType; required: boolean; example: string; enumVals?: string[] }
interface Tool { name: string; description: string; args: Arg[]; result: (a: Record<string, string>) => object }
interface Resource { uri: string; name: string }
interface Prompt { name: string; args: string[] }
interface System { key: string; label: string; blurb: string; tools: Tool[]; resources: Resource[]; prompts: Prompt[] }

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
    key: "hr", label: "HR knowledge base", blurb: "Policy + employee self-service (internal).",
    tools: [
      { name: "search_policy", description: "Semantic search over HR policy.", args: [{ name: "query", type: "string", required: true, example: "parental leave eligibility" }],
        result: (a) => ({ query: a.query, matches: [{ doc: "leave_policy_v7", section: "3.2", snippet: "Eligible after 12 months of continuous service…" }] }) },
      { name: "request_time_off", description: "File a time-off request.", args: [
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
  const sys = SYSTEMS.find((s) => s.key === sysKey)!;
  const [tab, setTab] = useState<"tools" | "resources" | "prompts">("tools");
  const [toolName, setToolName] = useState(sys.tools[0].name);
  const tool = sys.tools.find((t) => t.name === toolName) ?? sys.tools[0];
  const [argVals, setArgVals] = useState<Record<string, string>>(() => Object.fromEntries(sys.tools[0].args.map((a) => [a.name, a.example])));
  const [annotate, setAnnotate] = useState(true);
  const [malformed, setMalformed] = useState(false);
  const [frames, setFrames] = useState<{ dir: "req" | "res"; body: object; note: string; error?: boolean }[] | null>(null);

  // systems × consumers crossover
  const [nSys, setNSys] = useState(8);
  const [nCon, setNCon] = useState(6);

  const onSystem = (k: string) => {
    const s = SYSTEMS.find((x) => x.key === k)!;
    setSysKey(k); setToolName(s.tools[0].name);
    setArgVals(Object.fromEntries(s.tools[0].args.map((a) => [a.name, a.example])));
    setFrames(null); setTab("tools");
  };
  const onTool = (name: string) => {
    const t = sys.tools.find((x) => x.name === name)!;
    setToolName(name);
    setArgVals(Object.fromEntries(t.args.map((a) => [a.name, a.example])));
    setFrames(null);
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

    if (missing || badNum) {
      const field = missing?.name ?? badNum!.name;
      const message = missing ? `Missing required parameter: ${field}` : `Invalid type for parameter '${field}': expected number`;
      const error = { jsonrpc: "2.0", id, error: { code: -32602, message, data: { param: field } } };
      setFrames([
        { dir: "req", body: request, note: "The client asks the server to run one named tool with typed arguments — nothing else is on the wire." },
        { dir: "res", body: error, note: "Bad arguments are rejected at the contract boundary with a typed JSON-RPC error (-32602) — not a 500, not a hallucinated answer.", error: true },
      ]);
      return;
    }

    const response = { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(tool.result(argVals)) }], isError: false } };
    setFrames([
      { dir: "req", body: request, note: "The client asks the server to run one named tool with typed arguments — nothing else is on the wire." },
      { dir: "res", body: response, note: "The server returns structured content the client can trust the shape of — the same envelope for every tool." },
    ]);
  };

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
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">MCP Server Playground</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            MCP isn&apos;t magic — it&apos;s a disciplined contract. Pick a system, watch its server manifest, then send a
            tool call and read the exact JSON-RPC that crosses the wire, both directions.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {SYSTEMS.map((s) => (
            <button key={s.key} onClick={() => onSystem(s.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${s.key === sysKey ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{s.label}</button>
          ))}
          <span className="text-[11px] text-slatey-500">{sys.blurb}</span>
          <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slatey-500">
            <input type="checkbox" checked={annotate} onChange={(e) => setAnnotate(e.target.checked)} className="accent-teal-600" /> Exec annotations
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Manifest */}
          <Panel>
            <p className="stat-label mb-2">Server manifest <span className="font-normal text-slatey-500">· {sys.label}</span></p>
            <div className="mb-3 flex gap-1.5">
              {TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${tab === key ? "border-teal-600 bg-teal-50 text-teal-700" : "border-line text-slatey-400 hover:text-ink"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label} · {key === "tools" ? sys.tools.length : key === "resources" ? sys.resources.length : sys.prompts.length}
                </button>
              ))}
            </div>

            {tab === "tools" && (
              <div className="space-y-2">
                {sys.tools.map((t) => (
                  <button key={t.name} onClick={() => onTool(t.name)}
                    className={`block w-full rounded-lg border p-2.5 text-left transition ${t.name === toolName ? "border-teal-600 bg-teal-50/60" : "border-line hover:border-teal-500/40"}`}>
                    <p className="font-mono text-xs font-semibold text-ink">{t.name}<span className="ml-1 font-sans font-normal text-slatey-500">({t.args.map((a) => a.name).join(", ")})</span></p>
                    <p className="mt-0.5 text-[11px] text-slatey-400">{t.description}</p>
                  </button>
                ))}
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
            <p className="mt-3 text-[11px] text-slatey-500">Most demos stop at tools. Resources (read-only context) and prompts (reusable templates) are part of the same contract.</p>
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
                      <select value={argVals[a.name] ?? ""} onChange={(e) => setArgVals((v) => ({ ...v, [a.name]: e.target.value }))} className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs">
                        {a.enumVals!.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={argVals[a.name] ?? ""} onChange={(e) => setArgVals((v) => ({ ...v, [a.name]: e.target.value }))} className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 font-mono text-xs" />
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

            {frames && (
              <div className="space-y-2">
                {frames.map((f, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                      {f.dir === "req" ? <span className="text-slatey-500">→ request</span> : <span className={f.error ? "text-rose-600" : "text-teal-700"}>← response{f.error ? " · error" : ""}</span>}
                    </div>
                    <pre className={`overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed ${f.error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-line bg-ink text-slate-100"}`}>{JSON.stringify(f.body, null, 2)}</pre>
                    {annotate && <p className="mt-1 text-[11px] italic text-slatey-500">{f.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Crossover */}
        <Panel className="mt-6">
          <p className="stat-label mb-2">MCP vs bespoke — the crossover</p>
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
          <p className="mt-2 text-[11px] text-slatey-500">Bespoke integration grows as N×M; a shared protocol grows as N+M. The crossover is early — {bespoke > mcp ? `here MCP is ${(bespoke / mcp).toFixed(1)}× fewer connections` : "at tiny scale bespoke can still win"}.</p>
        </Panel>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="What the wire teaches" tone="info">
            Every tool call is the same envelope: a named tool, typed arguments, structured content back, typed errors on failure. That uniformity is the whole value — one contract, many systems, many consumers.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> Deciding MCP vs bespoke isn&apos;t religious — it&apos;s how many systems and how many consumers. The crossover is earlier than teams expect.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Manifests are authored per mock system (tools with typed args, resources, prompts). The composer builds a real JSON-RPC 2.0 `tools/call` frame; arguments are validated against the tool&apos;s schema, and failures return a −32602 error frame — the same path a real server takes.</p>
              <p>Stack: Next.js (static) + shared design system; deterministic, client-side. No live server — the round trip is constructed, not fetched, and labeled SIMULATED.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> a real MCP server adds capability negotiation, auth, streaming, and pagination; this shows the core request/response contract, not the full lifecycle.</p>
        </div>
      </main>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-slatey-400">{label}</label><span className="font-mono text-xs font-semibold text-ink">{value}</span></div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-teal-600" />
    </div>
  );
}
