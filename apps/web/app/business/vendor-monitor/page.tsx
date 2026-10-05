import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { VendorMonitor } from "@/components/business/VendorMonitor";

export const metadata: Metadata = {
  ...routeMetadata("C3-4 \u00b7 Vendor Selection and Concentration Risk Monitor", "Inspect c3-4 \u00b7 vendor selection and concentration risk monitor through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/business/vendor-monitor"),
  title: "C3-4 · Vendor Selection and Concentration Risk Monitor",
  description:
    "Score three archetype AI vendors on a weighted matrix, move the weights and watch the ranking flip, then switch to the risk view, concentration, renewal timeline, and exit cost.",
};

export default function Page() {
  return <VendorMonitor />;
}
