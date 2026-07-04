# ML & Data-Science Knowledge — Gap Analysis

**Date:** 2026-07-04 · **Subject:** `ai-labs-portfolio` viewed through a *machine-learning / data-science* lens.
**Question:** What ML/DS knowledge does the portfolio actually demonstrate, and what remains unaddressed?
**Calibration:** The target roles are **Senior Engagement Manager / TPM / AI delivery leadership**, not ML research engineer or hands-on data scientist. So every gap below is rated by *role relevance* — the bar is enough depth to (a) hold technical credibility with ML/DS stakeholders, (b) make sound build/buy/risk calls, and (c) detect when a data scientist is hand-waving — **not** hands-on model-training mastery. Grounded in a direct read of the engine code, not the marketing.

---

## 1. Headline

The portfolio is stronger on real ML/DS than a glance suggests, and its gaps are concentrated in one place: **it demonstrates deep GenAI/LLM-application literacy and genuine information-retrieval engineering, but almost none of the classical predictive-modeling and statistical-inference core of "data science" — even though its own scenarios (fraud scoring, churn, KYC extraction, predictive maintenance) are exactly those problems.**

The single most important finding: **the portfolio repeatedly name-drops supervised-ML and statistical problems it never pays off.** It sets a technical expectation (classification, forecasting, drift, causal lift) that the labs don't cash. That mismatch — not any individual missing technique — is the real gap for an interview.

**Update — the top *operational* gap: Day-2 observability.** On reflection there is an even more role-specific hole: the portfolio has **no post-deployment observability surface at all.** The lifecycle runs Frame → Data → Build → Deploy → Govern → Realize and then stops — there is no "Operate / Observe" loop. And every "monitor" in the portfolio sits **one altitude above the running model** (EL-04 monitors program health, C3-4 vendor risk, C3-1 the portfolio); nothing watches the deployed model itself — drift, hallucination rate, freshness/index staleness, latency/cost over time. For a delivery-leadership role this is arguably *the* top gap, because **Day 1 (ship it) is the data scientist's; Day 2 (keep it good) is the EM/TPM's.** It is treated as the lead gap in §3 and the #1 recommendation in §5, and fully specced in `SPEC-day2-observability-console.md`.

Two things temper this, both in the candidate's favor:
1. The demonstrated ML is **real and correctly implemented**, not decorative (see §2).
2. Much of the "missing" DS is **legitimately out of scope** for a delivery-leadership role; building it would dilute the positioning into a junior-DS portfolio (see §4).

---

## 2. What the portfolio actually demonstrates (grounded in code)

This is more than "deterministic engines." The RAG lab in particular is real, textbook-correct ML/NLP:

| Competency area | Where | What's actually there | Depth |
|---|---|---|---|
| **Information retrieval (classical)** | `lab-rag/live-lab/retrieval.ts` | A proper **BM25** ranker — IDF weighting, term-frequency saturation (k1=1.5), document-length normalization (b=0.75), query expansion (synonyms at half weight), phrase-bigram bonus, boilerplate down-weighting. Not naive keyword match. | **Strong** |
| **Unsupervised ML / dimensionality reduction** | `lab-rag/live-lab/embeddings.ts` | Hand-implemented **TF-IDF → PCA** (power iteration with deflation) → 3-D projection, plus **k-means** (k-means++ farthest-point seeding) with automatic cluster labeling. Deterministic, local. | **Strong (classical)** |
| **LLM / RAG evaluation** | `lab-rag/live-lab/evaluation.ts` | A multi-metric eval harness: retrieval relevance, citation coverage & accuracy, **faithfulness/grounding**, answer completeness, context utilization, **hallucination risk** (weighted), quality gates (Pass/Warn/Fail), human-review triggers. RAGAS-adjacent thinking. | **Strong (conceptually), shallow (mechanically — see §3C)** |
| **GenAI application & agentic engineering** | Collection 2 (GAP-01…08) | RAG pipeline end-to-end; MCP protocol & JSON-RPC framing; multi-agent orchestration (A2A); tool-use with schema validation + corrective retry; context/memory strategies (full/summarize/compress/handoff); HITL autonomy; token/cost economics. | **Strong** |
| **AI economics & sourcing (MLOps-adjacent decisions)** | Collection 3 (C3-1…5) | Inference cost (API vs self-host GPU amortization + utilization crossover); build/buy/fine-tune TCO; vendor risk; portfolio risk-adjusted ROI; capacity. | **Strong (decision layer)** |
| **AI governance, risk & data-readiness** | EL-05, GAP-08, `lab-data/prep/profiles.ts` | EU AI Act tiering; model-risk (SR 11-7); fair-lending/bias; autonomy-per-risk-tier; data-ingestion compliance profiles (HIPAA/SOX/GDPR/PCI). | **Strong** |
| **Semantic retrieval / vector stack (knowledge, not demo)** | `retrieval.ts` comments + `embeddings.ts` header | The code explicitly names the deliberate next step — swap TF-IDF/BM25 for a neural embedding model (MiniLM/OpenAI) + vector store (pgvector/Pinecone/Weaviate/Chroma). So the semantic-search landscape is clearly *understood*, just not implemented client-side. | **Named, not shown** |

**Takeaway for §3:** the author demonstrably knows IR, unsupervised ML, and RAG-eval. The gaps below are therefore *specific*, not a blanket "no ML."

---

## 3. The gaps (each rated by role relevance)

Rating key: **[CLOSE]** worth addressing — the portfolio invites the question and a technical panel will ask it · **[CONSIDER]** strengthens credibility, optional · **[SKIP]** genuinely out of scope for a delivery-leadership role; building it signals the wrong level.

### ⚑ Lead gap — Day-2 production observability (the missing "Operate" stage) · [CLOSE — top priority]
Nothing in the portfolio watches a **deployed** model or agent over time. There is no live control plane showing, on a **time axis**, the four production signal families:
- **Quality / drift** — eval-score decay, input **data drift** (PSI / KS-test), output/prediction drift, retraining triggers.
- **Safety** — production **hallucination / groundedness** rate, guardrail & policy hits, prompt-injection attempts, toxicity.
- **Freshness / staleness** — data recency, **model** age, and the RAG-specific one everyone forgets: **knowledge-base / index staleness**.
- **Reliability / economics** — p95 latency, cost per request, throughput, error / fallback rate, cache hit-rate.

…plus the SRE spine — **SLOs, error budgets, alerting, an incident / on-call path** — and the **feedback → eval-set → retrain** loop that closes back to Build/Realize.

*Why it's the lead gap:* Day 1 (ship it) is the data scientist's win; **Day 2 (keep it good) is the EM/TPM's job.** Programs don't fail at launch, they rot in production, and a portfolio that demonstrates the whole lifecycle except *running the thing* has a visible seam. A senior tell lives here too: **system observability can be all-green (latency, cost, uptime fine) while AI observability is red** (groundedness quietly decaying) — knowing the difference is the differentiator. This gap **subsumes gap D below** (MLOps drift/monitoring is one lane of it). Fully specced in `SPEC-day2-observability-console.md`.

### A. Supervised ML and — above all — its **evaluation** · [CLOSE]
The biggest, most conspicuous gap. The portfolio's scenarios are saturated with supervised-learning problems — **fraud scoring, churn prediction, KYC/document extraction, disputes classification, defect vision, predictive maintenance** — yet **no lab shows the modeling or, more importantly, the evaluation of a classifier or regressor.** There is no precision/recall/F1, ROC-AUC / PR-AUC, confusion matrix, decision-threshold selection, class-imbalance handling, or **calibration**.
*Why it matters:* a leader governing a "fraud model" must reason in false-positive-cost-vs-recall and threshold economics. The portfolio proves LLM-eval literacy (§2) but not its classical-ML twin — the exact vocabulary its own scenarios demand. This is the gap most likely to surface in a technical interview, precisely because the scenarios keep raising it.

### B. Statistical inference, experimentation & causal reasoning · [CLOSE]
Absent. No A/B-test design, hypothesis testing, confidence intervals, statistical significance, sample size / power, or **causal inference / uplift** (did the AI *cause* the lift, or did it correlate?). The ROI/adoption/tornado analyses are **deterministic** (±30% swings) rather than **probabilistic** — no Monte Carlo, no distributions, no uncertainty quantification.
*Why it matters:* every value claim in the portfolio ("adoption +5 pts," "$4M avoided," "containment 22%") rests on experimentation and causal attribution. Showing you separate correlation from causation, and can design/read an experiment, is core credibility with analytics and finance stakeholders — and it's the intellectual backbone under the C3/EL value stories.

### C. Evaluation **validity** (how do you know the eval is right?) · [CLOSE — cheap]
The RAG eval (§2) is real but its grounding is **lexical word-overlap**, not semantic entailment (NLI), embedding similarity, or **LLM-as-judge**. There's no inter-annotator agreement, no eval **sample-size / confidence interval**, no named benchmark discipline (RAGAS / HELM / lm-eval-harness / MMLU), and the golden-set regression story isn't surfaced as versioned data on screen.
*Why it matters:* eval is the portfolio's strongest DS theme, so a reviewer will push exactly here — "how do you *know* faithfulness is 82%?" Today the honest answer is "a lexical heuristic." Naming the methods you'd use to make eval statistically valid closes the gap cheaply.

### D. Production ML / MLOps **mechanics** (beyond the decision layer) · [CLOSE for TPM]
The portfolio governs ML programs at the decision layer but never shows the machinery: **drift detection** algorithms (PSI, KS-test, embedding drift), retraining triggers, champion/challenger & shadow deployment, **feature stores** (named as a RAID dependency, never shown), experiment tracking (MLflow/W&B), model registry/lineage. "Model drift" appears as a RAID narrative color in EL-04, not as a detection mechanism.
*Why it matters:* running an AI program *is* running an MLOps loop. For a TPM/delivery role this is squarely in scope — showing you understand the monitor→detect→retrain→redeploy loop mechanically (not just as a status light) is directly the job.

### E. Neural embeddings & advanced retrieval · [CONSIDER]
No neural embeddings, approximate-nearest-neighbor search (HNSW/IVF), cross-encoder **reranking**, or hybrid (lexical+semantic) search. The author names these as the deliberate next step, so the *knowledge* is implied — but nothing is demonstrated.
*Why it matters:* "BM25 now, embeddings next" is a defensible, honest engineering choice. A single embeddings+reranking demo would convert "knows about it" into "has shipped it" — worth doing once, not urgent.

### F. Fine-tuning / model-adaptation mechanics · [CONSIDER]
C3-2 offers "fine-tune / self-host" as a build option and C3-3 prices GPU self-host, but the **mechanics** of adaptation are never shown: SFT vs **LoRA/PEFT/QLoRA**, data-curation & labeling requirements, RLHF/DPO, catastrophic forgetting, how you *evaluate* a fine-tune.
*Why it matters:* if you recommend "fine-tune" in a build/buy call, expect "what does that actually take?" Owning the data/compute/eval requirements (even conceptually) is credibility; deriving the training math is not needed.

### G. Time-series forecasting & optimization · [CONSIDER / SKIP]
The cost forecaster is a **deterministic linear projection** — no ARIMA/Prophet/exponential smoothing, no seasonality; capacity/scheduling are heuristic, not OR/optimization (LP/constraint solving). Mostly [SKIP], but the word "forecaster" implies a method a sharp reviewer might probe.

### H. Deep-learning internals · [SKIP]
Transformer/attention/backprop internals, training-from-scratch, tokenization mechanics (tokens are *counted* in GAP-06, not dissected). **Genuinely out of scope** for the role — demonstrating it would signal "aspiring ML engineer," which is the wrong altitude for a Senior EM/TPM.

---

## 4. The meta-risk, stated plainly

The portfolio's noun is **"AI"** and its scenario language is thick with **predictive-ML and statistical** problems, which primes a technical interviewer to expect data-science depth. What the labs actually pay off is **GenAI application + IR + delivery/economics/governance judgment**. That's an excellent and coherent story — but the *unpriced check* is classical predictive-ML evaluation, experimentation/causal reasoning, and MLOps mechanics.

The failure mode is specific and avoidable: an interviewer points at the "fraud model" or "churn model" on screen and asks "how did you evaluate it / how do you know it's still working / how did you prove it drove the lift?" — and the portfolio, which demonstrates the *LLM* answer beautifully, has no *classical-ML* answer on hand.

---

## 5. Recommendation — close the credibility gaps *without* becoming a data-science portfolio

The right move is **not** to add hands-on modeling labs (that lowers the altitude and dilutes the delivery-leadership thesis). It's to add a small number of **"governor's-eye-view" instruments that show judgment *over* the DS** — the same design language as the existing labs (decision-framed, honest, deterministic-but-real).

**Top priority — the AI Production Observability Console (the missing "Operate" stage).** A Day-2 control room that watches a *deployed* model/agent on a time axis across the four signal families (quality/drift · safety/hallucination · freshness/staleness · reliability/cost), with SLOs & error budgets, a "week 7 incident" that surfaces a silent degradation while system metrics stay green, and a feedback→retrain loop that closes the lifecycle back to Realize/Frame. It reuses machinery already built — the RAG evaluator as *online* eval, EL-04's health model, freshness, HITL feedback, the artifact engine, and `@labs/engines` + tests — and answers the operating-model question a delivery VP cares about most. It **subsumes item 3 below.** Full spec: `SPEC-day2-observability-console.md`.

The supporting candidates, in priority order:

1. **[CLOSE] Model-Evaluation & Threshold-Economics lab** — feed a confusion matrix / score distribution for one of the *existing* scenarios (fraud or churn); show precision/recall/F1, ROC & PR curves, calibration, and — the senior move — the **decision-threshold-vs-cost** slider (false-positive cost × volume vs missed-fraud cost). This is the classical-ML twin of the RAG evaluator and directly answers "how do you evaluate a model." Highest leverage.
2. **[CLOSE] Experiment & Causal Read-out** — an A/B / holdout readout with **confidence intervals and significance**, plus a one-line "is this lift causal or correlational?" framing and a Monte-Carlo band replacing (or augmenting) the C3-5 tornado. Closes the statistics/experimentation gap and hardens every value claim in the portfolio.
3. **[CLOSE] Drift & Monitoring Instrument** — turn EL-04's "model drift" narrative into a real one: a PSI/KS drift signal on a feature or score distribution, a performance-decay curve, and a retraining-trigger rule. Makes the MLOps loop mechanical, which is squarely the TPM job.
4. **[CONSIDER] Semantic-retrieval upgrade** — implement the embedding + reranking path the code already stubs (`EmbeddingRetrieverPlaceholder`), with a lexical-vs-semantic A/B on the same question. Converts the honest "next step" comment into a shipped capability.

Each is one lab-sized artifact, reuses the existing honesty/design system, and *raises* the technical credibility of the delivery-leadership story rather than competing with it.

**Explicitly do not build** (wrong altitude, dilutes positioning): training models from scratch, deriving transformer/backprop math, a research-grade fine-tuning pipeline, browser embeddings for their own sake, or a general EDA/notebook tool. The portfolio's problem was never "not enough ML" — it's that the *evaluation, experimentation, and monitoring* judgment around ML isn't visible yet.

---

## 6. Bottom line

- **Demonstrated (real, grounded):** information retrieval (BM25), unsupervised ML (TF-IDF/PCA/k-means), RAG/LLM-evaluation, agentic/GenAI application engineering, AI economics, governance & data-readiness. This is a genuinely technical portfolio, not a slideware one.
- **The top operational gap (Day-2 observability):** no live surface watches a *deployed* model — drift, hallucination rate, freshness/index staleness, latency/cost on a time axis. It closes the lifecycle loop and is the operating-model competency a delivery VP most wants to see. It is the **#1 build** (see `SPEC-day2-observability-console.md`).
- **The gap that matters:** the **classical predictive-ML evaluation, statistical-experimentation/causal, and MLOps-monitoring** layer — the "is the model good, is the lift real, is it still working?" trio — which the portfolio's own scenarios repeatedly invoke but never demonstrate.
- **The fix:** 2–4 judgment-level instruments (model-eval/threshold economics, experiment/causal read-out, drift monitor, optional semantic retrieval) that answer those three questions at a leadership altitude.
- **What to avoid:** dropping into hands-on modeling depth that would re-cast a Senior-EM/TPM portfolio as a junior data-scientist one.

*Grounded in direct reads of `lab-rag/live-lab/{retrieval,embeddings,evaluation}.ts` and `lab-data/prep/profiles.ts`, plus the full Collection 2–4 lab set built in this engagement. Complements the Fable review (which flagged the adjacent "no live inference" and "no tests" gaps) with the ML/DS-knowledge lens specifically.*
