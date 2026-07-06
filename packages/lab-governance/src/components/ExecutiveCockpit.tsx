'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@gov/lib/api';
import type { ExecutiveMetrics } from '@gov/lib/types';
import { MetricCard } from '@gov/components/shared/MetricCard';
import { ActivityTicker } from '@gov/components/dashboard/ActivityTicker';
import { RiskBadge, DecisionBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { riskScoreColor, formatDateTime } from '@gov/lib/utils';
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

  useEffect(() => {
    api.metrics.executive().then(setMetrics).catch(() => setError('Could not load metrics. Is the backend running?'));
  }, []);

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
  );
  if (!metrics) return <LoadingSpinner label="Loading governance dashboard..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Executive Cockpit</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">AI Governance Posture</h2>
        <p className="text-sm text-slate-500 mt-1">Portfolio view of AI risk, policy coverage, and governance controls</p>
      </div>

      {/* First-time entry point */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-sky-400 flex items-center justify-center text-white shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">New here? See governance actually work.</p>
            <p className="text-xs text-slate-500 mt-0.5">Watch an unguarded AI cause harm, then watch the control plane catch it.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/govern/live" className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            See it live <ArrowRight size={15} />
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <ValueTile label="Auto-Contained" value={`${metrics.value_metrics.auto_contained_rate}%`} sub="risky interactions handled without a human" />
          <ValueTile label="Automated Actions" value={metrics.value_metrics.automated_actions} sub="block / redact / rewrite / confirm" />
          <ValueTile label="Human Escalations" value={metrics.value_metrics.human_escalations} sub="routed to a reviewer" />
          <ValueTile label="Review Hours Saved" value={`~${metrics.value_metrics.review_hours_saved}h`} sub="est. manual review avoided" />
          <ValueTile label="Launch Readiness" value={`${metrics.value_metrics.launch_readiness_pct}%`} sub="use cases meeting control bar" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active AI Use Cases" value={metrics.active_use_cases} sub={`${metrics.total_use_cases} total registered`} icon={Activity}
          tooltip="The number of AI systems currently registered and in active use across the organization. It counts every use case onboarded to the governance program and not yet retired. It captures how much AI surface area you are actually responsible for governing." />
        <MetricCard label="Critical Risk Use Cases" value={metrics.critical_use_cases} sub={`${metrics.high_risk_use_cases} high risk`} icon={AlertTriangle} color="red"
          tooltip="How many active use cases fall into the Critical tier, the highest band in the risk model. Risk tier is computed from data sensitivity, deployment context, autonomy, business function, and human oversight. These are the systems that need the strongest controls and the most frequent review." />
        <MetricCard label="Pending Reviews" value={metrics.pending_reviews} sub={`${metrics.overdue_reviews} overdue`} icon={Clock} color={metrics.overdue_reviews > 0 ? 'amber' : 'default'}
          tooltip="Human review items waiting in the queue, with the count overdue past their SLA shown beneath. Items land here when a guardrail escalates a request or a scheduled review comes due. A growing or overdue queue signals that review capacity is not keeping up with activity." />
        <MetricCard label="Guardrail Trigger Rate" value={`${metrics.guardrail_trigger_rate}%`} sub={`${metrics.total_prompt_events} total requests`} icon={Shield}
          tooltip="The share of prompt events where a runtime guardrail fired, block, redact, rewrite, or confirm, out of all requests. It is triggered events divided by total prompt events over the period. A higher rate means more risky traffic is being caught and contained automatically." />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Policies" value={metrics.active_policies} icon={CheckCircle} color="green"
          tooltip="The number of governance policies currently enabled and enforced at runtime. Each policy is a rule, for example PII redaction or protected-class checks, that the guardrail engine applies to every request. More active policies means broader coverage, though they should be tuned to limit false positives." />
        <MetricCard label="Blocked Requests" value={metrics.blocked_events} icon={XCircle} color="red"
          tooltip="How many requests were fully blocked by a guardrail in this period. A block happens when a policy judges the request too risky to answer at all. It captures the hard stops, the clearest evidence the control plane is preventing harm." />
        <MetricCard label="Escalated for Review" value={metrics.escalated_events} icon={Users} color="amber"
          tooltip="Requests routed to a human reviewer rather than answered or blocked automatically. Escalation fires when a policy is uncertain or the stakes are high enough to need judgment. It captures where automation hands off to people." />
        <MetricCard label="Avg Risk Score" value={metrics.avg_risk_score.toFixed(2)} sub="across all use cases" icon={TrendingUp} color={metrics.avg_risk_score >= 0.5 ? 'amber' : 'green'}
          tooltip="The mean risk score across all registered use cases, on a 0 to 1 scale. Each use case is scored from its data sensitivity, deployment context, autonomy, business function, and oversight, then averaged. It is a single read on the overall risk posture of your AI portfolio." />
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
              <Pie data={metrics.risk_distribution} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={70} label={({ tier, percentage }) => `${tier} ${percentage}%`} labelLine={false}>
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
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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
              <Line type="monotone" dataKey="total" stroke="#94a3b8" dot={false} name="Total" strokeWidth={1} />
              <Line type="monotone" dataKey="triggered" stroke="#f97316" dot={false} name="Triggered" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Business Function Risk + Recent High Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Function Risk */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk by Business Function</h3>
          <div className="space-y-3">
            {metrics.business_function_risk.map((bf) => (
              <div key={bf.function} className="flex items-center gap-3">
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
                    <p className="text-xs text-slate-700 truncate font-medium">{ev.prompt_excerpt}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ev.created_at ? formatDateTime(ev.created_at) : 'N/A'}</p>
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
