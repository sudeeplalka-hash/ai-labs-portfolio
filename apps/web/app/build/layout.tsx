import { BuildSliceWriter } from "@/components/bridges/BuildSliceWriter";

// The Build sections no longer render here. They moved INTO the Header, which is now
// a single sticky band (identity left, stage nav right) instead of a third stacked
// card inside <main>. See Header.tsx / StageNav.tsx. The nav still renders from kit's
// STAGE_SECTIONS, so it cannot diverge from the sidebar tree (R2.2 holds).
export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BuildSliceWriter />
      {children}
    </div>
  );
}
