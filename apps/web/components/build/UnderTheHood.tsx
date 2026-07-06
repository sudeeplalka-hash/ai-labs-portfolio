// Phase 7, optional "Under the Hood" model internals explainer. Static,
// presentational, no hooks/state/deps. Explanation, not implementation: this
// product does not train transformers or run PyTorch/TensorFlow.

import Link from "next/link";
import { Panel, SectionHeader, Badge, InsightCard } from "@labs/design-system";
import { Boxes, Focus, Sparkles, GitCompare, Layers, Workflow, Info } from "lucide-react";

const TOKENS_FLOW = [
  { n: 1, label: "Tokens", body: "Text is split into pieces the model can process." },
  { n: 2, label: "Embeddings", body: "Tokens are converted into numeric representations." },
  { n: 3, label: "Attention", body: "The model weighs relationships between tokens." },
  { n: 4, label: "Layers", body: "Multiple transformer layers refine context." },
  { n: 5, label: "Output probabilities", body: "The model predicts likely next tokens." },
  { n: 6, label: "Generated response", body: "The response is assembled token by token." },
];

function T({ head, rows, highlight }: { head: string[]; rows: (string | React.ReactNode)[][]; highlight?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-slatey-500">{head.map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} className={i === highlight ? "border-b border-line/60 bg-primary/[0.05]" : "border-b border-line/60"}>
            {r.map((c, j) => <td key={j} className={j === 0 ? "py-2 pr-3 font-medium text-ink" : "py-2 pr-3 text-slatey-400"}>{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function UnderTheHood() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-slate-50/60 p-4">
        <p className="text-sm leading-relaxed text-slatey-300">
          This Command Center focuses on enterprise AI delivery decisions, not low-level model training. This optional layer explains the
          model concepts underneath the lifecycle: how transformers use attention, how embeddings support retrieval, how fine tuning changes
          behavior, and where frameworks like PyTorch or TensorFlow fit in real AI engineering.
        </p>
      </div>

      {/* Transformer */}
      <Panel>
        <SectionHeader eyebrow="Architecture" title="What is a transformer?" icon={Boxes}
          description="The architecture behind most modern LLMs. It converts tokens into contextual representations and uses attention to estimate which parts of the input matter most when generating the next output." />
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOKENS_FLOW.map((s) => (
            <li key={s.n} className="flex items-start gap-2.5 rounded-lg border border-line bg-white p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] text-primary">{s.n}</span>
              <span className="text-[13px] leading-snug text-slatey-300"><b className="text-ink">{s.label}.</b> {s.body}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12px] italic text-slatey-500">This product does not implement a transformer. It shows how enterprise teams evaluate, operate, govern, and measure systems built with models that often use transformer architectures.</p>
      </Panel>

      {/* Attention */}
      <Panel>
        <SectionHeader eyebrow="Inside the context window" title="What does attention do?" icon={Focus}
          description="Attention helps a model decide which parts of the input are most relevant to the current generation step, assigning different weights to different tokens based on context." />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-3">
            <p className="stat-label mb-1">Example question</p>
            <p className="text-sm italic text-ink">&ldquo;Can I reimburse travel expenses after 30 days?&rdquo;</p>
            <p className="stat-label mb-1 mt-3 text-emerald-700">More relevant tokens</p>
            <div className="flex flex-wrap gap-1.5">{["reimburse", "travel expenses", "after 30 days", "policy date", "exception rule"].map((t) => <Badge key={t} tone="emerald">{t}</Badge>)}</div>
            <p className="stat-label mb-1 mt-3 text-slatey-500">Less relevant</p>
            <div className="flex flex-wrap gap-1.5">{["filler words", "unrelated sections", "retired policy refs"].map((t) => <Badge key={t} tone="slate">{t}</Badge>)}</div>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/[0.04] p-3">
            <p className="text-sm leading-relaxed text-slatey-300">
              <b className="text-ink">Attention is not retrieval.</b> Attention helps the model use information already inside its context window.
              Retrieval decides which external evidence enters the context window in the first place.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <T head={["Concept", "What it does", "Where this product shows it"]} rows={[
            ["Attention", "Weighs relationships inside the model context", "Under the Hood"],
            ["Retrieval", "Selects external evidence before generation", <Link key="r" href="/build/retrieval" className="text-primary hover:underline">Build/RAG</Link>],
            ["Reranking", "Improves which retrieved evidence is sent forward", <Link key="rr" href="/build/retrieval" className="text-primary hover:underline">Retrieval modes</Link>],
            ["Evaluation", "Tests whether the final answer is grounded and correct", <Link key="e" href="/build/evaluations" className="text-primary hover:underline">Evaluations</Link>],
          ]} />
        </div>
      </Panel>

      {/* Embeddings */}
      <Panel>
        <SectionHeader eyebrow="Semantic space" title="What are embeddings?" icon={Sparkles}
          description="Numeric representations of text or documents. Similar meanings sit closer together in embedding space, which is why embeddings power semantic search and RAG." />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-400">
          In this portfolio demo, vector retrieval uses deterministic local representations to demonstrate retrieval behavior without an
          external embedding API or vector database. In production, embeddings might come from OpenAI, MiniLM, Voyage, or Cohere models and
          be stored in a vector database. See the <Link href="/build/retrieval" className="text-primary hover:underline">embedding projector and retrieval modes</Link>.
        </p>
        <div className="mt-3">
          <T head={["Method", "Good for", "Limitation"]} rows={[
            ["BM25", "Exact keyword and term matching", "Misses semantic matches"],
            ["Embeddings", "Semantic similarity", "Can retrieve vague/broad neighbors"],
            ["Hybrid", "Lexical + semantic balance", "Needs tuning"],
            ["Reranking", "Final, governance-aware ordering", "Adds latency and complexity"],
          ]} />
        </div>
      </Panel>

      {/* RAG vs fine tuning */}
      <Panel>
        <SectionHeader eyebrow="Decisioning" title="Why RAG often comes before fine tuning" icon={GitCompare}
          description="For enterprise knowledge workflows, answers must be grounded in current, approved sources. Fine tuning changes behavior/tone/task performance, but doesn't solve source freshness, citations, or policy version control." />
        <T head={["Need", "Better first choice", "Why"]} rows={[
          ["Current policy answers", "RAG", "Sources change and citations matter"],
          ["Consistent tone/format", "Prompting or fine tuning", "Behavior pattern is stable"],
          ["Domain classification", "Fine tuning or traditional ML", "Labeled examples can teach the task"],
          ["Evidence-backed answers", "RAG", "Retrieval provides source grounding"],
          ["Multistep action workflow", "Agent/tools + governance", "Needs permissions, logs, approval"],
        ]} />
        <p className="mt-3 text-[12px] text-slatey-500">Fine tuning can be valuable, but it raises requirements around labeled data, splits, overfitting, regression, monitoring, and governance, which is why <Link href="/build/training" className="text-primary hover:underline">Training Readiness</Link> evaluates it before recommending it.</p>
      </Panel>

      {/* Framework placement */}
      <Panel>
        <SectionHeader eyebrow="Framework placement" title="Where PyTorch and TensorFlow fit" icon={Layers}
          description="ML frameworks used to build, train, fine tune, and experiment with models. They sit below this Command Center's operating layer." />
        <p className="max-w-3xl text-sm leading-relaxed text-slatey-400">
          This product does not use PyTorch or TensorFlow directly, it is a static portfolio demo focused on lifecycle decisions, not
          GPU-backed training. In production, outputs here could connect to ML workflows using PyTorch, TensorFlow, Hugging Face, MLflow,
          W&amp;B, SageMaker, Vertex AI, or Azure ML.
        </p>
        <div className="mt-3">
          <T highlight={5} head={["Layer", "Examples", "Role"]} rows={[
            ["Model development", "PyTorch, TensorFlow, JAX", "Build / train / fine tune models"],
            ["Experiment tracking", "MLflow, W&B", "Track runs, metrics, artifacts"],
            ["Model registry", "MLflow, SageMaker, Vertex AI", "Version and promote models"],
            ["Retrieval infrastructure", "Pinecone, Weaviate, pgvector, Milvus", "Store / search embeddings"],
            ["Observability", "Arize, WhyLabs, LangSmith", "Monitor drift, cost, quality"],
            ["AI Command Center", "This product", "Coordinate decisions, readiness, governance, value"],
          ]} />
        </div>
        <p className="mt-2 text-[11px] italic text-slatey-500">Explanatory content only, none of these tools are dependencies of this product.</p>
      </Panel>

      {/* Lifecycle integration */}
      <Panel>
        <SectionHeader eyebrow="Tie-back" title="How model internals connect to the lifecycle" icon={Workflow} />
        <T head={["Stage", "Model-internals relevance"]} rows={[
          ["Strategy", "Choose prompting, RAG, tools, fine tuning, traditional ML, or hybrid"],
          ["Data", "Prepare RAG corpus, eval datasets, training data, labels, metadata, telemetry"],
          ["Build/RAG", "Configure retrieval, embeddings, prompts, evals, and model behavior"],
          ["Operate", "Monitor latency, cost, drift, regression, incidents, rollback"],
          ["Govern", "Require evidence, controls, human review, auditability, risk decisions"],
          ["Realize", "Translate model quality + operational risk into adoption, ROI, leakage"],
        ]} />
      </Panel>

      {/* Demonstrates + boundary */}
      <Panel>
        <SectionHeader eyebrow="For reviewers" title="What this layer demonstrates" icon={Info} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard tone="info" title="Transformer awareness">Understands the architecture behind modern LLMs without pretending to rebuild one.</InsightCard>
          <InsightCard tone="info" title="Attention vs retrieval">Separates what happens inside the context window from how external evidence is selected.</InsightCard>
          <InsightCard tone="success" title="Embedding literacy">Connects embeddings to semantic search, vector/hybrid retrieval, and RAG quality.</InsightCard>
          <InsightCard tone="success" title="Fine tuning judgment">Picks RAG, prompting, fine tuning, ML, or hybrid by use case, not by default.</InsightCard>
          <InsightCard tone="warn" title="Framework placement">Shows where PyTorch/TensorFlow belong without becoming a training platform.</InsightCard>
          <InsightCard tone="warn" title="Lifecycle integration">Ties model concepts to evaluation, operations, governance, and value.</InsightCard>
        </div>
        <div className="mt-4 rounded-lg border border-line bg-slate-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">Model internals boundary</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slatey-400">
            This product does not train a transformer, implement an attention layer, or run PyTorch/TensorFlow workloads. It explains these
            concepts only where they affect enterprise AI decisions. The Command Center operates at the lifecycle layer: deciding what to build,
            what data is ready, how the system is evaluated, operated, and governed, and whether it creates business value.
          </p>
        </div>
      </Panel>
    </div>
  );
}
