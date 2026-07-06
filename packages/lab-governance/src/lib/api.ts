/**
 * API client.
 *
 * Two modes, selected at build time:
 *   • Live (default): relative /api/* calls proxied to the FastAPI backend
 *     (Next rewrites in dev, Netlify _redirects in prod).
 *   • Static demo (NEXT_PUBLIC_STATIC_DEMO=1): everything is served from an
 *     embedded snapshot + the in-browser governance engine, so the site is a
 *     fully self-contained static deploy with no backend required.
 */
import demoRaw from './demo-data.json';
import * as gov from './governance';
import { generateLive } from './llm';
import type {
  ExecutiveMetrics, UseCase, Policy, PlaygroundResponse, EvalSuite, EvalRun,
  EvalResult, AuditEvent, PromptEvent, ReviewItem, EvidenceReport, AuditVerify, EvalCompare,
} from './types';

const STATIC = process.env.NEXT_PUBLIC_STATIC_DEMO === '1';
// Multi-Zones: the FastAPI governance service runs separately, so point the live
// client at it (NEXT_PUBLIC_API_URL, e.g. http://localhost:8000). Empty = same-origin.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const qstr = (params?: Record<string, unknown>) =>
  params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';

// ─────────────────────────── Live backend client ───────────────────────────
const liveApi = {
  metrics: { executive: () => request<ExecutiveMetrics>('/api/metrics/executive') },
  useCases: {
    list: () => request<UseCase[]>('/api/use cases'),
    get: (id: string) => request<UseCase>(`/api/use cases/${id}`),
    create: (data: unknown) => request<UseCase>('/api/use cases', { method: 'POST', body: JSON.stringify(data) }),
    rescore: (id: string) => request<UseCase>(`/api/use cases/${id}/rescore`, { method: 'POST' }),
  },
  policies: {
    list: (params?: { category?: string; severity?: string; enabled?: boolean }) => request<Policy[]>(`/api/policies${qstr(params)}`),
    get: (id: string) => request<Policy>(`/api/policies/${id}`),
    toggle: (id: string) => request<{ id: string; enabled: boolean }>(`/api/policies/${id}/toggle`, { method: 'PATCH' }),
  },
  playground: {
    run: (data: { use_case_id: string; prompt: string; session_id?: string }) =>
      request<PlaygroundResponse>('/api/playground/run', { method: 'POST', body: JSON.stringify(data) }),
  },
  evals: {
    suites: () => request<EvalSuite[]>('/api/evals/suites'),
    getSuite: (id: string) => request<EvalSuite>(`/api/evals/suites/${id}`),
    runSuite: (id: string) => request<EvalRun>(`/api/evals/suites/${id}/run`, { method: 'POST' }),
    runs: () => request<EvalRun[]>('/api/evals/runs'),
    compare: (suiteId: string) => request<EvalCompare>(`/api/evals/suites/${suiteId}/compare`),
  },
  audit: {
    events: (params?: { event_type?: string; action?: string; limit?: number }) => request<AuditEvent[]>(`/api/audit-logs/events${qstr(params)}`),
    promptEvents: (params?: { decision?: string; use_case_id?: string; limit?: number }) => request<PromptEvent[]>(`/api/audit-logs/prompt-events${qstr(params)}`),
    verify: () => request<AuditVerify>('/api/audit-logs/verify'),
  },
  reviewQueue: {
    list: (params?: { status?: string; severity?: string }) => request<ReviewItem[]>(`/api/review-queue${qstr(params)}`),
    get: (id: string) => request<ReviewItem>(`/api/review-queue/${id}`),
    action: (id: string, data: { action: string; reviewer: string; notes?: string; edited_response?: string }) =>
      request<ReviewItem>(`/api/review-queue/${id}/action`, { method: 'POST', body: JSON.stringify(data) }),
    stats: () => request<Record<string, number>>('/api/review-queue/stats/summary'),
  },
  evidence: {
    list: () => request<EvidenceReport[]>('/api/evidence'),
    get: (id: string) => request<EvidenceReport>(`/api/evidence/${id}`),
    create: (data: unknown) => request<EvidenceReport>('/api/evidence', { method: 'POST', body: JSON.stringify(data) }),
    downloadUrl: (id: string) => `/api/evidence/${id}/download`,
  },
};

// ─────────────────────────── Static demo client ────────────────────────────
interface DemoData {
  metrics: ExecutiveMetrics; useCases: UseCase[]; policies: Policy[];
  reviewQueue: ReviewItem[]; reviewStats: Record<string, number>;
  auditEvents: AuditEvent[]; auditVerify: AuditVerify; promptEvents: PromptEvent[]; evidence: EvidenceReport[];
  evalSuites: EvalSuite[];
  evalCases: Record<string, { prompt: string; expected_decision: string; expected_guardrail: string | null }[]>;
  sampleReport?: EvidenceReport;
}
const demo = demoRaw as unknown as DemoData;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const ucState: UseCase[] = clone(demo.useCases);
const policyState: Policy[] = clone(demo.policies);
const reviewState: ReviewItem[] = clone(demo.reviewQueue);
const evidenceState: EvidenceReport[] = demo.sampleReport ? [clone(demo.sampleReport), ...clone(demo.evidence)] : clone(demo.evidence);
const resolve = <T>(v: T): Promise<T> => Promise.resolve(v);

// Use case risk scoring (port of risk_scoring.score_use_case)
const SW = {
  data_sensitivity: { public: 0, internal: 0.08, confidential: 0.18, regulated: 0.28 } as Record<string, number>,
  deployment_context: { internal: 0.05, 'customer-facing': 0.16, agentic: 0.25 } as Record<string, number>,
  use_case_type: { classifier: 0.04, assistant: 0.08, rag: 0.12, agentic: 0.25 } as Record<string, number>,
  business_function: { Operations: 0.04, IT: 0.04, HR: 0.1, Customer: 0.12, Legal: 0.16, Finance: 0.2 } as Record<string, number>,
  human_oversight: { always: 0, required: 0.05, optional: 0.1, none: 0.24 } as Record<string, number>,
};
export function scoreUseCase(d: Record<string, string>): { score: number; tier: UseCase['risk_tier']; drivers: string[]; controls: string[] } {
  let s = 0;
  const drivers: string[] = [];
  const sens = d.data_sensitivity || 'internal'; s += SW.data_sensitivity[sens] ?? 0.08;
  if (sens === 'confidential' || sens === 'regulated') drivers.push(`Processes ${sens} data`);
  const dep = d.deployment_context || 'internal'; s += SW.deployment_context[dep] ?? 0.05;
  if (dep === 'customer-facing') drivers.push('Customer-facing exposure');
  if (dep === 'agentic') drivers.push('Autonomous (agentic) deployment');
  const ut = d.use_case_type || 'assistant'; s += SW.use_case_type[ut] ?? 0.08;
  if (ut === 'rag') drivers.push('Retrieval grounding introduces source-quality risk');
  if (ut === 'agentic') drivers.push('Tool-using agent expands the action surface');
  const bf = d.business_function || 'Operations'; const bw = SW.business_function[bf] ?? 0.04; s += bw;
  if (bw >= 0.16) drivers.push(`Regulated / high-sensitivity function: ${bf}`);
  const ov = d.human_oversight || 'optional'; s += SW.human_oversight[ov] ?? 0.1;
  if (ov === 'optional' || ov === 'none') drivers.push(`Limited human oversight (${ov})`);
  else drivers.push(`Human oversight reduces residual risk (${ov})`);
  const score = Math.round(Math.min(s, 1) * 1000) / 1000;
  const tier: UseCase['risk_tier'] = score >= 0.75 ? 'CRITICAL' : score >= 0.5 ? 'HIGH' : score >= 0.25 ? 'MEDIUM' : 'LOW';
  const controls = ['Audit Logging', 'Runtime Prompt Risk Scoring'];
  if (score >= 0.25) controls.push('Sensitive Data / PII Guardrail', 'Content Policy Enforcement');
  if (score >= 0.5) controls.push('Human Review Queue', 'Escalation Policy', 'Prompt Injection Guardrail');
  if (score >= 0.75) controls.push('Executive / CISO Sign-off', 'Quarterly Red-Team Eval');
  return { score, tier, drivers, controls: Array.from(new Set(controls)) };
}

const REVIEW_ACTIONS: Record<string, string> = {
  approve: 'approved', reject: 'rejected', false_positive: 'false_positive',
  escalate_compliance: 'escalated_to_compliance', request_context: 'in_review', edit_response: 'in_review',
};

function runSuiteStatic(suiteId: string): EvalRun {
  const suite = demo.evalSuites.find((s) => s.id === suiteId);
  const cases = suite ? demo.evalCases[suite.category] || [] : [];
  const dummy = { id: 'eval', business_function: 'Operations', use_case_type: 'assistant', risk_score: 0.3 };
  let passed = 0, failed = 0, fp = 0, fn = 0;
  const results: EvalResult[] = cases.map((cse, i) => {
    const raw = gov.mockResponse(cse.prompt);
    const gs = gov.runAllGuardrails(cse.prompt, raw, dummy);
    const { decision } = gov.resolveDecision(gs);
    const actualGuardrail = gs.find((g) => g.triggered)?.guardrail_type;
    const ok = decision === cse.expected_decision;
    if (ok) passed += 1; else {
      failed += 1;
      if (cse.expected_decision === 'ALLOW' && ['BLOCK', 'ESCALATE', 'REDACT'].includes(decision)) fp += 1;
      else if (['BLOCK', 'ESCALATE'].includes(cse.expected_decision) && decision === 'ALLOW') fn += 1;
    }
    return {
      id: `res-${suiteId}-${i}`, run_id: `run-${suiteId}`, case_id: `case-${i}`,
      status: ok ? 'pass' : 'fail', actual_decision: decision, expected_decision: cse.expected_decision,
      actual_guardrail: actualGuardrail, expected_guardrail: cse.expected_guardrail ?? undefined,
      details: { prompt_excerpt: cse.prompt.slice(0, 100) }, latency_ms: Math.round((1 + Math.random() * 5) * 10) / 10,
    };
  });
  const total = cases.length;
  const now = new Date().toISOString();
  return {
    id: `run-${suiteId}`, suite_id: suiteId, status: 'completed', total_cases: total,
    passed, failed, errors: 0, pass_rate: total ? Math.round((passed / total) * 1000) / 10 : 0,
    false_positives: fp, false_negatives: fn, duration_ms: Math.round((total * 3 + Math.random() * 20) * 10) / 10,
    started_at: now, completed_at: now, results,
  };
}

function compareStatic(suiteId: string): EvalCompare {
  const a = runSuiteStatic(suiteId);
  const b = runSuiteStatic(suiteId);
  const byCase = (r: EvalRun) => Object.fromEntries(r.results.map((x) => [x.case_id, x]));
  const ra = byCase(a), rb = byCase(b);
  let changed = 0, regressed = 0, improved = 0;
  const cases = a.results.map((x) => {
    const da = ra[x.case_id], db_ = rb[x.case_id];
    const ch = da.actual_decision !== db_.actual_decision;
    const reg = da.status === 'pass' && db_.status === 'fail';
    const imp = da.status === 'fail' && db_.status === 'pass';
    if (ch) changed += 1; if (reg) regressed += 1; if (imp) improved += 1;
    return {
      case_id: x.case_id, expected_decision: x.expected_decision,
      baseline_decision: da.actual_decision, candidate_decision: db_.actual_decision,
      baseline_status: da.status, candidate_status: db_.status, changed: ch, regressed: reg, improved: imp,
    };
  });
  return {
    baseline_run_id: a.id, candidate_run_id: b.id, baseline_policy_version: '1.0.0', candidate_policy_version: '1.0.0',
    baseline_pass_rate: a.pass_rate, candidate_pass_rate: b.pass_rate,
    pass_rate_delta: Math.round((b.pass_rate - a.pass_rate) * 10) / 10,
    cases_compared: cases.length, changed, regressed, improved, cases,
  };
}

const staticApi: typeof liveApi = {
  metrics: { executive: () => resolve(demo.metrics) },
  useCases: {
    list: () => resolve(ucState),
    get: (id: string) => resolve(ucState.find((u) => u.id === id) as UseCase),
    create: (data: unknown) => {
      const d = (data || {}) as Record<string, string>;
      const { score, tier, drivers, controls } = scoreUseCase(d);
      const now = new Date().toISOString();
      const uc: UseCase = {
        id: `uc-${Date.now()}`, name: d.name || 'New AI Use Case', description: d.description || '',
        business_function: d.business_function || 'Operations', owner: d.owner || 'Unassigned',
        owner_email: d.owner_email || 'owner@corp.example.com', ai_model: d.ai_model || 'gpt-4o-mini',
        deployment_context: d.deployment_context || 'internal', data_sensitivity: d.data_sensitivity || 'internal',
        human_oversight: d.human_oversight || 'optional', use_case_type: d.use_case_type || 'assistant',
        risk_score: score, risk_tier: tier, risk_drivers: drivers, required_controls: controls,
        status: d.status || 'active', created_at: now, updated_at: now,
      };
      ucState.push(uc);
      return resolve(uc);
    },
    rescore: (id: string) => {
      const uc = ucState.find((u) => u.id === id);
      if (uc) { const r = scoreUseCase(uc as unknown as Record<string, string>); uc.risk_score = r.score; uc.risk_tier = r.tier; uc.risk_drivers = r.drivers; uc.required_controls = r.controls; }
      return resolve(uc as UseCase);
    },
  },
  policies: {
    list: (params?: { category?: string; severity?: string; enabled?: boolean }) => resolve(
      policyState.filter((p) => (!params?.category || p.category === params.category) && (!params?.severity || p.severity === params.severity) && (params?.enabled === undefined || p.enabled === params.enabled)),
    ),
    get: (id: string) => resolve(policyState.find((p) => p.id === id) as Policy),
    toggle: (id: string) => { const p = policyState.find((x) => x.id === id); if (p) p.enabled = !p.enabled; return resolve({ id, enabled: !!p?.enabled }); },
  },
  playground: {
    run: async (data: { use_case_id: string; prompt: string; session_id?: string }) => {
      const uc = ucState.find((u) => u.id === data.use_case_id) || ucState[0];
      const live = await generateLive(data.prompt);
      const res = gov.runGovernance(data.prompt, uc, live ?? undefined);
      if (res.review_item_id) {
        const now = new Date().toISOString();
        reviewState.unshift({
          id: res.review_item_id, prompt_event_id: res.prompt_event_id, use_case_id: uc.id,
          escalation_reason: res.decision_reason, severity: res.severity, priority: res.severity === 'critical' ? 'urgent' : 'high',
          status: 'pending', assigned_to: 'reviewer@corp.example.com', original_prompt: data.prompt,
          original_decision: res.decision, triggered_guardrails: res.guardrail_results.filter((g) => g.triggered).map((g) => g.guardrail_type),
          sla_hours: res.severity === 'critical' ? 4 : 24, sla_deadline: now, created_at: now, updated_at: now,
        });
      }
      return resolve(res);
    },
  },
  evals: {
    suites: () => resolve(demo.evalSuites),
    getSuite: (id: string) => resolve(demo.evalSuites.find((s) => s.id === id) as EvalSuite),
    runSuite: (id: string) => resolve(runSuiteStatic(id)),
    runs: () => resolve([]),
    compare: (suiteId: string) => resolve(compareStatic(suiteId)),
  },
  audit: {
    events: () => resolve(demo.auditEvents),
    promptEvents: (params?: { decision?: string; use_case_id?: string; limit?: number }) => resolve(
      demo.promptEvents.filter((e) => (!params?.decision || e.decision === params.decision) && (!params?.use_case_id || e.use_case_id === params.use_case_id)),
    ),
    verify: () => resolve(demo.auditVerify),
  },
  reviewQueue: {
    list: (params?: { status?: string; severity?: string }) => resolve(
      reviewState.filter((r) => (!params?.status || r.status === params.status) && (!params?.severity || r.severity === params.severity)),
    ),
    get: (id: string) => resolve(reviewState.find((r) => r.id === id) as ReviewItem),
    action: (id: string, data: { action: string; reviewer: string; notes?: string; edited_response?: string }) => {
      const r = reviewState.find((x) => x.id === id);
      if (r) { r.status = REVIEW_ACTIONS[data.action] || r.status; r.reviewed_by = data.reviewer; r.reviewed_at = new Date().toISOString(); r.reviewer_notes = data.notes; if (data.edited_response) r.edited_response = data.edited_response; }
      return resolve(r as ReviewItem);
    },
    stats: () => resolve(demo.reviewStats),
  },
  evidence: {
    list: () => resolve(evidenceState),
    get: (id: string) => resolve(evidenceState.find((r) => r.id === id) as EvidenceReport),
    create: (data: unknown) => {
      const d = (data || {}) as { title?: string; generated_by?: string };
      const now = new Date().toISOString();
      const rep: EvidenceReport = {
        id: `rep-${Date.now()}`, title: d.title || 'AI Governance Evidence Report', period_start: now, period_end: now,
        generated_by: d.generated_by || 'Demo User', status: 'draft',
        content_markdown: demo.sampleReport?.content_markdown || '# AI Governance Evidence Report\n\nGenerated in static demo mode.',
        completeness_score: 100, sections: ['risk_posture', 'policies', 'runtime', 'evals', 'human_review', 'audit'],
        use_case_count: ucState.length, policy_count: policyState.length, prompt_event_count: demo.promptEvents.length,
        eval_run_count: demo.evalSuites.length, review_item_count: reviewState.length, created_at: now, updated_at: now,
      };
      evidenceState.unshift(rep);
      return resolve(rep);
    },
    downloadUrl: (id: string) => {
      const rep = evidenceState.find((r) => r.id === id);
      return rep ? `data:text/markdown;charset=utf-8,${encodeURIComponent(rep.content_markdown)}` : '#';
    },
  },
};

export const api = STATIC ? staticApi : liveApi;
