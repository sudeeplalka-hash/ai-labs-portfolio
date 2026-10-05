"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function GuideTaskLink({ href, label = "Open this lab" }: { href?: string; label?: string }) {
  const pathname = usePathname();
  const target = href ?? (pathname.replace(/\/guide\/?$/, "") || "/");
  return <Link href={target} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">{label}<ArrowRight aria-hidden className="h-4 w-4" /></Link>;
}
