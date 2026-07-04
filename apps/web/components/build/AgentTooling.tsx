"use client";

// Phase 5 — Agent & tool-calling mechanics UI. Enterprise-safe: scoped tools,
// governed workflow trace, permission boundaries, approvals, blocked actions, and
// misuse evals. No real external actions. Persists the agent tooling contract in
// live mode so Operate + Govern can consume it.
//
// Phase E — the safety story made touchable: the trace replays step by step with
// the blocked branch as a visible fork, and the approval flow takes real
// decisions that append audit lines and update the pending-approvals count.
// All interaction state is session-local (never written to program state), so
// there is zero update-loop risk and demo mode stays read-only.

import { useEffect, useMemo, useState } from "react";
import {
  useProgramSource, buildBuildOutputContract,
  TOOL_REGISTRY, WORKFLOW_TRACE, MISUSE_EVALS, PERMISSION_BOUNDARIES, AGENT_ROLLBACK_OPTIONS,
  isAgenticInitiative, buildAgentToolingContract,
} from "@labs/program-core";
import { Panel, SectionHeader, Badge, InsightCard, cn } from "@labs/design-system";
import {
  Wrench, Workflow, ShieldCheck, Gavel, FlaskConical, ClipboardCheck, Info, RotateCcw, Ban, CheckCircle2, Clock, Play, ScrollText,
} from "lucide-react";

const stTone = (s: string): "emerald" | "amber" | "rose" | "slate" | "blue" =>
  s === "allowed" || s === "executed" ? "emerald" : s === "requires-approval" ? "amber" : s === "blocked" || s === "failed" ? "rose" : "slate";
const riskTone = (r: string): "rose" | "amber" | "slate" => (r === "critical" || r === "high" ? "rose" : r === "medium" ? "amber" : "slate");
const evalTone = (r: string): "emerald" | "amber" | "rose" => (r === "pass" ? "emerald" : r === "warning" ? "amber" : "rose");

type Decision = "approved" | "edit" | "rejected";
const DECISION_LABEL: Record<Decision, string> = {
  approved: "Draft approved for send by Support Lead",
  edit: "Draft returned for edit by Support Lead",
  rejected: "Draft rejected by Support Lead",
};

// The blocked branch forks off after the policy boundary check (step 5).
const FORK_AFTER_STEP = 5;

export function AgentTooling() {
  const { state, isDemo, hydrated, update, src } = useProgramSource();
  const agentic = isAgenticInitiative(src);
  const contract = useMemo(() => buildAgentToolingContract(src), [src]);

  // Persist the agent tooling contract (+ refresh build contract) in live mode.
  const sig = JSON.stringify({ tags: state.initiative?.meta?.capabilityTags, pat: state.initiative?.meta?.primaryAiPattern, name: state.initiative?.name });
  useEffect(() => {
    if (!hydrated || isDemo) return;
    update((d) => { d.rag = { ...(d.rag ?? {}), agentTooling: buildAgentToolingContract(d) }; d.rag.contract = buildBuildOutputContract(d); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated, isDemo]);

  // --- Phase E · trace playback (session-local UI state) ---------------------
  const total = WORKFLOW_TRACE.steps.length;
  const [revealed, setRevealed] = useState(total); // fully visible on arrival
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (revealed >= total) { setPlaying(false); return; }
    const t = setTimeout(() => setRevealed((r) => r + 1), 650);
    return () => clearTimeout(t);
  }, [playing, revealed, total]);
  const replay = () => { setRevealed(0); setPlaying(true); };

  // --- Phase E · approval decisions + session audit feed ---------------------
  const [decision, setDecision] = useState<Decision | null>(null);
  const [blockedTried, setBlockedTried] = useState(false);
  const [audit, setAudit] = useState<{ t: string; line: string; tone: "emerald" | "amber" | "rose" }[]>([]);
  const log = (line: string, tone: "emerald" | "amber" | "rose") =>
    setAudit((a) => [...a, { t: new Date().toLocaleTimeString(), line, tone }]);
  const decide = (d: Decision) => {
    if (decision) return;
    setDecision(d);
    log(`${WORKFLOW_TRACE.auditLogId} · ${DECISION_LABEL[d]} · actor: human`, d === "approved" ? "emerald" : d === "edit" ? "amber" : "rose");
  };
  const tryBlocked = () => {
    setBlockedTried(true);
    log(`${WORKFLOW_TRACE.auditLogId} · approve-refund attempt BLOCKED by policy boundary · routed to human`, "rose");
  };
  const resetSession = () => { setDecision(null); setBlockedTried(false); setAudit([]); };

  const pendingApprovals = Math.max(0, contract.operationalSignals.approvalQueueCount - (decision ? 1 : 0));

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className={cn("rounded-xl border p-4", agentic ? "border-primary/25 bg-primary/[0.04]" : "border-dashed border-line bg-slate-50/60")}>
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-ink">{agentic ? "Agentic workflow active for this initiative" : "Agent mechanics (reference)"}</span>
          <Badge tone={agentic ? "emerald" : "slate"}>{agentic ? "enabled" : "not required by this initiative"}</Badge>
        </div>
        <p className="mt-1 text-sm text-slatey-400">{agentic
          ? "Strategy tagged this initiative as agentic / tool-using, so these tool schemas, approvals, and audit traces apply to its Build Output Contract."
          : "This initiative isn't tagged agentic, but the mechanics below show how tool-calling would be scoped and governed if it were."}</p>
      </div>

      {/* 3 — Tool schema registry */}
      <Panel>
        <SectionHeader eyebrow="Tool schema registry" title="What the agent may (and may not) call" icon={Wrench}
          description="Each tool is scoped with a schema, allowed roles, risk level, approval mode, and rollback path. Some are intentionally blocked." />
        <div className="grid gap-3 lg:grid-cols-2">
          {TOOL_REGISTRY.map((t) => (
            <div key={t.id} className={cn("flex flex-col rounded-xl border p-4", t.approvalMode === "blocked" ? "border-rose-300 bg-rose-50/40" : "border-line bg-white")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{t.name}</span>
                <div className="flex gap-1.5">
                  <Badge tone={riskTone(t.riskLevel)}>{t.riskLevel}</Badge>
                  <Badge tone={t.approvalMode === "blocked" ? "rose" : t.approvalMode === "none" ? "emerald" : "amber"}>{t.approvalMode}</Badge>
                </div>
              </div>
              <p className="mt-1 text-xs text-slatey-400">{t.description}</p>
              <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
                <div><dt className="inline font-semibold text-slatey-500">Category: </dt><dd className="inline text-slatey-400">{t.category}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Input: </dt><dd className="inline font-mono text-slatey-400">{Object.entries(t.inputSchema).map(([k, v]) => `${k}:${v}`).join(", ")}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Output: </dt><dd className="inline font-mono text-slatey-400">{Object.entries(t.outputSchema).map(([k, v]) => `${k}:${v}`).join(", ")}</dd></div>
                <div><dt className="inline font-semibold text-slatey-500">Roles: </dt><dd className="inline text-slatey-400">{t.allowedRoles.join(", ")}</dd></div>
                {t.restrictedActions.length > 0 && <div><dt className="inline font-semibold text-rose-600">Restricted: </dt><dd className="inline text-slatey-400">{t.restrictedActions.join(", ")}</dd></div>}
                <div><dt className="inline font-semibold text-slatey-500">Audit: </dt><dd className="inline text-slatey-400">{t.auditRequired ? "required" : "no"} · Rollback: {t.rollbackAvailable ? "available" : "n/a"} · Owner: {t.owner}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </Panel>

      {/* 4 — Workflow trace with playback + blocked fork */}
      <Panel>
        <SectionHeader eyebrow="Agentic workflow trace" title={WORKFLOW_TRACE.name} icon={Workflow}
          description={`Request: "${WORKFLOW_TRACE.userRequest}"`}
          action={
            <div className="flex items-center gap-2">
              <button onClick={replay} disabled={playing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-300 hover:bg-slate-50 disabled:opacity-60">
                <Play className="h-3.5 w-3.5" /> {playing ? "Playing…" : "Replay trace"}
              </button>
              <Badge tone={stTone(WORKFLOW_TRACE.finalStatus)}>{WORKFLOW_TRACE.finalStatus}</Badge>
            </div>
          } />
        <ol className="space-y-2">
          {WORKFLOW_TRACE.steps.map((s, i) => {
            const shown = i < revealed;
            const isNewest = playing && i === revealed - 1;
            return (
              <li key={s.id}>
                <div className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-all duration-300",
                  shown ? "border-line bg-white opacity-100" : "border-dashed border-line/60 bg-slate-50/40 opacity-40",
                  isNewest && "ring-2 ring-primary/30",
                )}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[11px] text-slatey-500">{s.stepNumber}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{s.label}</span>
                      {s.toolId && <Badge tone="slate">{s.toolId}</Badge>}
                      {shown && <Badge tone={stTone(s.status)}>{s.status}</Badge>}
                      {shown && s.latencyMs !== undefined && <span className="text-[11px] text-slatey-400"><Clock className="mr-0.5 inline h-3 w-3" />{s.latencyMs}ms</span>}
                    </div>
                    {shown && s.evidence && <p className="mt-0.5 text-[11px] text-slatey-400">{s.evidence}</p>}
                    {shown && s.policyCheck && <p className="mt-0.5 text-[11px] text-primary-dark">Policy: {s.policyCheck}</p>}
                  </div>
                </div>

                {/* The fork: the branch the agent tried to take — and couldn't. */}
                {s.stepNumber === FORK_AFTER_STEP && (
                  <div className={cn(
                    "ml-9 mt-2 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50/50 p-3 transition-all duration-300",
                    revealed > FORK_AFTER_STEP ? "opacity-100" : "opacity-40",
                    playing && revealed === FORK_AFTER_STEP + 1 && "ring-2 ring-rose-300",
                  )}>
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="text-[12px] leading-relaxed">
                      <p className="font-semibold text-rose-700">Blocked branch — attempted: approve-refund</p>
                      <p className="text-slatey-400">{WORKFLOW_TRACE.risks[0]}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {revealed >= total && (
          <div className="mt-3 rounded-lg border border-line bg-slate-50/60 p-3 text-[12px] leading-relaxed text-slatey-400">
            <b className="text-slatey-300">Final: </b>{WORKFLOW_TRACE.finalResponse}
          </div>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slatey-500"><RotateCcw className="h-3.5 w-3.5" /> Rollback: {WORKFLOW_TRACE.rollbackPlan} · Audit: {WORKFLOW_TRACE.auditLogId}</p>
      </Panel>

      {/* 5 — Permission boundaries */}
      <Panel>
        <SectionHeader eyebrow="Permission boundaries" title="Assist and recommend — don't act unsupervised" icon={ShieldCheck}
          description="Permission boundaries convert agentic AI from autonomous action into controlled workflow execution." />
        <div className="grid gap-3 md:grid-cols-3">
          <Boundary title="Allowed" tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} items={PERMISSION_BOUNDARIES.allowedActions} />
          <Boundary title="Requires approval" tone="amber" icon={<Clock className="h-4 w-4" />} items={PERMISSION_BOUNDARIES.restrictedActions} />
          <Boundary title="Blocked" tone="rose" icon={<Ban className="h-4 w-4" />} items={PERMISSION_BOUNDARIES.blockedActions} />
        </div>
      </Panel>

      {/* 6 — Action approval flow (real decisions, session-local) */}
      <Panel>
        <SectionHeader eyebrow="Action approval flow" title="Approvals gate risky actions" icon={Gavel}
          description="Take the Support Lead's decision yourself — every choice lands in the audit feed below and updates the pending-approvals count."
          action={audit.length > 0 ? <button onClick={resetSession} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><RotateCcw className="h-3 w-3" /> reset session</button> : null} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className={cn("rounded-xl border p-4", decision ? "border-line bg-white" : "border-amber-300 bg-amber-50/40")}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Draft customer reimbursement response</span>
              {decision
                ? <Badge tone={decision === "approved" ? "emerald" : decision === "edit" ? "amber" : "rose"}>{decision === "approved" ? "Approved" : decision === "edit" ? "Edit requested" : "Rejected"}</Badge>
                : <Badge tone="amber">High · pending</Badge>}
            </div>
            <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
              <div><dt className="inline font-semibold text-slatey-500">Tool: </dt><dd className="inline text-slatey-400">Draft Customer Response</dd></div>
              <div><dt className="inline font-semibold text-slatey-500">Policy: </dt><dd className="inline text-slatey-400">Allowed as draft only; direct send blocked</dd></div>
              <div><dt className="inline font-semibold text-slatey-500">Approval: </dt><dd className="inline text-slatey-400">Support Lead review required</dd></div>
              <div><dt className="inline font-semibold text-emerald-700">Recommended: </dt><dd className="inline text-slatey-400">Require human review before sending</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => decide("approved")} disabled={!!decision}
                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
              <button onClick={() => decide("edit")} disabled={!!decision}
                className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-slatey-300 hover:bg-slate-50 disabled:opacity-50">Require edit</button>
              <button onClick={() => decide("rejected")} disabled={!!decision}
                className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-slatey-300 hover:bg-slate-50 disabled:opacity-50">Reject</button>
              <span className="ml-auto text-[11px] text-slatey-400">{decision ? "Audit line written" : "Awaiting decision"}</span>
            </div>
          </div>
          <div className="rounded-xl border border-rose-300 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-ink">Approve refund</span><Badge tone="rose">Critical · Blocked</Badge></div>
            <p className="mt-2 text-[12px] leading-relaxed text-slatey-400">The AI is not permitted to approve financial transactions — try it and watch the boundary hold.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={tryBlocked}
                className="rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                Attempt refund approval as AI
              </button>
              {blockedTried && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600"><Ban className="h-3.5 w-3.5" /> Blocked by policy boundary — routed to a human</span>}
            </div>
          </div>
        </div>

        {/* Session audit feed */}
        <div className="mt-4 rounded-lg border border-line bg-slate-50/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slatey-500"><ScrollText className="h-3.5 w-3.5" /> Audit feed (session-local — resets on reload)</p>
          {audit.length === 0 ? (
            <p className="mt-1 text-[12px] text-slatey-400">No entries yet — take a decision above, or attempt the blocked action.</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {audit.map((a, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2 font-mono text-[11px]">
                  <span className="text-slatey-500">{a.t}</span>
                  <span className={a.tone === "emerald" ? "text-emerald-700" : a.tone === "amber" ? "text-amber-700" : "text-rose-700"}>{a.line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {/* 7 — Misuse evals */}
      <Panel className="overflow-x-auto">
        <SectionHeader eyebrow="Tool misuse evaluations" title="Agent behavior needs evaluation too" icon={FlaskConical} />
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">
            <th className="py-2 pr-3 font-semibold">Scenario</th><th className="py-2 pr-3 font-semibold">Expected</th><th className="py-2 pr-3 font-semibold">Observed</th><th className="py-2 pr-3 font-semibold">Result</th><th className="py-2 font-semibold">Recommended control</th>
          </tr></thead>
          <tbody>{MISUSE_EVALS.map((e) => (
            <tr key={e.id} className="border-b border-line/60 align-top">
              <td className="py-2 pr-3 font-medium text-ink">{e.name}</td>
              <td className="py-2 pr-3 text-slatey-400">{e.expectedBehavior}</td>
              <td className="py-2 pr-3 text-slatey-400">{e.observedBehavior}</td>
              <td className="py-2 pr-3"><Badge tone={evalTone(e.result)}>{e.result}</Badge></td>
              <td className="py-2 text-[12px] text-slatey-400">{e.recommendedControl}</td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>

      {/* 8 — Contract summary + 9 handoff */}
      <Panel>
        <SectionHeader eyebrow="Agent tooling contract" title="What flows to Operate & Govern" icon={ClipboardCheck} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Tool schemas" value={contract.toolSchemas.length} />
          <Stat label="Approvals pending" value={<>{pendingApprovals}{decision && <span className="ml-1.5 align-middle text-[11px] font-medium text-emerald-700">(1 resolved this session)</span>}</>} />
          <Stat label="Blocked actions" value={contract.permissionBoundaries.blockedActions.length} />
          <Stat label="Misuse evals pass" value={`${contract.misuseEvals.filter((e) => e.result === "pass").length}/${contract.misuseEvals.length}`} />
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="stat-label mb-1">→ Operate (tool telemetry)</p>
            <ul className="space-y-0.5 text-[12px] text-slatey-400">
              <li>· avg tool-call latency {contract.operationalSignals.toolCallLatencyMs} ms</li>
              <li>· tool failure rate {contract.operationalSignals.toolFailureRate}%</li>
              <li>· approvals pending {pendingApprovals}</li>
              <li>· blocked actions {contract.operationalSignals.blockedActionCount} · rollback events {contract.operationalSignals.rollbackEvents}</li>
            </ul>
          </div>
          <div>
            <p className="stat-label mb-1">→ Govern (evidence &amp; findings)</p>
            <ul className="space-y-0.5 text-[12px] text-slatey-400">
              {(contract.governanceFindings.length ? contract.governanceFindings : ["No agent findings (not enabled for this initiative)"]).map((f, i) => <li key={i}>· {f}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-3"><p className="stat-label mb-1.5 flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Rollback options</p>
          <div className="flex flex-wrap gap-1.5">{AGENT_ROLLBACK_OPTIONS.map((o) => <Badge key={o} tone="slate">{o}</Badge>)}</div></div>
      </Panel>

      {/* 10 + 11 — demonstrates + simulation boundary */}
      <Panel>
        <SectionHeader eyebrow="For reviewers" title="What this agent layer demonstrates" icon={Info} />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-300">
          This layer shows how agentic AI should be operationalized in the enterprise. The system can retrieve, draft, summarize, and
          recommend, but high-risk actions are approved, restricted, or blocked. Every tool call becomes evidence for Operate and Govern.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard tone="info" title="Scoped tool access">Every tool has a schema, allowed roles, and a risk level.</InsightCard>
          <InsightCard tone="info" title="Permission boundaries">Assist, draft, and recommend — high-risk actions need approval or are blocked.</InsightCard>
          <InsightCard tone="success" title="Human approval gates">Risky actions route to a human before any effect.</InsightCard>
          <InsightCard tone="success" title="Tool misuse evaluation">Agent behavior is evaluated like RAG answers.</InsightCard>
          <InsightCard tone="warn" title="Auditability & rollback">Every call is logged; every action has a rollback path.</InsightCard>
          <InsightCard tone="warn" title="Ops & governance handoff">Tool telemetry and evidence flow into Operate and Govern.</InsightCard>
        </div>
        <div className="mt-4 rounded-lg border border-line bg-slate-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">Agent simulation boundary</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slatey-400">
            This portfolio demo does not call real external systems. Tool schemas, traces, approvals, and rollback paths are deterministic
            simulations that show enterprise agent-control mechanics. In production these contracts could map to real APIs, workflow engines,
            ticketing systems, CRM tools, or policy engines. No real external action is ever executed here.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function Boundary({ title, tone, icon, items }: { title: string; tone: "emerald" | "amber" | "rose"; icon: React.ReactNode; items: string[] }) {
  const border = tone === "emerald" ? "border-emerald-300" : tone === "amber" ? "border-amber-300" : "border-rose-300";
  return (
    <div className={cn("rounded-xl border bg-white p-4", border)}>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"><Badge tone={tone}>{title}</Badge></p>
      <ul className="space-y-1 text-[12px] text-slatey-300">{items.map((x) => <li key={x} className="flex gap-1.5"><span className={tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-rose-600"}>{icon}</span>{x}</li>)}</ul>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-line bg-white p-3"><p className="stat-label">{label}</p><p className="text-xl font-semibold text-ink">{value}</p></div>;
}
