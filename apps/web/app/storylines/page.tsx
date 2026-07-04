import type { Metadata } from "next";
import { Storylines } from "../../components/map/Storylines";

export const metadata: Metadata = {
  title: "Storylines · one program, end to end",
  description:
    "The labs are instruments; the storylines are the operator. Follow a single AI program through the labs in the order a delivery leader actually hits them — deliver a program, win and mobilize an engagement, or stand up an enterprise AI capability.",
};

export default function StorylinesPage() {
  return <Storylines />;
}
