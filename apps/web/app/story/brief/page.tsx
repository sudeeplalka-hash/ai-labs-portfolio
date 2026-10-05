import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { BoardBrief } from "@/components/story/BoardBrief";

export const metadata: Metadata = {
  ...routeMetadata("Board Brief", "Inspect board brief through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/story/brief"), title: "Board Brief" };

export default function Page() {
  return <BoardBrief />;
}
