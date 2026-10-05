import type { AuditVerify, EvidenceReport, Policy, PromptEvent, ReviewItem, UseCase } from './types';

interface EvidenceInput { title?: string; generated_by?: string; period_start?: string; period_end?: string; sections?: string[]; }
interface EvidenceSources { useCases: UseCase[]; policies: Policy[]; events: PromptEvent[]; reviews: ReviewItem[]; audit: AuditVerify; }
const SECTIONS = ['risk_posture', 'policies', 'runtime', 'evals', 'human_review', 'audit'];

/** A traceable browser snapshot, not an assertion of audit approval. */
export function buildEvidenceReport(input: EvidenceInput, sources: EvidenceSources, now: string): EvidenceReport {
  const start = input.period_start || now;
  const end = input.period_end || now;
  if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(start) > Date.parse(end)) throw new Error('Choose a valid reporting period.');
  const within = (date: string) => Date.parse(date) >= Date.parse(start) && Date.parse(date) <= Date.parse(end);
  const events = sources.events.filter(event => within(event.created_at));
  const reviews = sources.reviews.filter(review => within(review.created_at));
  const sections = (input.sections?.length ? input.sections : SECTIONS).filter(section => SECTIONS.includes(section));
  const available: Record<string, boolean> = { risk_posture: sources.useCases.length > 0, policies: sources.policies.length > 0, runtime: events.length > 0, evals: false, human_review: reviews.length > 0, audit: sources.audit.total_events > 0 };
  const coverage = sections.length ? Math.round(sections.filter(section => available[section]).length / sections.length * 100) : 0;
  const title = input.title || 'AI Governance Evidence Snapshot';
  const lines = [`# ${title}`, '', `Generated: ${now}`, `Requested event/review period: ${start} to ${end}`, '', 'Execution: browser-session sample registry. Case and policy records are current snapshots; events and reviews are filtered by creation date. This document is not compliance certification or release approval.', '', `Section coverage: ${coverage}%. This counts sections with available records, not evidence quality or controls passed.`, 'Limitations: evaluation run history is not retained by this sample client. Audit integrity below is an embedded verification record, not a fresh hash check of browser-session changes.', ''];
  if (sections.includes('risk_posture')) lines.push('## Case risk and required controls', ...sources.useCases.flatMap(record => [`- ${record.name} | ID: ${record.id} | risk: ${record.risk_tier} (${record.risk_score}) | status: ${record.status}`, `  Required controls: ${record.required_controls.join('; ') || 'None recorded'}`, `  Case: /govern/use-cases?case=${encodeURIComponent(record.id)}`]), '');
  if (sections.includes('policies')) lines.push('## Policy configuration snapshot', ...sources.policies.map(policy => `- ${policy.id}: ${policy.name} | ${policy.enabled ? 'enabled' : 'disabled'} | action: ${policy.action}`), '');
  if (sections.includes('runtime')) lines.push('## Recorded events in requested period', ...(events.length ? events.map(event => `- ${event.id} | case ${event.use_case_id} | ${event.created_at} | ${event.decision} | audit: ${event.audit_status}`) : ['No events recorded in this period.']), '');
  if (sections.includes('evals')) lines.push('## Evaluation evidence', 'Missing: this client does not retain evaluation run history. Run and export an evaluation separately before claiming this section is complete.', '');
  if (sections.includes('human_review')) lines.push('## Reviews created in requested period', ...(reviews.length ? reviews.map(review => `- ${review.id} | case ${review.use_case_id} | event ${review.prompt_event_id} | status: ${review.status} | notes: ${review.reviewer_notes || 'None recorded'}`) : ['No review records in this period.']), '');
  if (sections.includes('audit')) lines.push('## Embedded audit verification record', `Sample chain: ${sources.audit.valid ? 'reported intact' : 'reported invalid'}, ${sources.audit.total_events} events.`, 'Browser-session records are not covered by this embedded verification result.', '');
  return { id: `rep-${now}`, title, period_start: start, period_end: end, generated_by: input.generated_by || 'Demo User', status: 'draft', content_markdown: lines.join('\n'), completeness_score: coverage, sections, use_case_count: sources.useCases.length, policy_count: sources.policies.length, prompt_event_count: events.length, eval_run_count: 0, review_item_count: reviews.length, created_at: now, updated_at: now, source_mode: 'browser-session snapshot', source_case_ids: sources.useCases.map(record => record.id), coverage_note: 'Sections containing records; not verification, certification or approval.' };
}
