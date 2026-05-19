"use client";

import { Badge } from "@/components/ui/badge";
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
  const { data, isLoading, isError } = useProtocolMetrics();
  const configured = Boolean(data?.configured);
  const badgeText = configured ? "Base Sepolia" : "Env needed";
  const emptyText = data?.emptyState ?? "Awaiting first claim";
  const collateralLabel = surface === "dashboard" ? "Total VST committed" : "Network collateral";

  const stats = configured
    ? [
        ["Claims processed", data?.totalClaimsProcessed ?? null],
        ["Average resolution time", data?.averageResolutionTime ?? null],
        ["Verifier accuracy", data?.networkAccuracy ?? null],
        [collateralLabel, data?.totalVstStaked ?? null]
      ]
    : [
        ["Claims processed", "--"],
        ["Average resolution time", "--"],
        ["Verifier accuracy", "--"],
        [collateralLabel, "--"]
      ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <div className="mt-2 flex min-h-10 items-center justify-between gap-2">
            <MetricValue
              value={isError && configured ? null : value}
              loading={isLoading}
              emptyText={configured ? emptyText : "--"}
            />
            <Badge tone={configured ? "teal" : "slate"}>{isError && configured ? "Read retry" : badgeText}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
