import { GovSliceWriter } from "@/components/bridges/GovSliceWriter";
import { GovSampleBanner } from "@/components/govern/GovSampleBanner";
import { GovSubnav } from "@/components/shell/GovSubnav";

// Nested layout for the Governance section. The lab owns its navigation
// (stage-hub pattern): the rail is a pure stage switcher, so the grouped
// Govern sections render as an in-page subnav on every /govern route. The
// sample-data banner renders on every legacy subroute (not the live landing).
export default function GovernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <GovSliceWriter />
      <GovSubnav />
      <GovSampleBanner />
      {children}
    </div>
  );
}
