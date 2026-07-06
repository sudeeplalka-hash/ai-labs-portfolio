import type { Metadata } from "next";
import { AdoptionReadiness } from "@/components/engagement/AdoptionReadiness";

export const metadata: Metadata = {
  title: "EL-01 · Adoption & Change Readiness Instrument",
  description:
    "Score six readiness factors for an AI rollout, get a gate verdict, scale, scale with conditions, or hold, and a two-week adoption plan that changes as the factors move.",
};

export default function Page() {
  return <AdoptionReadiness />;
}
