"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export function DemoDropoffTracker({
  persona,
  step,
  completed
}: {
  persona: "carrier" | "claimant" | "verifier";
  step: number;
  completed: boolean;
}) {
  const latest = useRef({ step, completed });
  latest.current = { step, completed };

  useEffect(() => {
    return () => {
      if (!latest.current.completed) {
        trackEvent("demo_dropoff", { persona, at_step: latest.current.step });
      }
    };
  }, [persona]);

  return null;
}
