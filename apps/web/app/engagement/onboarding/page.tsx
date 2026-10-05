import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { OnboardingTracker } from "@/components/engagement/OnboardingTracker";

export const metadata: Metadata = {
  ...routeMetadata("EL-09 \u00b7 Onboarding and Knowledge Transfer Tracker", "Inspect el-09 \u00b7 onboarding and knowledge transfer tracker through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/onboarding"),
  title: "EL-09 · Onboarding and Knowledge Transfer Tracker",
  description:
    "Onboard six new resources on 30/60/90 ramps where access is the critical path, compress it with pre provisioning, then flip to a knowledge transfer view that maps a departing senior's bus factor risk.",
};

export default function Page() {
  return <OnboardingTracker />;
}
