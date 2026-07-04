import type { Metadata } from "next";
import { StorylineView } from "@/components/story/StorylineView";

export const metadata: Metadata = { title: "Storyline" };

export default function Page() {
  return <StorylineView />;
}
