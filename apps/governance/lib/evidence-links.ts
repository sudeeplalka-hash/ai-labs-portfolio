/** Maps a guardrail to the policy (Workbench) and eval suite that govern it,
 *  so any runtime decision can deep-link to the evidence behind it. */
export const GUARDRAIL_LINKS: Record<string, { policy: string; policyName: string; evalCat: string }> = {
  prompt_injection: { policy: 'prompt-injection-blocking', policyName: 'Prompt Injection Blocking Policy', evalCat: 'prompt_injection' },
  pii: { policy: 'pii-redaction', policyName: 'PII Redaction Policy', evalCat: 'pii' },
  financial: { policy: 'financial-advice-escalation', policyName: 'Financial Advice Escalation Policy', evalCat: 'financial' },
  tool_risk: { policy: 'agentic-scope-restriction', policyName: 'Agentic Scope Restriction Policy', evalCat: 'tool_risk' },
  toxicity: { policy: 'toxicity-blocking', policyName: 'Toxicity & Professional Conduct Policy', evalCat: 'hr' },
  bias: { policy: 'protected-class-nondiscrimination', policyName: 'Protected-Class Anti-Discrimination Policy', evalCat: 'hr' },
  unsupported_claims: { policy: 'overconfidence-disclaimer', policyName: 'Overconfidence Disclaimer Policy', evalCat: 'overconfidence' },
  citation: { policy: 'rag-citation-requirement', policyName: 'RAG Citation Requirement Policy', evalCat: 'citation' },
};
