import { GovSliceWriter } from "@/components/bridges/GovSliceWriter";
import { GovSampleBanner } from "@/components/govern/GovSampleBanner";

// Nested layout for the Governance section. Govern's sections no longer render here:
// they moved INTO the Header band (see Header.tsx / StageNav.tsx). Govern is Build's
// structural twin — three acts plus reference — so it gets the three-column pipeline,
// still driven by kit's STAGE_SECTIONS (R2.2 holds: one nav config, one nav truth).
// The sample-data banner renders on every legacy subroute (not the live landing).
export default function GovernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <GovSliceWriter />
      <GovSampleBanner />
      {children}
    </div>
  );
}
