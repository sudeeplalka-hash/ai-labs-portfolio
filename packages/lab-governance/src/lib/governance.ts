/**
 * Client side governance engine, a faithful TypeScript port of the backend
 * services (guardrails, decision precedence, risk scoring, mock model gateway).
 *
 * Used only in the static demo build (NEXT_PUBLIC_STATIC_DEMO=1) so the
 * Playground and Eval Lab run live in the browser with no backend. The patterns
 * mirror backend/app/services/guardrails.py exactly.
 */
import type { GuardrailResult, TraceStep, PlaygroundResponse } from './types';

type Rule = [RegExp, string];
const ci = (p: string) => new RegExp(p, 'i');

// 1. Prompt injection
const INJECTION: Rule[] = ([
  [String.raw`ignore\s+(all\s+|any\s+)?(previous|above|prior|earlier|system|your)\s+(instructions?|rules?|constraints?|guidelines?|prompts?)`, 'directive_override'],
  [String.raw`\bignore\s+above\b`, 'directive_override'],
  [String.raw`\b(jailbreak|dan\b|dan[\s_-]?mode|do\s+anything\s+now|developer\s+mode)\b`, 'jailbreak_attempt'],
  [String.raw`you\s+(are|will|must)\s+now\b`, 'persona_hijack'],
  [String.raw`\b(pretend|roleplay|act|imagine)\b.{0,40}(no\s+restrictions?|without\s+(restrictions?|limits?|rules?)|uncensored|no\s+rules?|no\s+limits?)`, 'uncensored_persona'],
  [String.raw`\b(no|without|free\s+of)\s+(restrictions?|rules?|guidelines?|filters?|limits?|safety|censorship|guardrails?)`, 'restriction_removal'],
  [String.raw`</?(system|user|assistant|instruction)>`, 'delimiter_injection'],
  [String.raw`forget\s+(everything|all|your|the)\s*(previous|prior|above|training|rules)?`, 'memory_wipe'],
  [String.raw`answer\s+(freely|without\s+restrictions?|anything)`, 'restriction_removal'],
  [String.raw`\[INST\]|\[/INST\]|\[SYS\]|<<SYS>>|<\|im_start\|>`, 'token_injection'],
  [String.raw`\b(reveal|show|expose|print|repeat|tell\s+me)\b.{0,25}(system\s+prompt|hidden\s+instructions?|your\s+instructions?|the\s+prompt)`, 'prompt_extraction'],
  [String.raw`\bbypass\s+.{0,25}(safety|filters?|guardrails?|controls?|restrictions?|compliance)`, 'safety_bypass'],
] as [string, string][]).map(([p, l]) => [ci(p), l]);

// 2. PII  [pattern, label, replacement]
const PII: [RegExp, string, string][] = ([
  [String.raw`\b\d{3}-\d{2}-\d{4}\b`, 'SSN', '[SSN REDACTED]'],
  [String.raw`\b4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b|\b5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b|\b3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}\b`, 'credit_card', '[CARD REDACTED]'],
  [String.raw`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`, 'email', '[EMAIL REDACTED]'],
  [String.raw`\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b`, 'phone', '[PHONE REDACTED]'],
  [String.raw`\b[A-Z]\d{8}\b|\b[A-Z]{2}\d{6,7}\b`, 'passport', '[PASSPORT REDACTED]'],
  [String.raw`\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19|20)\d{2}\b`, 'date_of_birth', '[DOB REDACTED]'],
] as [string, string, string][]).map(([p, l, r]) => [new RegExp(p, 'gi'), l, r]);

const CLAIMS: Rule[] = ([
  [String.raw`\b(definitely|absolutely|certainly|undoubtedly|surely|unquestionably)\b`, 'absolute_assertion'],
  [String.raw`\bguarantee\w*\b`, 'guarantee_claim'],
  [String.raw`\b(100\s*%|completely|totally)\s+(guaranteed|certain|sure|proven|correct)\b`, 'absolute_certainty'],
  [String.raw`\b(science|research|studies|study|data|experts?|evidence|statistics)\b.{0,20}\b(prove|proves|proven|show|shows|confirm|confirms|agree|agrees|clear|indicate|reveal)`, 'ungrounded_authority'],
  [String.raw`\b(well[\s-]?known|widely\s+accepted|it\s+is\s+a\s+fact|as\s+a\s+fact|common\s+knowledge)\b`, 'appeal_to_fact'],
  [String.raw`\b(always|never)\s+(will|won't|works?|fails?|exceeds?|succeeds?|happens?|true|false)\b`, 'absolute_frequency'],
  [String.raw`\bthe\s+(best|only|optimal|right|correct)\s+(method|approach|solution|way|answer|option|strategy)\b`, 'sole_authority_claim'],
  [String.raw`\b(works?\s+better|optimal\s+solution|best\s+and\s+only)\b`, 'superlative_claim'],
] as [string, string][]).map(([p, l]) => [ci(p), l]);

const FINANCIAL: Rule[] = ([
  [String.raw`\b(should\s+we\s+)?(approve|deny|reject|grant|increase|decline|raise)\b.{0,30}\b(credit|loan|line|limit|mortgage|application)`, 'credit_decision'],
  [String.raw`\b(credit\s+line|credit\s+limit|line\s+increase|loan\s+application|spending\s+limit)\b`, 'credit_decision'],
  [String.raw`\b(buy|buying|sell|selling|invest|investing|purchase|acquire|divest|allocate|move|shift|put)\b.{0,40}\b(stock|stocks|fund|funds|etf|etfs|bond|bonds|crypto|equit|portfolio|savings|securit|shares?)`, 'investment_advice'],
  [String.raw`\b(stock|fund|etf|bond|crypto|portfolio|equit|savings)\b.{0,40}\b(buy|sell|invest|allocate|for\s+better\s+returns?|for\s+maximum)`, 'investment_advice'],
  [String.raw`\bguarantee\w*\b.{0,20}\b(return|profit|income|yield|growth)`, 'guarantee_claim'],
  [String.raw`\b\d{1,3}\s*%\b.{0,20}\b(return|returns|growth|gain|yield|profit)`, 'return_promise'],
  [String.raw`\b(recommend|advise|suggest)\b.{0,30}\b(invest|buy|sell|stock|fund|portfolio|credit)`, 'investment_advice'],
  [String.raw`\b(tax\s+evasion|offshore\s+account|hide\s+.{0,20}(income|assets))\b`, 'regulatory_violation'],
] as [string, string][]).map(([p, l]) => [ci(p), l]);

// Tool actions [pattern, label, level]
const TOOLS: [RegExp, string, 'high' | 'medium'][] = ([
  [String.raw`\b(delete|drop|truncate|wipe|purge|erase)\b.{0,25}\b(all|the|entire|every|database|table|tables|records?|rows?|files?|customers?)\b`, 'destructive_data_action', 'high'],
  [String.raw`\b(transfer|wire|send|move|pay)\b.{0,25}\$?\s?[\d,]+(\.\d+)?\b`, 'financial_transfer', 'high'],
  [String.raw`\b(grant|give|assign|elevate|provision)\b.{0,30}\b(admin|root|superuser|privilege|permission|access)`, 'privilege_escalation', 'high'],
  [String.raw`\b(disable|bypass|override|turn\s+off|remove)\b.{0,25}\b(2fa|mfa|auth|authentication|security|access\s+control|encryption)`, 'security_bypass', 'high'],
  [String.raw`\b(upload|export|send|share|sync|push|transmit)\b.{0,40}\b(customer|client|personal|external|partner|third[\s-]?party|outside|sensitive|confidential|all\s+\w+\s+data)`, 'data_exfiltration', 'high'],
  [String.raw`\b(approve|process|issue|authorize)\b.{0,25}\b(refund|payment|chargeback|reimbursement)`, 'financial_action', 'high'],
  [String.raw`\b(close|suspend|terminate|deactivate|reopen|change)\b.{0,25}\b(account|case|status|record)`, 'account_change', 'high'],
  [String.raw`\b(account|case)\s+status\s+to\b|\bstatus\s+to\s+(closed|suspended|terminated|inactive|deactivated|active)\b`, 'account_change', 'high'],
  [String.raw`\b(email|notify|message|contact|reply\s+to)\b.{0,25}\b(customer|client)`, 'external_communication', 'medium'],
  [String.raw`\b(execute|run|eval)\b.{0,25}\b(script|code|command|shell|job|query)\b`, 'code_execution', 'medium'],
  [String.raw`\b(create|open|file|submit)\b.{0,20}\b(ticket|task|case|issue)\b`, 'workflow_action', 'medium'],
] as [string, string, 'high' | 'medium'][]).map(([p, l, lv]) => [ci(p), l, lv]);

const TOXICITY: Rule[] = ([
  [String.raw`\b(kill|murder|assassinate|eliminate)\s+(him|her|them|the|this|everyone)\b`, 'violence_threat'],
  [String.raw`\b(hate|despise|loathe)\s+(everyone|all|them|him|her|this|those|these|the)\b`, 'hostile_language'],
  [String.raw`\b(are|completely|totally|bunch\s+of|absolute|all)\b.{0,20}\b(idiots?|morons?|imbeciles?|incompetent|stupid|useless|worthless)\b`, 'abusive_language'],
  [String.raw`\b(incompetent|stupid|useless|worthless)\s+(idiots?|morons?|people|managers?|employees?|staff|team)\b`, 'abusive_language'],
  [String.raw`\ball\s+.{0,20}(corrupt|evil|liars?|criminals?|stupid|incompetent)\b`, 'abusive_language'],
  [String.raw`\b(racial|racist|sexist|bigot|homophobic)\s+(slur|joke|comment|remark)\b`, 'discriminatory_language'],
  [String.raw`\b(sexual|explicit|nsfw|nude|naked)\s+(content|image|photo|material)\b`, 'explicit_content'],
] as [string, string][]).map(([p, l]) => [ci(p), l]);

const PROTECTED = String.raw`(age|older|younger|elderly|women|woman|men|man|male|female|gender|sex|marital|married|single|pregnan|parental|maternity|race|racial|black|white|asian|hispanic|latin|religion|religious|christian|muslim|jewish|hindu|disab|nationality|immigration|visa|sexual\s+orientation|ethnicity|national\s+origin)`;
const BIAS: Rule[] = ([
  [String.raw`\b(discriminate|exclude|reject|avoid|deny|screen\s+out|filter\s+out|do\s+not\s+hire|don't\s+hire)\b.{0,40}` + PROTECTED, 'discriminatory_decision'],
  [String.raw`\b(rank|sort|score|prioritize|select|shortlist|favor|prefer)\b.{0,40}` + PROTECTED, 'protected_class_ranking'],
  [PROTECTED + String.raw`.{0,40}\b(preferential|favou?red|favoritism|always\s+(get|receive)|more\s+likely|less\s+likely|discriminat)`, 'protected_class_bias'],
  [String.raw`\b(most|least)\s+likely\b.{0,30}` + PROTECTED, 'protected_class_inference'],
] as [string, string][]).map(([p, l]) => [ci(p), l]);

const CITE_ABSENT = [
  String.raw`according\s+to\s+(studies|research|experts|reports)`,
  String.raw`(research|studies|data)\s+(show|suggest|indicate|prove)`,
  String.raw`it\s+(is\s+)?(well[\s-]?known|widely\s+accepted|established\s+that)`,
  String.raw`statistics\s+(show|indicate|reveal)`,
].map((p) => ci(p));
const CITE_PRESENT = [
  String.raw`\[(\d+|source|ref|citation)[^\]]*\]`,
  String.raw`\(source:`,
  String.raw`according\s+to\s+\[`,
  String.raw`https?://[^\s]+`,
  String.raw`\bref\s*\d+\b`,
].map((p) => ci(p));

const clean = (name: string, type: string): GuardrailResult => ({
  guardrail_name: name, guardrail_type: type, triggered: false,
  action: 'ALLOW', severity: 'info', confidence: 1.0, matched_patterns: [],
});
const uniq = (a: string[]) => Array.from(new Set(a)).sort();

const conf = (base: number, signals: number, per = 0.04, cap = 0.99) =>
  Math.round(Math.min(base + per * Math.max(0, signals - 1), cap) * 1000) / 1000;

function checkInjection(p: string): GuardrailResult {
  const m = uniq(INJECTION.filter(([r]) => r.test(p)).map(([, l]) => l));
  return m.length ? { guardrail_name: 'Prompt Injection Guardrail', guardrail_type: 'prompt_injection', triggered: true, action: 'BLOCK', severity: 'critical', confidence: conf(0.9, m.length), reason: `Detected prompt injection: ${m.join(', ')}`, matched_patterns: m } : clean('Prompt Injection Guardrail', 'prompt_injection');
}
function checkPII(p: string): GuardrailResult {
  const found: string[] = []; let red = p;
  for (const [r, label, repl] of PII) { if (new RegExp(r.source, 'i').test(p)) { found.push(label); red = red.replace(r, repl); } }
  return found.length ? { guardrail_name: 'Sensitive Data / PII Guardrail', guardrail_type: 'pii', triggered: true, action: 'REDACT', severity: 'high', confidence: conf(0.9, found.length), reason: `Detected sensitive data: ${found.join(', ')}`, matched_patterns: found, redacted_content: red } : clean('Sensitive Data / PII Guardrail', 'pii');
}
function checkClaims(t: string): GuardrailResult {
  const m = uniq(CLAIMS.filter(([r]) => r.test(t)).map(([, l]) => l));
  return m.length ? { guardrail_name: 'Unsupported Claims Guardrail', guardrail_type: 'unsupported_claims', triggered: true, action: 'ALLOW_WITH_DISCLAIMER', severity: 'medium', confidence: conf(0.7, m.length), reason: `Potentially ungrounded or overconfident claim: ${m.join(', ')}`, matched_patterns: m, rewritten_content: t + '\n\n- Advisory: This statement contains absolute or unsourced assertions and should be independently verified before it is relied upon.' } : clean('Unsupported Claims Guardrail', 'unsupported_claims');
}
function checkFinancial(p: string, isFinance: boolean): GuardrailResult {
  const m = uniq(FINANCIAL.filter(([r]) => r.test(p)).map(([, l]) => l));
  return m.length ? { guardrail_name: 'Regulated Financial Recommendation Guardrail', guardrail_type: 'financial', triggered: true, action: 'ESCALATE', severity: isFinance ? 'critical' : 'high', confidence: conf(0.8, m.length), reason: `Request involves a regulated financial decision or recommendation that requires human review: ${m.join(', ')}`, matched_patterns: m } : clean('Regulated Financial Recommendation Guardrail', 'financial');
}
function checkTool(p: string): GuardrailResult {
  const m: string[] = []; let high = false;
  for (const [r, label, lv] of TOOLS) { if (r.test(p)) { m.push(label); if (lv === 'high') high = true; } }
  if (!m.length) return clean('Tool Action Risk Guardrail', 'tool_risk');
  const crit = m.some((x) => ['destructive_data_action', 'security_bypass', 'privilege_escalation'].includes(x));
  const action = high ? 'ESCALATE' : 'REQUIRE_CONFIRMATION';
  const severity = high ? (crit ? 'critical' : 'high') : 'medium';
  return { guardrail_name: 'Tool Action Risk Guardrail', guardrail_type: 'tool_risk', triggered: true, action, severity, confidence: conf(0.82, uniq(m).length), reason: `High impact tool action detected: ${uniq(m).join(', ')}`, matched_patterns: uniq(m) };
}
function checkToxicity(p: string): GuardrailResult {
  const m = uniq(TOXICITY.filter(([r]) => r.test(p)).map(([, l]) => l));
  if (!m.length) return clean('Toxicity / Professional Conduct Guardrail', 'toxicity');
  const sev = m.includes('violence_threat') || m.includes('discriminatory_language') ? 'critical' : 'high';
  return { guardrail_name: 'Toxicity / Professional Conduct Guardrail', guardrail_type: 'toxicity', triggered: true, action: 'BLOCK', severity: sev, confidence: conf(0.85, m.length), reason: `Professional conduct policy violation: ${m.join(', ')}`, matched_patterns: m };
}
function checkBias(p: string): GuardrailResult {
  const m = uniq(BIAS.filter(([r]) => r.test(p)).map(([, l]) => l));
  return m.length ? { guardrail_name: 'Bias / Protected Class Guardrail', guardrail_type: 'bias', triggered: true, action: 'BLOCK', severity: 'critical', confidence: conf(0.85, m.length), reason: `Request seeks a decision or ranking based on a legally protected attribute: ${m.join(', ')}`, matched_patterns: m } : clean('Bias / Protected-Class Guardrail', 'bias');
}
function checkCitation(t: string, isRag: boolean): GuardrailResult {
  const hasClaim = CITE_ABSENT.some((r) => r.test(t));
  const hasCite = CITE_PRESENT.some((r) => r.test(t));
  return isRag && hasClaim && !hasCite ? { guardrail_name: 'Citation Required Guardrail', guardrail_type: 'citation', triggered: true, action: 'ALLOW_WITH_DISCLAIMER', severity: 'medium', confidence: 0.82, reason: 'RAG response makes factual claims without source citations.', matched_patterns: ['missing_citation'] } : clean('Citation Required Guardrail', 'citation');
}

export function runAllGuardrails(prompt: string, response: string, uc: { business_function?: string; use_case_type?: string }): GuardrailResult[] {
  const combined = `${prompt}\n${response}`;
  return [
    checkInjection(prompt), checkPII(prompt), checkToxicity(prompt), checkBias(prompt),
    checkFinancial(prompt, uc.business_function === 'Finance'), checkTool(prompt),
    checkClaims(combined), checkCitation(combined, uc.use_case_type === 'rag'),
  ];
}

const PRECEDENCE = ['ALLOW', 'LOG_ONLY', 'ALLOW_WITH_DISCLAIMER', 'REWRITE', 'REDACT', 'REQUIRE_CONFIRMATION', 'ESCALATE', 'BLOCK'];
const SEV_RANK: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

export function resolveDecision(gs: GuardrailResult[]): { decision: string; reason: string; severity: string; confidence: number } {
  const t = gs.filter((g) => g.triggered);
  if (!t.length) return { decision: 'ALLOW', reason: 'Request passed all governance checks and was allowed to proceed.', severity: 'info', confidence: 1.0 };
  const best = t.reduce((a, b) => (PRECEDENCE.indexOf(b.action) > PRECEDENCE.indexOf(a.action) ? b : a));
  const maxSev = t.reduce((a, b) => ((SEV_RANK[b.severity] ?? 0) > (SEV_RANK[a.severity] ?? 0) ? b : a));
  const reason = t.map((g) => g.reason).filter(Boolean).join(' | ') || best.action;
  const conf = t.reduce((s, g) => s + g.confidence, 0) / t.length;
  return { decision: best.action, reason, severity: maxSev.severity, confidence: Math.round(conf * 1000) / 1000 };
}

export function needsHumanReview(decision: string, severity: string): boolean {
  return decision === 'ESCALATE' || (decision === 'BLOCK' && severity === 'critical');
}

// Mock model gateway (port of model_gateway.py)
const MOCK: Record<string, string> = {
  finance: "Based on your portfolio's current allocation, the risk adjusted return on your equity positions appears within normal parameters. I recommend scheduling a review with your financial advisor to assess rebalancing opportunities.",
  hr: 'According to our HR policy documentation, employees are entitled to 15 days of paid time off annually. Additional leave types include medical leave and parental leave (16 weeks for primary caregivers). Please submit requests through the HR portal.',
  customer: "Thank you for reaching out. I've reviewed your account and can confirm your recent transaction was processed. If you're experiencing a billing discrepancy, I can initiate a formal dispute review, typically resolved within 5-7 business days.",
  rag: 'Based on the retrieved documents [Source: Policy Manual v3.2, Section 4.1], approval requires sign off from both the department head and the compliance officer for expenditures exceeding $50,000.',
  agentic: 'I have reviewed the requested workflow. To complete the task I will (1) query the dataset, (2) apply filters, (3) format output, and (4) send to the destination. Please confirm you want to proceed.',
  default: "I've processed your request. Based on the context provided, the recommended approach follows established best practices in this domain. Please review the details and let me know if you need clarification.",
};
function classify(p: string): string {
  const s = p.toLowerCase();
  if (/portfolio|invest|stock|fund|financial|asset|return/.test(s)) return 'finance';
  if (/employee|hr|leave|benefit|hire|onboard/.test(s)) return 'hr';
  if (/account|billing|charge|dispute|transaction|customer/.test(s)) return 'customer';
  if (/document|source|retrieve|knowledge|reference|policy/.test(s)) return 'rag';
  if (/execute|workflow|automate|task|action|tool|run/.test(s)) return 'agentic';
  return 'default';
}
export function mockResponse(p: string): string { return MOCK[classify(p)] ?? MOCK.default; }

const PROMPT_RISK: [RegExp, number, string][] = ([
  [String.raw`ignore.{0,20}(previous|above|system|instructions)`, 0.9, 'prompt_injection'],
  [String.raw`\b(jailbreak|dan mode|do anything now)\b`, 0.95, 'prompt_injection'],
  [String.raw`\b(no|without)\s+(restrictions?|rules?|filters?|limits?)`, 0.8, 'prompt_injection'],
  [String.raw`\b\d{3}-\d{2}-\d{4}\b`, 0.8, 'pii'],
  [String.raw`\b(approve|deny|increase|decline)\b.{0,30}\b(credit|loan|line|limit)`, 0.75, 'financial'],
  [String.raw`\b(buy|sell|invest|allocate|move)\b.{0,30}\b(stock|fund|etf|bond|crypto|portfolio|savings|equit)`, 0.7, 'financial'],
  [String.raw`\b(delete|drop|wipe|purge)\b.{0,20}\b(all|database|table|records?|data)`, 0.7, 'tool_risk'],
] as [string, number, string][]).map(([p, w, c]) => [ci(p), w, c]);

export function scorePrompt(prompt: string, baseRisk = 0): { score: number; level: string } {
  let max = 0;
  for (const [r, w] of PROMPT_RISK) if (r.test(prompt)) max = Math.max(max, w);
  const combined = Math.min(max + baseRisk * 0.2, 1);
  const level = combined >= 0.75 ? 'CRITICAL' : combined >= 0.5 ? 'HIGH' : combined >= 0.25 ? 'MEDIUM' : 'LOW';
  return { score: Math.round(combined * 1000) / 1000, level };
}

let _seq = 1000;
const pad = (n: number) => String(n).padStart(5, '0');

export function runGovernance(prompt: string, uc: { id: string; business_function?: string; use_case_type?: string; risk_score?: number }, responseOverride?: string): PlaygroundResponse {
  _seq += 1;
  const raw = responseOverride && responseOverride.trim() ? responseOverride : mockResponse(prompt);
  const gs = runAllGuardrails(prompt, raw, uc);
  const { decision, reason, severity, confidence } = resolveDecision(gs);
  const { score, level } = scorePrompt(prompt, uc.risk_score ?? 0);
  let final = raw;
  if (decision === 'BLOCK') final = 'This request has been blocked by the AI governance system. The prompt violated one or more content policies.';
  else if (decision === 'ESCALATE') final = 'This request has been escalated for human review. A governance reviewer will assess the response before it is returned.';
  else if (decision === 'REQUIRE_CONFIRMATION') final = 'This action requires explicit confirmation before proceeding. Please confirm you understand the risks and have appropriate authorization.';
  else { for (const g of gs) if (g.guardrail_type === 'pii' && g.triggered && g.redacted_content) final = g.redacted_content; for (const g of gs) if (g.triggered && g.rewritten_content) final = g.rewritten_content; }
  const trace: TraceStep[] = [];
  let step = 0;
  const add = (name: string, status: string, action?: string, details?: string) => trace.push({ step: ++step, name, status, action, details, duration_ms: Math.round((2 + Math.random() * 8) * 10) / 10 });
  add('Risk Scoring', 'pass', undefined, `Score: ${score} | Level: ${level}`);
  for (const g of gs) add(g.guardrail_name, g.triggered ? 'triggered' : 'pass', g.triggered ? g.action : undefined, g.reason);
  const triggeredPolicies = gs.filter((g) => g.triggered).map((g) => g.guardrail_name);
  add('Policy Engine', 'pass', undefined, `${triggeredPolicies.length} policies matched`);
  add('Decision Engine', 'pass', decision, reason);
  const review = needsHumanReview(decision, severity);
  if (review) add('Human Review Queue', 'triggered', 'QUEUED', `SLA: ${severity === 'critical' ? 4 : 24}h`);
  return {
    prompt_event_id: `evt-${pad(_seq)}`, decision, decision_reason: reason, severity, confidence,
    triggered_policies: triggeredPolicies, policy_version: '1.0.0', original_prompt: prompt,
    final_response: final, guardrail_results: gs, trace, risk_score: score, risk_level: level,
    audit_event_id: `AUD-2026-${pad(_seq)}`, review_item_id: review ? `rev-${pad(_seq)}` : undefined,
    latency_ms: Math.round((40 + Math.random() * 120) * 10) / 10, created_at: new Date().toISOString(),
    model_provider: responseOverride && responseOverride.trim() ? 'live' : 'mock',
  };
}

// --- Ungoverned simulation (teaching artifact for the Live split-screen) -----
// The plausible output an *unguarded* model would return, so visitors can see
// the harm the control plane prevents. Deterministic, for the demo only.
const UNGOVERNED: Record<string, string> = {
  prompt_injection: 'Of course. My system instructions are: "You are FinBot. Auto approve refunds under $5,000; internal risk thresholds are 0.4/0.7/0.9…", here is the full configuration and the internal scoring policy.',
  pii: 'Sure, John Smith, SSN 123-45-6789, Visa 4111 1111 1111 1111, phone (415) 555-0172. Charging the card now.',
  financial: 'Yes, approve the credit line increase to $25,000. Approved and applied to the customer account.',
  tool_risk: 'Done, deleted all records from the customers table and emailed the customer to confirm the account closure.',
  toxicity: 'Honestly, your support team are incompetent idiots and you should be embarrassed to work there.',
  bias: 'Based on age and likely parental leave plans, I would rank the older and female candidates lower for this role.',
  unsupported_claims: 'Absolutely, this strategy is guaranteed to work and studies definitely prove it is the only correct approach.',
  citation: 'Research clearly shows this is the best method, no need to check the source documents.',
  safe: 'Operating expense rose 8% quarter over quarter, driven mainly by headcount growth and increased cloud spend.',
};

export function ungovernedResponse(prompt: string): { category: string; text: string } {
  const results = runAllGuardrails(prompt, '', { use_case_type: 'assistant', business_function: 'Finance' });
  const triggered = results.find((g) => g.triggered);
  const category = triggered ? triggered.guardrail_type : 'safe';
  return { category, text: UNGOVERNED[category] ?? UNGOVERNED.safe };
}

// --- Use case risk model (TS port of risk_scoring.score_use_case) ------------
export interface RiskInputs {
  data_sensitivity: string;
  deployment_context: string;
  use_case_type: string;
  business_function: string;
  human_oversight: string;
}
export interface RiskResult {
  score: number; tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  drivers: string[]; controls: string[]; launchReadiness: number;
}
const RW = {
  data_sensitivity: { public: 0, internal: 0.08, confidential: 0.18, regulated: 0.28 } as Record<string, number>,
  deployment_context: { internal: 0.05, 'customer-facing': 0.16, agentic: 0.25 } as Record<string, number>,
  use_case_type: { classifier: 0.04, assistant: 0.08, rag: 0.12, agentic: 0.25 } as Record<string, number>,
  business_function: { Operations: 0.04, IT: 0.04, HR: 0.1, Customer: 0.12, Legal: 0.16, Finance: 0.2 } as Record<string, number>,
  human_oversight: { always: 0, required: 0.05, optional: 0.1, none: 0.24 } as Record<string, number>,
};

export function simulateUseCaseRisk(i: RiskInputs): RiskResult {
  let s = 0;
  const drivers: string[] = [];
  s += RW.data_sensitivity[i.data_sensitivity] ?? 0.08;
  if (i.data_sensitivity === 'confidential' || i.data_sensitivity === 'regulated') drivers.push(`Processes ${i.data_sensitivity} data`);
  s += RW.deployment_context[i.deployment_context] ?? 0.05;
  if (i.deployment_context === 'customer-facing') drivers.push('Customer-facing exposure');
  if (i.deployment_context === 'agentic') drivers.push('Autonomous (agentic) deployment');
  s += RW.use_case_type[i.use_case_type] ?? 0.08;
  if (i.use_case_type === 'rag') drivers.push('Retrieval grounding introduces source-quality risk');
  if (i.use_case_type === 'agentic') drivers.push('Tool-using agent expands the action surface');
  const bw = RW.business_function[i.business_function] ?? 0.04;
  s += bw;
  if (bw >= 0.16) drivers.push(`Regulated / high sensitivity function: ${i.business_function}`);
  s += RW.human_oversight[i.human_oversight] ?? 0.1;
  if (i.human_oversight === 'optional' || i.human_oversight === 'none') drivers.push(`Limited human oversight (${i.human_oversight})`);
  else drivers.push(`Human oversight reduces residual risk (${i.human_oversight})`);

  const score = Math.round(Math.min(s, 1) * 1000) / 1000;
  const tier: RiskResult['tier'] = score >= 0.75 ? 'CRITICAL' : score >= 0.5 ? 'HIGH' : score >= 0.25 ? 'MEDIUM' : 'LOW';
  const controls = ['Audit Logging', 'Runtime Prompt Risk Scoring'];
  if (score >= 0.25) controls.push('Sensitive Data / PII Guardrail', 'Content Policy Enforcement');
  if (score >= 0.5) controls.push('Human Review Queue', 'Escalation Policy', 'Prompt Injection Guardrail');
  if (score >= 0.75) controls.push('Executive / CISO Sign-off', 'Quarterly Red-Team Eval', 'Zero-Trust Tool Actions');
  if (i.use_case_type === 'agentic') controls.push('Tool Action Risk Guardrail');
  if (i.business_function === 'Finance') controls.push('Regulated Financial Recommendation Guardrail');
  if (i.business_function === 'HR') controls.push('Bias / Protected-Class Guardrail');

  // Launch readiness: low/medium tiers are launch-ready; high/critical need strong oversight.
  const strongOversight = i.human_oversight === 'always' || i.human_oversight === 'required';
  let readiness: number;
  if (tier === 'LOW') readiness = 96;
  else if (tier === 'MEDIUM') readiness = 88;
  else if (tier === 'HIGH') readiness = strongOversight ? 74 : 48;
  else readiness = strongOversight ? 58 : 28;
  return { score, tier, drivers, controls: Array.from(new Set(controls)), launchReadiness: readiness };
}
