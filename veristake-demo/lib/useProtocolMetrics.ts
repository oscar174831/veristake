"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProtocolMetrics } from "@/lib/protocolMetrics";

export function useProtocolMetrics() {
  return useQuery({
    queryKey: ["protocol-metrics", "production"],
    queryFn: async () => {
      const response = await fetch("/api/protocol-metrics", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load protocol metrics");
      return (await response.json()) as ProtocolMetrics;
    },
    staleTime: 60_000,
    retry: 1
  });
}
