"use client";

import { useMemo, useState } from "react";
import { Orbit, Boxes, Tags } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { EmbeddingProjector3D, type ProjPoint, type ClusterLabel } from "./EmbeddingProjector3D";
import { buildProjector } from "@rag/lib/live-lab/embeddings";
import { contentWords } from "@rag/lib/live-lab/textUtils";
import { cn } from "@rag/lib/cn";
import type { DocumentChunk, LiveRagLabTrace } from "@rag/types/liveLab";

type Mode = "chunks" | "keywords";

export function EmbeddingProjectorPanel({ chunks, trace }: { chunks: DocumentChunk[]; trace: LiveRagLabTrace | null }) {
  const [mode, setMode] = useState<Mode>("chunks");
  const model = useMemo(() => (chunks.length ? buildProjector(chunks) : null), [chunks]);

  const { chunkPoints, keywordPoints, clusterLabels, query } = useMemo(() => {
    if (!model)
      return { chunkPoints: [] as ProjPoint[], keywordPoints: [] as ProjPoint[], clusterLabels: [] as ClusterLabel[], query: null };

    const retrievedById = new Map((trace?.retrievedChunks ?? []).map((c) => [c.id, c]));
    const chunkPoints: ProjPoint[] = model.points.map((p) => {
      const r = retrievedById.get(p.chunkId);
      const chunk = chunks.find((c) => c.id === p.chunkId);
      return {
        chunkId: p.chunkId, x: p.x, y: p.y, z: p.z,
        color: model.colorOf(p.section), section: p.section,
        preview: chunk ? chunk.text.slice(0, 240) : "",
        retrieved: !!r, usedInAnswer: r?.usedInAnswer ?? false, citationLabel: r?.citationLabel, relevance: r?.relevanceScore,
      };
    });

    // Cluster centroids (also used to color keyword points by nearest group).
    const groups = new Map<string, { color: string; x: number; y: number; z: number; n: number }>();
    for (const p of model.points) {
      const g = groups.get(p.section) ?? { color: model.colorOf(p.section), x: 0, y: 0, z: 0, n: 0 };
      g.x += p.x; g.y += p.y; g.z += p.z; g.n += 1;
      groups.set(p.section, g);
    }
    const centroids = [...groups.values()].map((g) => ({ color: g.color, x: g.x / g.n, y: g.y / g.n, z: g.z / g.n }));
    const clusterLabels: ClusterLabel[] = [...groups.entries()]
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 6)
      .map(([label, g]) => ({ text: label.length > 18 ? label.slice(0, 17) + "…" : label, color: g.color, x: g.x / g.n, y: g.y / g.n, z: g.z / g.n }));

    const qSet = new Set(trace ? contentWords(trace.question).map((w) => w.replace(/[^a-z0-9]/g, "")) : []);
    const keywordPoints: ProjPoint[] = model.keywordPoints.map((k) => {
      let color = centroids[0]?.color ?? "#1f6fc4";
      let best = Infinity;
      for (const c of centroids) {
        const d = (c.x - k.x) ** 2 + (c.y - k.y) ** 2 + (c.z - k.z) ** 2;
        if (d < best) { best = d; color = c.color; }
      }
      const matched = qSet.has(k.text);
      return {
        chunkId: `kw-${k.text}`, x: k.x, y: k.y, z: k.z, color, section: k.text,
        preview: `Keyword · appears in ${k.weight} passage${k.weight === 1 ? "" : "s"}${matched ? " · in your question" : ""}.`,
        retrieved: matched, usedInAnswer: matched, label: k.text,
      };
    });

    const query = trace ? model.projectText(trace.question) : null;
    return { chunkPoints, keywordPoints, clusterLabels, query };
  }, [model, trace, chunks]);

  if (!model || chunkPoints.length === 0) return null;

  const hasKeywords = keywordPoints.length > 0;
  const isKw = mode === "keywords" && hasKeywords;
  const colorByLabel = model.colorBy === "section" ? "document section" : "topic cluster";

  return (
    <Panel>
      <SectionHeader
        title="Embedding Projector — Document in 3D"
        description={
          isKw
            ? "The document's top keywords placed in 3D — terms that co-occur sit near each other. Words from your question are highlighted."
            : `Every chunk placed in 3D by similarity (TF-IDF → PCA), colored by ${colorByLabel}. Ask a question and the retrieved chunks light up with beams to the query.`
        }
        icon={Orbit}
        action={
          hasKeywords ? (
            <div className="inline-flex gap-1 rounded-lg border border-line bg-white p-0.5">
              {(
                [
                  { id: "chunks", label: "Chunks", icon: Boxes },
                  { id: "keywords", label: "Keywords", icon: Tags },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === t.id ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      <EmbeddingProjector3D points={isKw ? keywordPoints : chunkPoints} query={query} clusterLabels={isKw ? [] : clusterLabels} />

      {!isKw && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {model.sections.slice(0, 12).map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-slatey-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="max-w-[180px] truncate">{s.label}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slatey-400">
        {isKw ? (
          <>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-ink" /> in your question</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-white ring-1 ring-ink" /> your question</span>
            <span className="text-slatey-500">Top keywords by frequency · positioned by co-occurrence.</span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-ink" /> retrieved &amp; cited</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-slate-400" /> retrieved</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-white ring-1 ring-ink" /> your question</span>
            <span className="text-slatey-500">Lexical projection — neural embeddings drop into the same view.</span>
          </>
        )}
      </div>
    </Panel>
  );
}
