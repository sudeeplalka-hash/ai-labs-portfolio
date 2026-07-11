import { DataSliceWriter } from "@/components/bridges/DataSliceWriter";
import { StageSubnav } from "@/components/shell/StageSubnav";

// The lab owns its navigation (stage-hub pattern): the rail is a pure stage
// switcher, so the Data sections render as an in-page subnav on every /data
// route. The shared StageSubnav renders kit's STAGE_SECTIONS, the same config
// the sidebar tree uses (R2.2: one nav truth).
export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DataSliceWriter />
      <StageSubnav stage="data" />
      {children}
    </div>
  );
}
