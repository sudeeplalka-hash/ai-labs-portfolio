"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DecisionSummary, Provenance } from "@labs/design-system";
import { OptionalProjector } from "./OptionalProjector";
import { Info, Loader2, FileCheck2, RotateCcw, Layers, CheckCircle2, AlertTriangle, XCircle, Circle, Sparkles, Cpu, Settings2 } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { DocumentIntakePanel } from "./DocumentIntakePanel";
import { ProcessingTimeline } from "./ProcessingTimeline";
import { ChunkExplorer } from "./ChunkExplorer";
import { LiveDocumentChat } from "./LiveDocumentChat";
import { RetrievedEvidencePanel } from "./RetrievedEvidencePanel";
import { EvaluatorFeedbackPanel } from "./EvaluatorFeedbackPanel";
import { LiveMetricsPanel } from "./LiveMetricsPanel";
import { LiveTraceSummary } from "./LiveTraceSummary";
import { LiveTraceHistory } from "./LiveTraceHistory";
import { QualityVerdictBanner } from "./QualityVerdictBanner";

import { TokenExplorer } from "./TokenExplorer";
import { TokenKpiStrip } from "./TokenKpiStrip";
import { analyzeTokens } from "@rag/lib/live-lab/tokenAnalysis";
import type { QueryStage } from "@rag/types/liveLab";
import { getSampleById, sampleDocuments } from "@rag/data/liveLabSampleDocuments";
import { estimateTokens } from "@rag/lib/live-lab/textUtils";
import { extractTextFromFile, FileExtractionError } from "@rag/lib/live-lab/fileExtraction";
import { chunkDocument } from "@rag/lib/live-lab/chunking";
import { getRetriever, DEFAULT_TOP_K } from "@rag/lib/live-lab/retrieval";
import { getAnswerGenerator } from "@rag/lib/live-lab/answerGeneration";
import { getLlmGenerator, loadLlmConfig, saveLlmConfig, clearLlmConfig, providerMeta, LlmError, type LlmConfig } from "@rag/lib/live-lab/llmProvider";
import { type Engine } from "./AnswerEngineSettings";
import { AnswerEnginePanel } from "./AnswerEnginePanel";
import { evaluateLiveAnswer } from "@rag/lib/live-lab/evaluation";
import { estimateCost } from "@rag/lib/live-lab/costing";
import { buildLiveTrace } from "@rag/lib/live-lab/trace";
import { aggregateLiveMetrics, loadStoredTraces, saveStoredTraces, clearStoredTraces } from "@rag/lib/live-lab/liveMetrics";
import type { DocumentChunk, LiveLabDocument, LiveRagLabTrace, LiveTraceStep, RetrievedLiveChunk } from "@rag/types/liveLab";
import { cn } from "@rag/lib/cn";


const INITIAL_STEPS: LiveTraceStep[] = [
  { step: "Document received", status: "Pending", durationMs: 0, explanation: "" },
  { step: "Text parsed", status: "Pending", durationMs: 0, explanation: "" },
  { step: "Document chunked", status: "Pending", durationMs: 0, explanation: "" },
  { step: "Chunks indexed", status: "Pending", durationMs: 0, explanation: "" },
  { step: "Ready for questions", status: "Pending", durationMs: 0, explanation: "" },
];

const MIN_CHARS = 200;

export function LiveLabView() {
  const [doc, setDoc] = useState<LiveLabDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [steps, setSteps] = useState<LiveTraceStep[]>(INITIAL_STEPS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [isAnswering, setIsAnswering] = useState(false);
  const [queryStage, setQueryStage] = useState<QueryStage | null>(null);
  const [traces, setTraces] = useState<LiveRagLabTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const [engine, setEngine] = useState<Engine>("simulated");
  const [llmConfig, setLlmConfig] = useState<LlmConfig | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTraces(loadStoredTraces());
    const cfg = loadLlmConfig();
    if (cfg) {
      setLlmConfig(cfg);
      setEngine("llm");
    }
  }, []);
  useEffect(() => {
    if (traces.length) saveStoredTraces(traces);
  }, [traces]);

  const flash = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  };

  const latestTrace = traces[0] ?? null;
  const selectedTrace = traces.find((t) => t.id === selectedTraceId) ?? null;
  // A new document starts without a verdict. History remains explicitly
  // inspectable, including after reload when the source document is not loaded.
  const documentTrace = doc ? traces.find((t) => t.documentId === doc.id) ?? null : null;
  const activeTrace = selectedTrace ?? documentTrace ?? (doc ? null : latestTrace);
  const historicalTrace = !!activeTrace && activeTrace.documentId !== doc?.id;
  const retrieved = activeTrace?.retrievedChunks ?? [];
  const documentRetrieved = historicalTrace ? [] : retrieved;

  const metrics = useMemo(() => aggregateLiveMetrics(traces), [traces]);
  const previousMetrics = useMemo(() => (traces.length > 1 ? aggregateLiveMetrics(traces.slice(1)) : null), [traces]);
  const tokenAnalysis = useMemo(
    () => (activeTrace && doc && !historicalTrace ? analyzeTokens(activeTrace, doc.estimatedTokens) : null),
    [activeTrace, doc, historicalTrace],
  );
  const sampleQuestions = useMemo(() => {
    if (!doc) return [];
    return sampleDocuments.find((s) => s.name === doc.name)?.sampleQuestions ?? [];
  }, [doc]);

  const updateStep = (index: number, patch: Partial<LiveTraceStep>) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  async function runPipeline(document: LiveLabDocument) {
    setIsProcessing(true);
    setReady(false);
    setChunks([]);
    setSteps(INITIAL_STEPS);
    flash("Parsing, chunking, and indexing…");

    updateStep(0, { status: "Running" });
    updateStep(0, { status: "Complete", durationMs: 0, explanation: "Document accepted.", technicalDetail: `${document.characterCount.toLocaleString()} chars, ~${document.estimatedTokens.toLocaleString()} tokens.` });

    updateStep(1, { status: "Running" });
    if (document.characterCount < MIN_CHARS) {
      updateStep(1, { status: "Failed", durationMs: 0, explanation: "Too short to demonstrate retrieval.", technicalDetail: `Only ${document.characterCount} characters.` });
      setIsProcessing(false);
      flash("That document is too short. Try a longer policy, report, or article.");
      return;
    }
    updateStep(1, { status: "Complete", durationMs: 0, explanation: "Whitespace normalized; structure detected." });

    updateStep(2, { status: "Running" });
    const t0 = performance.now();
    const created = chunkDocument(document);
    const chunkMs = Number((performance.now() - t0).toFixed(2));
    setChunks(created);
    updateStep(2, { status: "Complete", durationMs: chunkMs, explanation: `Split into ${created.length} chunks.`, technicalDetail: "Sentence aware chunking, 700 char target, 120 overlap." });

    updateStep(3, { status: "Running" });
    updateStep(3, { status: "Complete", durationMs: 0, explanation: "Chunks ready for retrieval.", technicalDetail: "BM25 scoring is computed when a question is asked; no separate index timing is measured." });

    updateStep(4, { status: "Complete", durationMs: 0, explanation: "Ready for questions." });
    setReady(true);
    setIsProcessing(false);
    flash(`Ready, ${created.length} chunks. Ask a question on the right.`);
  }

  function makeDocument(name: string, text: string, sourceType: LiveLabDocument["sourceType"], fileType: string): LiveLabDocument {
    return {
      id: `doc-${Date.now()}`,
      name,
      sourceType,
      fileType,
      rawText: text,
      characterCount: text.length,
      estimatedTokens: estimateTokens(text),
      createdAt: new Date().toISOString(),
    };
  }

  const onLoadText = (name: string, text: string, sourceType: "upload" | "paste", fileType: string) => {
    if (text.trim().length < 50) {
      setLoadError("That document is too short. Paste or upload a longer text-based document.");
      return;
    }
    setLoadError(null);
    const document = makeDocument(name, text, sourceType, fileType);
    setSelectedTraceId(null);
    setDoc(document);
    runPipeline(document);
  };

  async function onLoadFile(file: File) {
    setLoadError(null);
    setExtracting(true);
    flash(`Reading "${file.name}"…`);
    try {
      const { text, fileType } = await extractTextFromFile(file);
      setExtracting(false);
      onLoadText(file.name, text, "upload", fileType);
    } catch (err) {
      setExtracting(false);
      setLoadError(err instanceof FileExtractionError ? err.message : "Couldn't read that file. Try .txt, .md, .pdf, or .docx.");
      flash("Couldn't read that file.");
    }
  }

  const onLoadSample = (id: string) => {
    const sample = getSampleById(id);
    if (!sample) return;
    setLoadError(null);
    const document = makeDocument(sample.name, sample.rawText, "sample", sample.fileType);
    setSelectedTraceId(null);
    setDoc(document);
    runPipeline(document);
  };

  const onReset = () => {
    setDoc(null);
    setChunks([]);
    setSteps(INITIAL_STEPS);
    setReady(false);
    setLoadError(null);
    setToast("");
  };

  async function onAsk(question: string) {
    if (!doc || !ready || isAnswering) return;
    try {
    setIsAnswering(true);
    setQueryStage("retrieving");
    const tR = performance.now();
    const retrievedChunks: RetrievedLiveChunk[] = getRetriever("lexical").retrieve(question, chunks, DEFAULT_TOP_K);
    const retrieveMs = Number((performance.now() - tR).toFixed(2));

    setQueryStage("generating");
    const tG = performance.now();
    let answer;
    let engineLabel: string | undefined;
    const useLlm = engine === "llm" && !!llmConfig;
    if (useLlm && llmConfig) {
      try {
        answer = await getLlmGenerator(llmConfig).generateAnswer({ question, retrievedChunks });
        engineLabel = `${providerMeta(llmConfig.provider).label} · ${llmConfig.model}`;
      } catch (err) {
        const msg = err instanceof LlmError ? err.message : "The LLM call failed.";
        flash(`${msg} Falling back to the simulated engine.`);
        answer = await getAnswerGenerator().generateAnswer({ question, retrievedChunks });
        engineLabel = "Simulated · LLM call failed, fell back";
      }
    } else {
      answer = await getAnswerGenerator().generateAnswer({ question, retrievedChunks });
    }
    answer = { ...answer, engineLabel };
    const withUsage = retrievedChunks.map((c) => ({ ...c, usedInAnswer: answer.citations.includes(c.citationLabel) }));
    const generateMs = Number((performance.now() - tG).toFixed(2));

    setQueryStage("evaluating");
    const tE = performance.now();
    const evaluation = evaluateLiveAnswer(question, withUsage, answer);
    const cost = estimateCost(question, withUsage, answer.answer);
    const evaluateMs = Number((performance.now() - tE).toFixed(2));

    const trace = buildLiveTrace({
      documentId: doc.id,
      documentName: doc.name,
      question,
      retrievedChunks: withUsage,
      generatedAnswer: answer,
      evaluation,
      stepDurations: { retrieve: retrieveMs, generate: generateMs, evaluate: evaluateMs },
      estimatedCost: cost.estimatedCost,
    });

    setTraces((prev) => [trace, ...prev].slice(0, 50));
    setSelectedTraceId(null);
    setQueryStage(null);
    setIsAnswering(false);
    flash(`Quality gate: ${evaluation.qualityGateStatus}. Metrics updated below.`);
    } catch {
      flash("The question could not be evaluated. Your document and question are retained; try again or choose a sample question.");
    } finally { setQueryStage(null); setIsAnswering(false); }
  }

  const onSaveEngine = (e: Engine, cfg: LlmConfig | null) => {
    setEngine(e);
    if (cfg) {
      setLlmConfig(cfg);
      saveLlmConfig(cfg);
    }
    flash(e === "llm" && cfg ? `Answer engine: ${providerMeta(cfg.provider).label} · ${cfg.model}.` : "Answer engine: Simulated (no key).");
  };
  const onClearEngine = () => {
    clearLlmConfig();
    setLlmConfig(null);
    setEngine("simulated");
    flash("API key removed. Using the simulated engine.");
  };

  const handleClearHistory = () => {
    clearStoredTraces();
    setTraces([]);
    flash("Live metrics history cleared.");
  };

  return (
    <div className="space-y-6">
      <DecisionSummary label={historicalTrace ? `Saved run · ${activeTrace?.documentName}` : "Ask → Evidence → Verdict"} title={activeTrace ? `${historicalTrace ? "Saved run quality gate" : "Quality gate"}: ${activeTrace.evaluation.qualityGateStatus}` : ready ? "Your document is ready. Ask a specific question." : "Start with a sample or your own document."} explanation={activeTrace ? activeTrace.evaluation.evaluatorSummary : "Inspect the source passages behind each answer, then decide whether the evidence supports it."} nextAction={activeTrace ? <a href="#rag-evidence" className="underline">Inspect cited evidence ↓</a> : undefined} />
      <Provenance mode={(activeTrace?.generatedAnswer.mode ?? engine) === "llm" ? "API answer engine · local evaluation" : "Simulated answer · real local retrieval"} input={activeTrace ? `${historicalTrace ? "Saved run" : "Current document"}: ${activeTrace.documentName}` : doc ? `${doc.sourceType}: ${doc.name}` : "No document loaded"} method="BM25 retrieval and heuristic evaluation. Computation times exclude presentation delays; displayed costs are estimates." />
      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.06] px-3.5 py-2 text-sm text-ink">
          {isProcessing || isAnswering ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : <Info className="h-4 w-4 shrink-0 text-primary" />}
          <span role="status">{toast}</span>
        </div>
      )}

      {/* Answer engine selector, Simulated / Bring your own API key inline */}
      <AnswerEnginePanel engine={engine} config={llmConfig} onSave={onSaveEngine} onClear={onClearEngine} />

      {/* PRIMARY: document + chat side by side */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        {!doc ? (
          <DocumentIntakePanel
            document={null}
            isProcessing={isProcessing}
            extracting={extracting}
            loadError={loadError}
            onLoadFile={onLoadFile}
            onLoadText={onLoadText}
            onLoadSample={onLoadSample}
            onReset={onReset}
          />
        ) : (
          <DocumentColumn doc={doc} chunkCount={chunks.length} ready={ready} steps={steps} onReset={onReset} />
        )}

        <LiveDocumentChat
          ready={ready}
          isAnswering={isAnswering}
          queryStage={queryStage}
          sampleQuestions={sampleQuestions}
          latestQuestion={activeTrace?.question}
          latestAnswer={activeTrace?.generatedAnswer}
          historicalDocument={historicalTrace ? activeTrace?.documentName : undefined}
          currentDocument={doc?.name}
          onAsk={onAsk}
        />
      </div>

      {/* RESULT: verdict + immediate metrics */}
      {activeTrace && <QualityVerdictBanner evaluation={activeTrace.evaluation} question={activeTrace.question} />}
      {traces.length > 0 && <LiveMetricsPanel metrics={metrics} previous={previousMetrics} />}

      {/* PROJECTOR */}


      {/* BEHIND THE SCENES */}
      {(chunks.length > 0 || activeTrace) && (
        <div>
          <SectionHeader title="Behind the scenes" description="Retrieved evidence, document chunks, and the processing steps." icon={Layers} />
          <div className="space-y-6">
            {activeTrace && (
              <div className="grid min-w-0 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
                <div id="rag-evidence" className="min-w-0 scroll-mt-24"><RetrievedEvidencePanel chunks={retrieved} /></div>
                <EvaluatorFeedbackPanel evaluation={activeTrace.evaluation} />
              </div>
            )}
            {chunks.length > 0 && <div className="grid min-w-0 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
              <ChunkExplorer chunks={chunks} retrieved={documentRetrieved} />
              <ProcessingTimeline steps={steps} />
            </div>}
            {tokenAnalysis && (
              <div className="space-y-4">
                <TokenKpiStrip analysis={tokenAnalysis} />
                <TokenExplorer analysis={tokenAnalysis} />
              </div>
            )}
            {activeTrace && <LiveTraceSummary trace={activeTrace} />}
          </div>
        </div>
      )}

      {chunks.length > 0 && <OptionalProjector chunks={chunks} trace={historicalTrace ? null : activeTrace} />}

      {/* HISTORY */}
      {traces.length > 0 && (
        <>
          <LiveTraceHistory traces={traces} activeId={activeTrace?.id ?? null} onSelect={setSelectedTraceId} />
          <button onClick={handleClearHistory} className="text-xs text-slatey-500 underline-offset-2 hover:text-slatey-300 hover:underline">
            Clear live metrics history
          </button>
        </>
      )}

    </div>
  );
}

const STEP_ICON = {
  Complete: { Icon: CheckCircle2, color: "text-emerald-600" },
  Running: { Icon: Loader2, color: "text-primary animate-spin" },
  Warning: { Icon: AlertTriangle, color: "text-amber-600" },
  Failed: { Icon: XCircle, color: "text-rose-600" },
  Pending: { Icon: Circle, color: "text-slatey-500" },
} as const;

// Compact document summary shown in the left column once a doc is loaded.
function DocumentColumn({
  doc,
  chunkCount,
  ready,
  steps,
  onReset,
}: {
  doc: LiveLabDocument;
  chunkCount: number;
  ready: boolean;
  steps: LiveTraceStep[];
  onReset: () => void;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <FileCheck2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{doc.name}</p>
            <p className="text-xs text-slatey-400">
              {doc.characterCount.toLocaleString()} chars · ~{doc.estimatedTokens.toLocaleString()} tokens · .{doc.fileType}
            </p>
          </div>
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-slatey-300 hover:bg-slate-100">
          <RotateCcw className="h-4 w-4" /> New
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Chunks" value={String(chunkCount || "…")} />
        <Stat label="Status" value={ready ? "Ready" : "Processing"} ok={ready} />
        <Stat label="Source" value={doc.sourceType} />
      </div>

      <div className="mt-4 space-y-1.5">
        {steps.map((s, i) => {
          const { Icon, color } = STEP_ICON[s.status];
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
              <span className={s.status === "Pending" ? "text-slatey-500" : "text-slatey-300"}>{s.step}</span>
              {s.status !== "Pending" && s.durationMs > 0 && <span className="ml-auto font-mono text-[11px] text-slatey-500">{s.durationMs}ms</span>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-2.5">
      <p className="stat-label">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold capitalize", ok ? "text-emerald-700" : "text-ink")}>{value}</p>
    </div>
  );
}
