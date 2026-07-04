"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The guided tour has been retired. This old route client-redirects to the
// cockpit so any saved links keep working.
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
