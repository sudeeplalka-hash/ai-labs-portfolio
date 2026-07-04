"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Realize is now its own top-level lab (Stage 06). This old nested route
// client-redirects so any saved links keep working (static-export safe).
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/realize"); }, [router]);
  return null;
}
