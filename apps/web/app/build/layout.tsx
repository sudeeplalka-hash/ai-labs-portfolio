import { BuildSliceWriter } from "@/components/bridges/BuildSliceWriter";
import { BuildSubnav } from "@/components/shell/BuildSubnav";

// The lab owns its navigation (stage-hub pattern): the rail is a pure stage
// switcher, so the Build sections render as an in-page subnav on every /build route.
export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BuildSliceWriter />
      <BuildSubnav />
      {children}
    </div>
  );
}
