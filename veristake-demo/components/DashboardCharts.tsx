"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import type { MetricsTimeframe } from "@/lib/protocolMetrics";
import { useProtocolMetrics } from "@/lib/useProtocolMetrics";

function ChartShell({
  title,
  configured,
  source,
  loading,
  children,
  empty,
  emptyText
}: {
  title: string;
  configured: boolean;
  source?: "live" | "snapshot" | "unconfigured";
  loading: boolean;
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge tone={source === "snapshot" ? "amber" : configured ? "teal" : "slate"}>
          {configured ? (source === "snapshot" ? "Snapshot" : "Base Sepolia") : "Config needed"}
        </Badge>
      </div>
      <div className="mt-4 h-72">
        {loading ? (
          <div className="h-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ) : empty ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 px-6 text-center text-sm font-medium leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function DashboardCharts({ timeframe = "all" }: { timeframe?: MetricsTimeframe }) {
  const { data, isLoading } = useProtocolMetrics(timeframe);
  const configured = Boolean(data?.configured);
  const source = data?.source;
  const resolutionHistogram = data?.resolutionHistogram ?? [];
  const accuracyTrend = data?.accuracyTrend ?? [];
  const emptyText = configured ? "Awaiting first claim" : "Configure production addresses to load live chart data";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartShell
        title="Resolution time histogram"
        configured={configured}
        source={source}
        loading={isLoading}
        empty={!configured || resolutionHistogram.length === 0}
        emptyText={emptyText}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={resolutionHistogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="claims" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell
        title="Verifier accuracy trend"
        configured={configured}
        source={source}
        loading={isLoading}
        empty={!configured || accuracyTrend.length === 0}
        emptyText={configured ? "Awaiting first reputation update" : emptyText}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={accuracyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[80, 100]} />
            <Tooltip />
            <Area type="monotone" dataKey="accuracy" stroke="#2563eb" fill="#bfdbfe" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
