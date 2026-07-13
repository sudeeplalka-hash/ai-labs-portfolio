import { DataSliceWriter } from "@/components/bridges/DataSliceWriter";

// The Data sections no longer render here. They moved INTO the Header, which is now a
// single sticky band (identity left, stage nav right) instead of a third stacked card
// inside <main>. Data is a flat five-item list, so it gets the chip row, not the
// three-column pipeline — see StageNav.tsx. Still driven by kit's STAGE_SECTIONS, so
// it cannot diverge from the sidebar tree (R2.2 holds).
export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DataSliceWriter />
      {children}
    </div>
  );
}
