"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Risk Simulator has been retired. This old route client-redirects to the cockpit.
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
