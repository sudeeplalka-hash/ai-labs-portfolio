import { DataSliceWriter } from "@/components/bridges/DataSliceWriter";
import { BuildSliceWriter } from "@/components/bridges/BuildSliceWriter";
import { GovSliceWriter } from "@/components/bridges/GovSliceWriter";

// Realize aggregates every upstream stage into one business case. We mount the
// slice writers here so the ROI traces correctly even when a visitor lands on
// /realize directly, data readiness, RAG quality, and the governance risk tier
// are all derived from the framed bet + each lab's own stored result.
// R2.2: Realize gets the shared in-page section nav (verdict / value / levers /
// adoption / dossier hash-sections + guide) from kit's STAGE_SECTIONS.
export default function RealizeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DataSliceWriter />
      <BuildSliceWriter />
      <GovSliceWriter />
      {children}
    </div>
  );
}
