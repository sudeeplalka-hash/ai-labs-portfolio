'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DecisionSummary, Provenance } from '@labs/design-system';
import { api } from '@gov/lib/api';
import type { ExecutiveMetrics } from '@gov/lib/types';
import { MetricCard } from '@gov/components/shared/MetricCard';
import { ActivityTicker } from '@gov/components/dashboard/ActivityTicker';
import { RiskBadge, DecisionBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { riskScoreColor, formatDateTime } from '@gov/lib/utils';
import { caseHref } from '@gov/lib/navigation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Shield, AlertTriangle, Users, Activity, CheckCircle,
  XCircle, Clock, TrendingUp, Sparkles, ArrowRight
} from 'lucide-react';

const PIE_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
};

export default function ExecutiveCockpit() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setError('');
    api.metrics.executive().then((next) => { if (current) setMetrics(next); }).catch(() => { if (current) setError('The governance metrics could not load. Retry to request them again.'); });
    return () => { current = false; };
  }, [attempt]);

  if (error) return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}<button className="ml-3 rounded-lg border border-red-300 px-3 py-2 font-semibold" onClick={() => setAttempt((value) => value + 1)}>Retry metrics</button></div>
  );
  if (!metrics) return <LoadingSpinner label="Loading governance dashboard..." />;
  const verdict = metrics.overdue_reviews > 0 ? `Prioritize ${metrics.overdue_reviews} overdue reviews` : metrics.critical_use_cases > 0 ? `Inspect controls for ${metrics.critical_use_cases} critical-risk cases` : metrics.pending_reviews > 0 ? `Triage ${metrics.pending_reviews} pending reviews` : 'Check evidence coverage before release';
  const nextHref = metrics.overdue_reviews > 0 || metrics.pending_reviews > 0 ? '/govern/review-queue' : metrics.critical_use_cases > 0 ? '/govern/risk' : '/govern/evidence';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Executive Cockpit</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">AI Governance Posture</h2>
        <p className="text-sm text-slate-500 mt-1">Portfolio view of AI risk, policy coverage, and governance controls</p>
      </div>

      <Provenance mode={process.env.NEXT_PUBLIC_STATIC_DEMO === '1' ? 'Embedded sample registry' : 'Governance API snapshot'} input={`${metrics.total_use_cases} registered use cases in this dashboard`} method="Risk tiers, recorded guardrail decisions and review status" note={process.env.NEXT_PUBLIC_STATIC_DEMO === '1' ? "These dashboard counts are an embedded snapshot and do not recalculate after browser-session case, policy or review changes. Review the actual case and queue records for those changes. Estimates do not certify deployment approval." : "This registry summarizes its own records, separately from the current program's release gate. Estimated savings and readiness percentages do not certify deployment approval."} />
      <DecisionSummary label="Registry triage" title={verdict} tone={metrics.overdue_reviews > 0 || metrics.critical_use_cases > 0 ? 'caution' : 'neutral'} explanation="Use the review queue for unresolved decisions, inspect the case's policies, and follow its evaluation and evidence records before changing its status." metrics={[
        { label: 'Overdue reviews', value: metrics.overdue_reviews },
        { label: 'Critical-risk cases', value: metrics.critical_use_cases },
        { label: 'Pending reviews', value: metrics.pending_reviews },
      ]} nextAction={<Link className="font-semibold underline" href={nextHref}>Open the next required review</Link>}>
        <nav aria-label="Governance investigation path" className="mt-4 flex flex-wrap gap-2 text-sm">
          {[['Cases and risk', '/govern/use-cases'], ['Required policies', '/govern/policies'], ['Evaluation results', '/govern/evals'], ['Human review', '/govern/review-queue'], ['Evidence', '/govern/evidence']].map(([label, href]) => <Link key={href} href={href} className="rounded-lg border border-line px-3 py-2 text-primary">{label}</Link>)}
        </nav>
      </DecisionSummary>

      {/* First-time entry point */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-sky-400 flex items-center justify-center text-white shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Explore a guardrail decision</p>
            <p className="text-xs text-slate-500 mt-0.5">Compare the same sample request before and after modeled controls.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/govern/live" className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            Open worked example <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Business value & containment strip */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Governance Value &amp; Containment</p>
          <div className="flex gap-1.5 flex-wrap">
            {metrics.value_metrics.frameworks_covered.map((fw) => (
              <span key={fw} className="text-[10px] font-medium bg-white/10 border border-white/15 rounded px-2 py-0.5">{fw}</span>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ValueTile label="Auto-Contained" value={`${metrics.value_metrics.auto_contained_rate}%`} sub="snapshot interactions assigned automatic action" />
          <ValueTile label="Automated Actions" value={metrics.value_metrics.automated_actions} sub="block / redact / rewrite / confirm" />
          <ValueTile label="Human Escalations" value={metrics.value_metrics.human_escalations} sub="routed to a reviewer" />
          <ValueTile label="Review Hours Saved" value={`~${metrics.value_metrics.review_hours_saved}h`} sub="est. manual review avoided" />
          <ValueTile label="Launch Readiness" value={`${metrics.value_metrics.launch_readiness_pct}%`} sub="use cases meeting control bar" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active AI Use Cases" value={metrics.active_use_cases} sub={`${metrics.total_use_cases} total registered`} icon={Activity}
          tooltip="Use cases marked active in this dashboard snapshot. This is a recorded registry status, not observed production usage. Browser-session changes are shown in the case registry, not recomputed in this embedded metric." />
        <MetricCard label="Critical Risk Use Cases" value={metrics.critical_use_cases} sub={`${metrics.high_risk_use_cases} high risk`} icon={AlertTriangle} color="red"
          tooltip="Use cases assigned the Critical tier in this snapshot by the deterministic risk model. The tier reflects recorded sensitivity, context, autonomy and oversight; it is a triage signal, not an observed incident count." />
        <MetricCard label="Pending Reviews" value={metrics.pending_reviews} sub={`${metrics.overdue_reviews} overdue`} icon={Clock} color={metrics.overdue_reviews > 0 ? 'amber' : 'default'}
          tooltip="Pending and overdue review counts recorded in this dashboard snapshot. Open the review queue for current browser-session actions; resolving a review does not recalculate this embedded dashboard." />
        <MetricCard label="Guardrail Trigger Rate" value={`${metrics.guardrail_trigger_rate}%`} sub={`${metrics.total_prompt_events} total requests`} icon={Shield}
          tooltip="The recorded share of prompt events that triggered a guardrail in this snapshot. It does not measure detector accuracy, prevented harm, or production coverage. The browser example uses fixed local detectors." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Enabled Policies (snapshot)" value={metrics.active_policies} icon={CheckCircle} color="green"
          tooltip="Policies recorded as enabled in this dashboard snapshot. In the static browser example, policy toggles change configuration records but do not reconfigure the fixed Playground detectors. This count does not certify runtime enforcement." />
        <MetricCard label="Blocked Requests" value={metrics.blocked_events} icon={XCircle} color="red"
          tooltip="Prompt events assigned BLOCK in the recorded snapshot. A modeled block demonstrates a decision path; the count is not proof that a production system prevented harm." />
        <MetricCard label="Escalated for Review" value={metrics.escalated_events} icon={Users} color="amber"
          tooltip="Prompt events assigned human escalation in this snapshot. Follow a recorded event into the review queue to inspect its actual review status and decision." />
        <MetricCard label="Avg Risk Score" value={metrics.avg_risk_score.toFixed(2)} sub="across all use cases" icon={TrendingUp} color={metrics.avg_risk_score >= 0.5 ? 'amber' : 'green'}
          tooltip="The mean modeled risk score across use cases in this snapshot, on a 0 to 1 scale. It summarizes their recorded attributes; it is not an observed probability of harm." />
      </div>

      <ActivityTicker />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Tier Distribution</h3>
          <div role="img" aria-label="Pie chart: distribution of AI use cases by risk tier">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie isAnimationActive={false} data={metrics.risk_distribution} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={70} label={({ tier, percentage }) => `${tier} ${percentage}%`} labelLine={false}>
                {metrics.risk_distribution.map((entry) => (
                  <Cell key={entry.tier} fill={PIE_COLORS[entry.tier] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Decision Breakdown</h3>
          <div role="img" aria-label="Chart: breakdown of governance decisions">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.decision_breakdown} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="decision" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} requests`]} />
              <Bar isAnimationActive={false} dataKey="count" fill="#1f6fc4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Guardrail Trend */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">7-Day Guardrail Activity</h3>
          <div role="img" aria-label="Line chart: guardrail activity over the last 7 days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.guardrail_trend}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line isAnimationActive={false} type="monotone" dataKey="total" stroke="#64748b" dot={false} name="Total" strokeWidth={1} />
              <Line isAnimationActive={false} type="monotone" dataKey="triggered" stroke="#c2410c" dot={false} name="Triggered" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer py-1 font-semibold">Read chart values</summary>
        <div className="mt-3 grid gap-5 md:grid-cols-3">
          <dl><dt className="mb-2 font-semibold">Risk distribution</dt>{metrics.risk_distribution.map((entry) => <dd key={entry.tier} className="py-1 text-sm">{entry.tier}: {entry.count} cases ({entry.percentage}%)</dd>)}</dl>
          <dl><dt className="mb-2 font-semibold">Decisions</dt>{metrics.decision_breakdown.map((entry) => <dd key={entry.decision} className="py-1 text-sm">{entry.decision.replaceAll('_', ' ')}: {entry.count} requests</dd>)}</dl>
          <dl><dt className="mb-2 font-semibold">Recorded daily activity</dt>{metrics.guardrail_trend.map((entry) => <dd key={entry.date} className="py-1 text-sm">{entry.date}: {entry.triggered} triggered / {entry.total} total</dd>)}</dl>
        </div>
      </details>

      {/* Business Function Risk + Recent High Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Function Risk */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk by Business Function</h3>
          <div className="space-y-3">
            {metrics.business_function_risk.map((bf) => (
              <div key={bf.function} className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-700 w-24 shrink-0">{bf.function}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${bf.avg_risk_score * 100}%`,
                      backgroundColor: bf.avg_risk_score >= 0.75 ? '#ef4444' : bf.avg_risk_score >= 0.5 ? '#f97316' : bf.avg_risk_score >= 0.25 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
                <span className={`text-xs font-mono font-semibold w-10 text-right ${riskScoreColor(bf.avg_risk_score)}`}>
                  {bf.avg_risk_score.toFixed(2)}
                </span>
                <RiskBadge tier={bf.risk_tier} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent High risk Events */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent High risk Events</h3>
          {metrics.recent_high_risk_events.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No high risk events in this period</p>
          ) : (
            <div className="space-y-3">
              {metrics.recent_high_risk_events.map((ev) => (
                <div key={ev.id} className="flex gap-3 items-start py-2 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 font-medium">{ev.prompt_excerpt}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ev.created_at ? formatDateTime(ev.created_at) : 'N/A'}</p>
                    <Link href={caseHref(ev.use_case_id)} className="mt-2 inline-block rounded py-1 text-xs font-semibold text-primary underline">Open originating case</Link>
                  </div>
                  <DecisionBadge decision={ev.decision} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValueTile({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-0.5 text-white">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</p>
    </div>
  );
}
