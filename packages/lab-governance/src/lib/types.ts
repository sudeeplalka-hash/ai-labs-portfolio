export interface UseCase {
  id: string;
  name: string;
  description: string;
  business_function: string;
  owner: string;
  owner_email: string;
  ai_model: string;
  deployment_context: string;
  data_sensitivity: string;
  human_oversight: string;
  use_case_type: string;
  risk_score: number;
  risk_tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_drivers: string[];
  required_controls: string[];
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  action: string;
  version: string;
  enabled: boolean;
  applies_to: string[];
  conditions: Record<string, unknown>;
  body_yaml: string;
  tags: string[];
  match_count: number;
  frameworks?: { nist_ai_rmf?: string[]; eu_ai_act?: string[]; iso_42001?: string[] };
}

export interface GuardrailResult {
  guardrail_name: string;
  guardrail_type: string;
  triggered: boolean;
  action: string;
  severity: string;
  confidence: number;
  reason?: string;
  matched_patterns: string[];
  redacted_content?: string;
  rewritten_content?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceStep {
  step: number;
  name: string;
  status: string;
  action?: string;
  duration_ms: number;
  details?: string;
}

export interface PlaygroundResponse {
  prompt_event_id: string;
  decision: string;
  decision_reason: string;
  severity: string;
  confidence: number;
  triggered_policies: string[];
  policy_version: string;
  original_prompt: string;
  final_response: string;
  guardrail_results: GuardrailResult[];
  trace: TraceStep[];
  risk_score: number;
  risk_level: string;
  audit_event_id: string;
  review_item_id?: string;
  latency_ms: number;
  created_at: string;
  model_provider?: string;
}

export interface ReviewItem {
  id: string;
  prompt_event_id: string;
  use_case_id: string;
  escalation_reason: string;
  severity: string;
  priority: string;
  status: string;
  assigned_to?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  edited_response?: string;
  original_prompt: string;
  original_decision: string;
  triggered_guardrails: string[];
  sla_hours: number;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface EvalSuite {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  case_count: number;
  last_run_at?: string;
  last_run_pass_rate?: number;
  created_at: string;
}

export interface EvalResult {
  id: string;
  run_id: string;
  case_id: string;
  status: string;
  actual_decision?: string;
  expected_decision: string;
  actual_guardrail?: string;
  expected_guardrail?: string;
  error_message?: string;
  details: Record<string, unknown>;
  latency_ms: number;
}

export interface EvalRun {
  id: string;
  suite_id: string;
  status: string;
  total_cases: number;
  passed: number;
  failed: number;
  errors: number;
  pass_rate: number;
  false_positives: number;
  false_negatives: number;
  duration_ms: number;
  started_at: string;
  completed_at?: string;
  results: EvalResult[];
}

export interface EvidenceReport {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  generated_by: string;
  status: string;
  content_markdown: string;
  completeness_score: number;
  sections: string[];
  use_case_count: number;
  policy_count: number;
  prompt_event_count: number;
  eval_run_count: number;
  review_item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExecutiveMetrics {
  total_use_cases: number;
  active_use_cases: number;
  critical_use_cases: number;
  high_risk_use_cases: number;
  total_prompt_events: number;
  blocked_events: number;
  escalated_events: number;
  pending_reviews: number;
  overdue_reviews: number;
  active_policies: number;
  guardrail_trigger_rate: number;
  avg_risk_score: number;
  risk_distribution: { tier: string; count: number; percentage: number }[];
  decision_breakdown: { decision: string; count: number; percentage: number }[];
  business_function_risk: { function: string; avg_risk_score: number; use_case_count: number; risk_tier: string }[];
  guardrail_trend: { date: string; triggered: number; total: number }[];
  recent_high_risk_events: { id: string; prompt_excerpt: string; decision: string; severity: string; use_case_id: string; created_at: string }[];
  value_metrics: ValueMetrics;
}

export interface ValueMetrics {
  auto_contained_rate: number;
  automated_actions: number;
  human_escalations: number;
  avg_time_to_review_hours: number;
  review_hours_saved: number;
  launch_readiness_pct: number;
  frameworks_covered: string[];
}

export interface AuditEvent {
  id: string;
  event_type: string;
  actor: string;
  use_case_id?: string;
  prompt_event_id?: string;
  resource_type: string;
  resource_id: string;
  action: string;
  outcome: string;
  details: Record<string, unknown>;
  created_at: string;
  prev_hash?: string;
  entry_hash?: string;
}

export interface AuditVerify {
  valid: boolean;
  total_events: number;
  broken_at?: string | null;
  tip_hash?: string | null;
  algorithm: string;
}

export interface EvalCaseDiff {
  case_id: string;
  expected_decision: string;
  baseline_decision?: string;
  candidate_decision?: string;
  baseline_status: string;
  candidate_status: string;
  changed: boolean;
  regressed: boolean;
  improved: boolean;
}

export interface EvalCompare {
  baseline_run_id: string;
  candidate_run_id: string;
  baseline_policy_version?: string;
  candidate_policy_version?: string;
  baseline_pass_rate: number;
  candidate_pass_rate: number;
  pass_rate_delta: number;
  cases_compared: number;
  changed: number;
  regressed: number;
  improved: number;
  cases: EvalCaseDiff[];
}

export interface PromptEvent {
  id: string;
  use_case_id: string;
  prompt: string;
  decision: string;
  severity: string;
  risk_score: number;
  risk_level: string;
  confidence: number;
  audit_status: string;
  review_status: string;
  latency_ms: number;
  created_at: string;
}
