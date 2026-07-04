import { GovSliceWriter } from "@/components/bridges/GovSliceWriter";
import { GovSampleBanner } from "@/components/govern/GovSampleBanner";

// Nested layout for the Governance section. Navigation now lives in the left
// sidebar (grouped, collapsible), so no in-page subnav is needed here. The
// sample-data banner renders on every legacy subroute (not the live landing).
export default function GovernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <GovSliceWriter />
      <GovSampleBanner />
      {children}
    </div>
  );
}
