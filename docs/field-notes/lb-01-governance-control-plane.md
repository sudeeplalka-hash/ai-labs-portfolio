# Field note · LB-01 Enterprise AI Governance Control Plane

**Problem.** Governance decks say "we have guardrails." Auditors ask a colder question: prove they ran —
on which request, with which policy version, and who signed off on the exception.

**What was built.** A control plane where policy is code (8 guardrails: PII, prompt-injection, topic bans,
grounding, toxicity, rate/size limits, output schema, human-review routing), every decision lands in a
hash-chained audit log (tamper-evident: each entry commits to the previous hash), and red-team eval suites
gate promotion at ≥90% pass — the same gate the portfolio's simulated /govern lab argues for, backed by a
running system. FastAPI backend (25/25 tests green) with RBAC; Next.js frontend; and a fully static
in-browser demo mode (NEXT_PUBLIC_STATIC_DEMO=1) so the public deploy needs no backend at all.

**Real numbers.** 8/8 red-team suites ≥90% before promotion; 25/25 backend tests; 26-page frontend; policy
mappings to EU AI Act, NIST AI RMF, and ISO 42001 shipped as machine-readable JSON, not slideware.

**Decision it enables.** Which guardrails gate which risk tier — and what evidence survives an audit.

**Honesty line.** The public deploy is the in-browser engine (real TS computation, mock model gateway,
labeled as such); the FastAPI service is optional and documented. Built on FastAPI + Next.js; all
guardrail/audit logic is original.
