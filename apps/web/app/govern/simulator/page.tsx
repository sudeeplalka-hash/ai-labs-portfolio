"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Risk Simulator has been retired. This old route client-redirects to the
// Govern cockpit so any saved links keep working (static-export safe).
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/govern"); }, [router]);
  return null;
}
