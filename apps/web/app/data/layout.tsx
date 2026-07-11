import { DataSliceWriter } from "@/components/bridges/DataSliceWriter";
import { DataSubnav } from "@/components/shell/DataSubnav";

// The lab owns its navigation (stage-hub pattern): the rail is a pure stage
// switcher, so the Data sections render as an in-page subnav on every /data route.
export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DataSliceWriter />
      <DataSubnav />
      {children}
    </div>
  );
}
