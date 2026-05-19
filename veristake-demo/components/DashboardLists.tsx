"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MetricsTimeframe } from "@/lib/protocolMetrics";
import { useProtocolMetrics } from "@/lib/useProtocolMetrics";
import { formatAddress } from "@/lib/utils";

function relativeTime(iso?: string | null) {
  if (!iso) return "Not polled yet";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `Last updated ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  return `Last updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

function CardToolbar({
  configured,
  recentRead,
  lastUpdatedText,
  timeframe
}: {
  configured: boolean;
  recentRead: boolean;
  lastUpdatedText: string;
  timeframe: MetricsTimeframe;
}) {
  const queryClient = useQueryClient();

  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
      <span>{lastUpdatedText}</span>
      <div className="flex items-center gap-2">
        <Badge tone={configured ? "teal" : "slate"} className="gap-1">
          {recentRead ? <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" aria-hidden="true" /> : null}
          {configured ? "Base Sepolia" : "Env needed"}
        </Badge>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["protocol-metrics", "production", timeframe] })}
        >
          Refresh now
        </Button>
      </div>
    </div>
  );
}

export function DashboardLists({ timeframe = "all" }: { timeframe?: MetricsTimeframe }) {
  const { data, isLoading } = useProtocolMetrics(timeframe);
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 5000);
    return () => window.clearInterval(interval);
  }, []);
  const configured = Boolean(data?.configured);
  const topVerifiers = data?.topVerifiers.map((verifier) => [verifier.address, verifier.accuracy]) ?? [];
  const carriers = data?.carrierIntegrations.names ?? [];
  const lastUpdatedText = relativeTime(data?.lastUpdatedAt);
  const recentRead = useMemo(() => {
    if (!data?.lastUpdatedAt || !data.readSucceeded) return false;
    return Date.now() - new Date(data.lastUpdatedAt).getTime() < 5 * 60 * 1000;
  }, [data?.lastUpdatedAt, data?.readSucceeded]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Top verifiers by accuracy</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : topVerifiers.length ? (
            <div className="space-y-2">
              {topVerifiers.map(([address, accuracy], index) => (
                <div
                  key={address}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800"
                >
                  <Badge tone="blue">#{index + 1}</Badge>
                  <span>{formatAddress(address)}</span>
                  <span className="font-semibold">{accuracy}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {configured
                ? `First verifier accuracy update will appear here after a finalized vote. ${lastUpdatedText}.`
                : `Configure production addresses to load verifier rankings. ${lastUpdatedText}.`}
            </p>
          )}
          <CardToolbar configured={configured} recentRead={recentRead} lastUpdatedText={lastUpdatedText} timeframe={timeframe} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Carrier integrations</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : carriers.length ? (
            <div className="space-y-2">
              {carriers.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800"
                >
                  <span>{name}</span>
                  <Badge tone={configured ? "teal" : "slate"}>{configured ? "Event" : "Placeholder"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {configured
                ? `First carrier registration will appear here within seconds of onboarding. ${lastUpdatedText}.`
                : `Configure production addresses to load carrier registrations. ${lastUpdatedText}.`}
            </p>
          )}
          <CardToolbar configured={configured} recentRead={recentRead} lastUpdatedText={lastUpdatedText} timeframe={timeframe} />
        </CardContent>
      </Card>
    </div>
  );
}
