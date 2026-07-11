# Field note · LB-02 RAG Quality Evaluator (live lab)

**Problem.** Every RAG demo answers confidently. The production question is different: is the answer
grounded in the retrieved evidence, are the citations real, and would you stake a workflow on it?

**What was built.** An end-to-end evaluator that runs entirely client-side: upload a document, BM25
retrieval with query expansion, cited answer generation, then a scored evaluation — faithfulness,
citation accuracy, hallucination risk — every metric formula-defined and visible (the same Lucene-form
BM25 family the portfolio's Corpus Intelligence lab uses, so the two labs agree on the math). A BYO-key
live lab (Anthropic or OpenAI) swaps the deterministic answerer for a real model: the key stays in the
browser, calls go direct from the visitor's session, nothing is stored.

**Decision it enables.** Gate a RAG build on measured faithfulness and citation accuracy — before the
index grows and the failure modes get expensive.

**Honesty line.** Deterministic mode is labeled deterministic; the live mode is labeled BYO-key and runs
only on the visitor's own credentials. The evaluator's scoring rubric ships in the same tested module the
UI reads, so the number on screen is the number the code computes.
