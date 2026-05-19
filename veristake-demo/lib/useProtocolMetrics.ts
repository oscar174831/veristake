"use client";

import { useQuery } from "@tanstack/react-query";
import type { MetricsTimeframe, ProtocolMetrics } from "@/lib/protocolMetrics";

export function useProtocolMetrics(timeframe: MetricsTimeframe = "all") {
  return useQuery({
    queryKey: ["protocol-metrics", "production", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/protocol-metrics?timeframe=${timeframe}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load protocol metrics");
      return (await response.json()) as ProtocolMetrics;
    },
    staleTime: 60_000,
    retry: 1
  });
}
