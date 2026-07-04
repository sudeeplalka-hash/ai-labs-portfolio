"use client";

import { useRef, useState } from "react";
import { Upload, ClipboardPaste, RotateCcw, FileCheck2, Sparkles, FileText, Loader2, AlertCircle } from "lucide-react";
import { sampleDocuments } from "@rag/data/liveLabSampleDocuments";
import { estimateTokens } from "@rag/lib/live-lab/textUtils";
import { SUPPORTED_UPLOAD_ACCEPT } from "@rag/lib/live-lab/fileExtraction";
import type { LiveLabDocument } from "@rag/types/liveLab";

interface Props {
  document: LiveLabDocument | null;
  isProcessing: boolean;
  extracting?: boolean;
  loadError?: string | null;
  onLoadFile: (file: File) => void;
  onLoadText: (name: string, text: string, sourceType: "upload" | "paste", fileType: string) => void;
  onLoadSample: (id: string) => void;
  onReset: () => void;
  compact?: boolean;
}

export function DocumentIntakePanel({
  document,
  isProcessing,
  extracting,
  loadError,
  onLoadFile,
  onLoadText,
  onLoadSample,
  onReset,
  compact,
}: Props) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = isProcessing || !!extracting;

  // Compact status bar once a document is loaded.
  if (document && compact) {
    return (
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/25">
            <FileCheck2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{document.name}</p>
            <p className="text-xs text-slatey-400">
              {document.characterCount.toLocaleString()} chars · ~{document.estimatedTokens.toLocaleString()} tokens · .{document.fileType}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-slatey-300 hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" /> New document
        </button>
      </div>
    );
  }

  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-cyan" />
        <h2 className="text-base font-semibold text-ink">Start with a sample policy</h2>
        <span className="text-sm text-slatey-500">— one click to begin</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {sampleDocuments.map((doc) => (
          <button
            key={doc.id}
            disabled={busy}
            onClick={() => onLoadSample(doc.id)}
            className="group flex flex-col rounded-xl border border-line bg-navy-850/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-cyan" />
              <span className="text-sm font-semibold text-ink">{doc.name}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slatey-400">{doc.description}</p>
            <span className="mt-3 text-xs font-medium text-accent-cyan opacity-0 transition-opacity group-hover:opacity-100">
              Load &amp; chunk →
            </span>
          </button>
        ))}
      </div>

      <div className="my-5 flex items-center gap-3 text-sm text-slatey-500">
        <span className="h-px flex-1 bg-slate-100" /> or bring your own <span className="h-px flex-1 bg-slate-100" />
      </div>

      {loadError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && !busy) onLoadFile(file);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-navy-950/40 px-4 py-6 text-center"
        >
          {extracting ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-accent-cyan" />
              <p className="text-sm font-medium text-ink">Reading your file…</p>
              <p className="text-xs text-slatey-500">Extracting text from PDF / Word</p>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-slatey-400" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent-cyan ring-1 ring-inset ring-accent/30 hover:bg-accent/25 disabled:opacity-50"
              >
                Choose a file
              </button>
              <p className="text-xs text-slatey-500">or drag &amp; drop · PDF, Word (.docx), .txt, .md</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={SUPPORTED_UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLoadFile(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="rounded-xl border border-line bg-navy-950/40 p-4">
          {!showPaste ? (
            <button
              onClick={() => setShowPaste(true)}
              disabled={busy}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-slatey-300 hover:text-ink disabled:opacity-50"
            >
              <ClipboardPaste className="h-6 w-6 text-slatey-400" />
              <span className="text-sm font-medium">Paste document text</span>
              <span className="text-xs text-slatey-500">Click to open a text box</span>
            </button>
          ) : (
            <div>
              <textarea
                autoFocus
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste a policy, SOP, guide, or knowledge-base article…"
                rows={4}
                className="w-full resize-y rounded-lg border border-line bg-navy-950/60 p-3 text-sm text-ink placeholder:text-slatey-600 focus:border-accent/50 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slatey-500">
                  {pasteText.length.toLocaleString()} chars · ~{estimateTokens(pasteText).toLocaleString()} tokens
                </span>
                <button
                  onClick={() => onLoadText("Pasted Document", pasteText, "paste", "txt")}
                  disabled={busy || pasteText.trim().length < 50}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-navy-950 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Process text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
