"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MetricsTimeframe } from "@/lib/protocolMetrics";
import { useProtocolMetrics } from "@/lib/useProtocolMetrics";

function MetricValue({
  value,
  loading,
  emptyText
}: {
  value: string | number | null;
  loading: boolean;
  emptyText: string;
}) {
  if (loading) {
    return <span className="block h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />;
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-sm font-medium leading-tight text-slate-500 dark:text-slate-400">{emptyText}</span>;
  }

  return <span className="text-2xl font-semibold">{value}</span>;
}

export function NetworkStats({ surface = "landing" }: { surface?: "landing" | "dashboard" }) {
  const { data, isLoading, isError } = useProtocolMetrics("all");
  return <NetworkStatsCards surface={surface} timeframe="all" data={data} isLoading={isLoading} isError={isError} />;
}

function relativeTime(iso?: string | null) {
  if (!iso) return "Not polled yet";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `Last updated ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  return `Last updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

export function NetworkStatsCards({
  surface = "dashboard",
  timeframe,
  data,
  isLoading,
  isError
}: {
  surface?: "landing" | "dashboard";
  timeframe: MetricsTimeframe;
  data: ReturnType<typeof useProtocolMetrics>["data"];
  isLoading: boolean;
  isError: boolean;
}) {
  const queryClient = useQueryClient();
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const configured = Boolean(data?.configured);
  const badgeText = configured ? (data?.source === "snapshot" ? "Snapshot" : "Base Sepolia") : "Config needed";
  const sourceLabel = data?.sourceLabel ?? badgeText;
  const lastUpdatedText = relativeTime(data?.lastUpdatedAt);
  const recentRead = useMemo(() => {
    if (!data?.lastUpdatedAt || !data.readSucceeded) return false;
    return Date.now() - new Date(data.lastUpdatedAt).getTime() < 5 * 60 * 1000;
  }, [data?.lastUpdatedAt, data?.readSucceeded]);
  const collateralLabel = surface === "dashboard" ? "Total VST committed" : "Network collateral";

  const stats = configured
    ? [
        ["Claims processed", data?.totalClaimsProcessed ?? null, "First claim will appear here within seconds of carrier activity."],
        ["Average resolution time", data?.averageResolutionTime ?? null, "Resolution time appears after the first claim reaches final state."],
        ["Verifier accuracy", data?.networkAccuracy ?? null, "Verifier accuracy appears after reputation updates are emitted."],
        [collateralLabel, data?.totalVstStaked ?? null, "Staked VST appears after the first verifier joins a domain pool."]
      ]
    : [
        ["Claims processed", "--", "Configure production addresses to load live claim counts."],
        ["Average resolution time", "--", "Configure production addresses to load resolution timing."],
        ["Verifier accuracy", "--", "Configure production addresses to load verifier reputation."],
        [collateralLabel, "--", "Configure production addresses to load staked VST."]
      ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value, emptyText]) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <Badge tone={data?.source === "snapshot" ? "amber" : configured ? "teal" : "slate"} className="gap-1">
              {recentRead ? <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" aria-hidden="true" /> : null}
              {isError && configured ? "Read retry" : badgeText}
            </Badge>
          </div>
          <div className="mt-2 flex min-h-10 items-center justify-between gap-2">
            <MetricValue
              value={isError && configured ? null : value}
              loading={isLoading}
              emptyText={`${emptyText} ${lastUpdatedText}.`}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{sourceLabel} · {lastUpdatedText}</span>
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
      ))}
    </div>
  );
}
