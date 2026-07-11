import { BuildSliceWriter } from "@/components/bridges/BuildSliceWriter";
import { StageSubnav } from "@/components/shell/StageSubnav";

// The lab owns its navigation (stage-hub pattern): the rail is a pure stage
// switcher, so the Build sections render as an in-page subnav on every /build
// route. The shared StageSubnav renders kit's STAGE_SECTIONS grouped exactly
// like the sidebar tree (R2.2: the flat 10-item row that diverged is gone).
export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BuildSliceWriter />
      <StageSubnav stage="build" />
      {children}
    </div>
  );
}
