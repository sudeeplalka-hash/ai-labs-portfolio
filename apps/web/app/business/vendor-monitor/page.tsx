import type { Metadata } from "next";
import { VendorMonitor } from "@/components/business/VendorMonitor";

export const metadata: Metadata = {
  title: "C3-4 · Vendor Selection and Concentration Risk Monitor",
  description:
    "Score three archetype AI vendors on a weighted matrix, move the weights and watch the ranking flip, then switch to the risk view, concentration, renewal timeline, and exit cost.",
};

export default function Page() {
  return <VendorMonitor />;
}
