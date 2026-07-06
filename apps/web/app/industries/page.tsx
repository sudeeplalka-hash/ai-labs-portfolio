import type { Metadata } from "next";
import { IndustryAtlas } from "../../components/map/IndustryAtlas";

export const metadata: Metadata = {
  title: "Industry Atlas",
  description:
    "One operator across the industries where AI is being deployed today, computed coverage of the use case layer, firsthand and studied, with sources.",
};

export default function IndustriesPage() {
  return <IndustryAtlas />;
}
