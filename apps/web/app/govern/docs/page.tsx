export default function Docs() {
  const sections = [
    {
      title: "Product Overview",
      content: `The Enterprise AI Governance Control Plane shows how enterprise GenAI and agentic systems can be registered, risk-tiered, governed with policy-as-code, tested through red-team evals, monitored at runtime, escalated to human reviewers, and exported as audit-ready evidence.

This is not a chatbot demo, it is the governance operating layer around enterprise AI, built for two audiences: executives who need risk posture and engineers who need inspectable controls. Use the Executive / Technical lens (top bar) to switch density.`
    },
    {
      title: "Architecture",
      content: `Frontend: Next.js 14 + TypeScript + Tailwind + Recharts (static-export friendly).
Backend: FastAPI + Python + SQLAlchemy + SQLite, provider-agnostic model gateway (AI_PROVIDER=mock by default).

Policies live as code in policies/*.yaml; red-team suites in evals/*.json; control-to-framework mappings in app/core/frameworks.py. This deployment runs fully client side in static demo mode, the same governance engine is ported to TypeScript so every decision is reproducible with no backend.`
    },
    {
      title: "Governance Pipeline",
      content: `Every AI request flows through:
1. Risk scoring, prompt and use case risk assessed deterministically
2. Input guardrails, injection, PII, toxicity, bias, financial, tool-action checks
3. Model gateway, mock or live response generated
4. Output guardrails, unsupported-claim and citation checks on the response
5. Decision engine, highest-precedence action selected (BLOCK > ESCALATE > REQUIRE_CONFIRMATION > REDACT > REWRITE > ALLOW_WITH_DISCLAIMER > LOG_ONLY > ALLOW)
6. Audit, event written to a tamper-evident, hash-chained log
7. Human review, escalated items queued with SLAs`
    },
    {
      title: "Guardrails (8)",
      content: `1. Prompt Injection, blocks directive overrides, jailbreaks, token injection
2. Sensitive Data / PII, redacts SSN, card, email, phone, passport, DOB
3. Unsupported Claims, disclaims overconfident or unsourced assertions
4. Regulated Financial Recommendation, escalates credit and investment decisions
5. Tool Action Risk, escalates / confirms destructive or high-impact actions
6. Toxicity / Professional Conduct, blocks abusive content
7. Bias / Protected-Class, blocks decisions based on protected attributes
8. Citation Required, flags RAG answers lacking sources

Detection is deterministic and rule-based by default; an optional LLM classifier can be enabled per guardrail (GUARDRAIL_MODE=hybrid). Confidence is calibrated from the number of corroborating signals.`
    },
    {
      title: "Governance Decisions",
      content: `ALLOW, passed all checks
ALLOW_WITH_DISCLAIMER, passed with an advisory note
REDACT, PII or sensitive content removed
REWRITE, response rewritten for compliance
REQUIRE_CONFIRMATION, user must confirm before proceeding
ESCALATE, sent to a human reviewer
BLOCK, request rejected outright
LOG_ONLY, allowed but flagged for audit`
    },
    {
      title: "Assurance & Evidence",
      content: `Tamper-evident audit, every event is SHA-256 hash-chained; the Audit Log Explorer can re-verify integrity and flag any altered entry.
Red-team evals, 8 suites / 64 cases run through the live pipeline, with run-to-run version comparison and a CI eval-regression gate.
Framework mapping, every policy maps to NIST AI RMF 1.0, the EU AI Act, and ISO/IEC 42001.
RBAC, Analyst / Reviewer / Auditor / Admin personas gate actions (separation of duties).
Evidence, one-click audit evidence reports with a completeness score.`
    },
    {
      title: "Interactive Lab",
      content: `See it Live, the same risky prompt with and without governance, side by side.
Red-Team Arcade, try to break the AI; the control plane scores every contained attack.
Business Case, an interactive ROI model (cost avoided, hours saved, time-to-launch).
Maturity Index, a 6-question self-assessment placing you on a crawl/walk/run/fly curve.
Regulatory Readiness, control coverage mapped to EU AI Act / NIST / ISO.
Board Brief, generate a screenshot-ready one-pager for the board.`
    },
    {
      title: "Demo Script",
      content: `1. See it Live, run "Ignore all previous instructions" (BLOCK), an SSN (REDACT), a credit decision (ESCALATE).
2. Red-Team Arcade, fire a few attacks; watch containment hold.
3. Executive Cockpit, portfolio posture and the value strip.
4. Policy Workbench, open a policy; see the YAML and its framework mapping.
5. Human Review Queue, switch role to Reviewer and action an item.
6. Eval Lab, run a suite, then Compare runs.
7. Audit Log Explorer, re-verify the hash chain.
8. Board Brief, generate the one-pager.`
    },
    {
      title: "Setup",
      content: `One command (Docker):  docker compose up --build  → http://localhost:3000

Or run locally:
  backend:  pip install -r requirements.txt && uvicorn app.main:app --reload
  frontend: npm install && npm run dev

Static demo build (no backend):  NEXT_OUTPUT=export NEXT_PUBLIC_STATIC_DEMO=1 npm run build
No API key required (AI_PROVIDER=mock by default).`
    },
  ];

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reference</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Architecture Guide</h2>
        <p className="text-sm text-slate-500 mt-1">Technical reference</p>
      </div>
      {sections.map(s => (
        <div key={s.title} className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-3">{s.title}</h3>
          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{s.content}</pre>
        </div>
      ))}
    </div>
  );
}
