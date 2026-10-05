import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { StorylineView } from "@/components/story/StorylineView";

export const metadata: Metadata = {
  ...routeMetadata("Storyline", "Inspect storyline through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/story"), title: "Storyline" };

export default function Page() {
  return <StorylineView />;
}
