"use client";

import { useCallback, useRef, useState } from "react";
import {
  Boxes,
  UploadCloud,
  FileUp,
  Sparkles,
  RotateCcw,
  Copy,
  AlertTriangle,
  ShieldAlert,
  CircleCheck,
  Layers,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { analyzeCorpus, type CorpusReport, type DupPair } from "@data/lib/prep/corpus";
import { getProfile, type ProfileId } from "@data/lib/prep/profiles";
import { extractTextFromFile, CORPUS_UPLOAD_ACCEPT, FileExtractionError } from "@data/lib/prep/fileExtraction";
import { recordSessions } from "@data/lib/live/session";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge, type BadgeColor } from "@data/components/common/Badge";
import { RuleProfileSelector } from "./RuleProfileSelector";
import { CorpusStarMap } from "./CorpusStarMap";
import { cn } from "@data/lib/cn";

interface Input {
  name: string;
  text: string;
  size: number;
}

const PAIR_BADGE: Record<DupPair["kind"], { color: BadgeColor; label: string; icon: LucideIcon }> = {
  duplicate: { color: "rose", label: "Duplicate", icon: Copy },
  "stale-version": { color: "amber", label: "Stale version", icon: AlertTriangle },
  "near-duplicate": { color: "slate", label: "Near-duplicate", icon: Layers },
};

const GATE_SEG: { key: "approved" | "conditional" | "hold" | "rejected"; label: string; bg: string }[] = [
  { key: "approved", label: "Approved", bg: "bg-status-healthy" },
  { key: "conditional", label: "Conditional", bg: "bg-status-watch" },
  { key: "hold", label: "Hold", bg: "bg-status-risk" },
  { key: "rejected", label: "Rejected", bg: "bg-status-critical" },
];

export function CorpusView() {
  const [inputs, setInputs] = useState<Input[] | null>(null);
  const [report, setReport] = useState<CorpusReport | null>(null);
  const [profileId, setProfileId] = useState<ProfileId>("general");
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback((ins: Input[], pid: ProfileId) => {
    setRunning(true);
    setInputs(ins);
    // brief async so the loading state paints
    setTimeout(() => {
      const rep = analyzeCorpus(ins, pid);
      setReport(rep);
      setRunning(false);
      recordSessions(
        rep.files.map((f) => ({
          name: f.name,
          kind: f.report.kind,
          source: "corpus" as const,
          profileId: pid,
          score: f.score,
          gate: f.gate.gate,
          piiHits: f.report.pii.reduce((a, b) => a + b.count, 0),
          chunks: f.report.chunk.count,
          estTokens: f.report.chunk.estTokens,
          rows: f.report.profile.kind === "tabular" ? f.report.profile.rows : undefined,
          dups: f.report.profile.kind === "tabular" ? f.report.profile.dups : undefined,
          missingPct: f.report.profile.kind === "tabular" ? Math.round(f.report.profile.missingPct) : undefined,
        })),
      );
    }, 300);
  }, []);

  const loadSampleCorpus = () => {
    const ins = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length }));
    setSelectedId(null);
    analyze(ins, profileId);
  };

  const onFiles = (list: FileList) => {
    const arr = Array.from(list);
    setSelectedId(null);
    setParseErrors([]);
    setRunning(true);
    // Extract text from each file (PDF/DOCX parsed in-browser; others read as text).
    // Failures are collected and surfaced rather than aborting the whole batch.
    void Promise.all(
      arr.map((f) =>
        extractTextFromFile(f)
          .then((text) => ({ ok: true as const, input: { name: f.name, text, size: f.size } }))
          .catch((err) => ({
            ok: false as const,
            message: err instanceof FileExtractionError ? err.message : `Couldn't read "${f.name}".`,
          })),
      ),
    ).then((results) => {
      const ins = results.filter((r) => r.ok).map((r) => (r as { input: Input }).input);
      const errs = results.filter((r) => !r.ok).map((r) => (r as { message: string }).message);
      setParseErrors(errs);
      if (ins.length) {
        analyze(ins, profileId);
      } else {
        setRunning(false);
      }
    });
  };

  const changeProfile = (id: ProfileId) => {
    setProfileId(id);
    if (inputs) setReport(analyzeCorpus(inputs, id));
  };

  const reset = () => {
    setInputs(null);
    setReport(null);
    setSelectedId(null);
    setParseErrors([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const selected = report && selectedId ? report.files.find((f) => f.id === selectedId) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: intake */}
      <div className="space-y-6 lg:col-span-1">
        <Panel>
          <SectionHeader title="Build a corpus" description="Profile many files at once" icon={UploadCloud} />
          <button
            onClick={loadSampleCorpus}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-dark"
          >
            <Sparkles className="h-4 w-4" /> Load sample corpus (6 files)
          </button>
          <label
            htmlFor="corpusInput"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className={cn(
              "block cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
              dragOver ? "border-primary bg-primary-soft" : "border-line bg-slate-50/60 hover:bg-slate-50",
            )}
          >
            <FileUp className="mx-auto h-6 w-6 text-slatey-400" />
            <div className="mt-1.5 text-sm font-medium text-ink">
              Drop multiple files or <span className="text-primary">browse</span>
            </div>
            <div className="mt-0.5 text-xs text-slatey-400">CSV · JSON · TXT · MD · PDF · DOCX</div>
            <input
              ref={fileRef}
              id="corpusInput"
              type="file"
              multiple
              accept={CORPUS_UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => e.target.files && onFiles(e.target.files)}
            />
          </label>
          {parseErrors.length > 0 && (
            <div className="mt-3 rounded-lg border border-status-risk/30 bg-status-risk/[0.06] p-2.5 text-[11px] leading-relaxed text-status-risk">
              <div className="mb-1 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> {parseErrors.length} file{parseErrors.length > 1 ? "s" : ""} skipped
              </div>
              <ul className="list-disc space-y-0.5 pl-4">
                {parseErrors.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {report && (
            <button onClick={reset} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slatey-300 hover:text-slatey-100">
              <RotateCcw className="h-3.5 w-3.5" /> Clear corpus
            </button>
          )}
        </Panel>

        {report && (
          <Panel>
            <SectionHeader title="Compliance profile" description="Re scores the whole corpus" icon={SlidersHorizontal} />
            <RuleProfileSelector value={profileId} onChange={changeProfile} />
            <p className="mt-2 font-mono text-[11px] text-slatey-400">Active: {getProfile(profileId).name}</p>
          </Panel>
        )}
      </div>

      {/* RIGHT */}
      <div className="space-y-6 lg:col-span-2">
        {!report && !running && <EmptyCorpus onLoad={loadSampleCorpus} />}
        {running && <div className="panel p-10 text-center text-sm text-slatey-300">Analyzing corpus…</div>}

        {report && (
          <>
            <CorpusHealth report={report} />

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel>
                <SectionHeader title="Corpus map" description="Clusters of similar, duplicate & stale documents" icon={Boxes} />
                <CorpusStarMap files={report.files} pairs={report.pairs} selectedId={selectedId} onSelect={setSelectedId} />
              </Panel>

              <Panel>
                <SectionHeader title="Conflicts & duplicates" description="Cross file issues that single file checks can't catch" icon={Copy} />
                {report.pairs.length === 0 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-700">
                    No duplicate or conflicting documents detected across the corpus.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {report.pairs.map((p, i) => {
                      const b = PAIR_BADGE[p.kind];
                      return (
                        <div key={i} className="rounded-lg border border-line p-3">
                          <div className="flex items-center gap-2">
                            <b.icon className="h-4 w-4 text-slatey-300" />
                            <Badge color={b.color}>{b.label}</Badge>
                            <span className="font-mono text-[11px] text-slatey-400">{Math.round(p.similarity * 100)}%</span>
                          </div>
                          <div className="mt-1.5 font-mono text-[12px] text-slatey-100">
                            {p.aName} <span className="text-slatey-400">↔</span> {p.bName}
                          </div>
                          <div className="mt-1 text-[13px] leading-snug text-slatey-300">{p.note}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>

            {/* File tray */}
            <Panel>
              <SectionHeader title="Files in this corpus" description="Click a file to inspect its gate and issues" icon={Layers} />
              {selected && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary-soft/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-ink">{selected.name}</span>
                    <Badge color={selected.gate.color}>{selected.gate.gate}</Badge>
                    <span className="font-mono text-[11px] text-slatey-400">score {selected.score} · {selected.tokens.toLocaleString()} tokens</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-slatey-300">{selected.gate.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.report.checks
                      .filter((c) => c.level !== "healthy")
                      .slice(0, 4)
                      .map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slatey-200 ring-1 ring-inset ring-line">
                          {c.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {report.files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedId(f.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      f.id === selectedId ? "border-primary/40 bg-primary-soft/40" : "border-line bg-white hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[12px] text-slatey-100">{f.name}</span>
                      <Badge color={f.gate.color}>{f.score}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slatey-400">
                      {f.gate.gate === "Approved" ? (
                        <CircleCheck className="h-3.5 w-3.5 text-status-healthy" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 text-status-risk" />
                      )}
                      {f.gate.gate}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCorpus({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="panel p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <Boxes className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">Build a corpus to see the bigger picture</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slatey-300">
        Single-file checks can&apos;t catch duplicates, stale versions, or conflicting sources. Load a few files and the
        Corpus Builder maps how they relate and rolls up a corpus-readiness score.
      </p>
      <button
        onClick={onLoad}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-primary-dark"
      >
        <Sparkles className="h-4 w-4" /> Load sample corpus
      </button>
    </div>
  );
}

function CorpusHealth({ report }: { report: CorpusReport }) {
  const h = report.health;
  const segs = [
    { ...GATE_SEG[0], n: h.approved },
    { ...GATE_SEG[1], n: h.conditional },
    { ...GATE_SEG[2], n: h.hold },
    { ...GATE_SEG[3], n: h.rejected },
  ];
  const metrics: { label: string; value: string; color: BadgeColor }[] = [
    { label: "Corpus ready", value: `${h.readyPct}%`, color: h.readyPct >= 70 ? "emerald" : h.readyPct >= 40 ? "amber" : "orange" },
    { label: "Avg score", value: String(h.avgScore), color: "blue" },
    { label: "Files", value: String(h.total), color: "blue" },
    { label: "Duplicates", value: String(h.duplicates), color: h.duplicates ? "rose" : "emerald" },
    { label: "Conflicts", value: String(h.conflicts), color: h.conflicts ? "amber" : "emerald" },
  ];
  return (
    <Panel>
      <SectionHeader title="Corpus health" description="What the whole batch looks like before it reaches the RAG Evaluator" icon={Boxes} />
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-line bg-slate-50 p-3">
            <div className="stat-label">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-ink">{m.value}</div>
            <div className="mt-1">
              <Badge color={m.color}>
                {m.label === "Corpus ready" ? "approved / total" : m.label === "Conflicts" ? "stale versions" : "across corpus"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="stat-label mb-1.5">Gate distribution</div>
        <div className="flex h-6 w-full overflow-hidden rounded-md bg-slate-100">
          {segs.map(
            (s) =>
              s.n > 0 && (
                <div
                  key={s.key}
                  className={cn("flex items-center justify-center text-[10px] font-semibold text-white", s.bg)}
                  style={{ width: `${(s.n / h.total) * 100}%` }}
                  title={`${s.label}: ${s.n}`}
                >
                  {s.n}
                </div>
              ),
          )}
        </div>
      </div>
    </Panel>
  );
}
