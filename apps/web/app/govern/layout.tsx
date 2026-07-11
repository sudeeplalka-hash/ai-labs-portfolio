import { GovSliceWriter } from "@/components/bridges/GovSliceWriter";
import { GovSampleBanner } from "@/components/govern/GovSampleBanner";
import { StageSubnav } from "@/components/shell/StageSubnav";

// Nested layout for the Governance section. The lab owns its navigation
// (stage-hub pattern): the grouped Govern sections render from kit's
// STAGE_SECTIONS via the shared StageSubnav (R2.2), the same config the
// sidebar tree uses. The sample-data banner renders on every legacy subroute
// (not the live landing).
export default function GovernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <GovSliceWriter />
      <StageSubnav stage="govern" />
      <GovSampleBanner />
      {children}
    </div>
  );
}
