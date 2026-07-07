import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowRight, Map } from "lucide-react";
import { IS_COMMAND_CENTER } from "@/lib/site";

export const metadata: Metadata = { title: "Page not found" };

// Branded 404 for both deploys. Old shared links and typos land here; the job is
// a fast, obvious route back into the product, not an apology page.
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slatey-500">404 &middot; not found</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
          This page doesn&apos;t exist{IS_COMMAND_CENTER ? " in the Command Center" : " in the portfolio"}.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slatey-400">
          The link may be from an older version of the site. Everything that ships is reachable from the
          {IS_COMMAND_CENTER ? " seven-stage home" : " Competency Map"}, start there.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark">
            <Compass className="h-4 w-4" /> {IS_COMMAND_CENTER ? "Command Center home" : "Open the Competency Map"}
          </Link>
          <Link
            href={IS_COMMAND_CENTER ? "/story" : "/storylines"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            <Map className="h-4 w-4" /> {IS_COMMAND_CENTER ? "Read the two minute story" : "Follow a storyline"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
