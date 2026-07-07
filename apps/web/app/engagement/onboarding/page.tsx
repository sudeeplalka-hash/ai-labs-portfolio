import type { Metadata } from "next";
import { OnboardingTracker } from "@/components/engagement/OnboardingTracker";

export const metadata: Metadata = {
  title: "EL-09 · Onboarding and Knowledge Transfer Tracker",
  description:
    "Onboard six new resources on 30/60/90 ramps where access is the critical path, compress it with pre provisioning, then flip to a knowledge transfer view that maps a departing senior's bus factor risk.",
};

export default function Page() {
  return <OnboardingTracker />;
}
