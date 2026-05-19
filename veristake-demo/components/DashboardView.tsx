"use client";

import { useState } from "react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardLists } from "@/components/DashboardLists";
import { NetworkStatsCards } from "@/components/NetworkStats";
import { SlashingEventTicker } from "@/components/SlashingEventTicker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MetricsTimeframe } from "@/lib/protocolMetrics";
import { useProtocolMetrics } from "@/lib/useProtocolMetrics";

export function DashboardView({ configured }: { configured: boolean }) {
  const [timeframe, setTimeframe] = useState<MetricsTimeframe>("all");
  const metrics = useProtocolMetrics(timeframe);

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone={configured ? "teal" : "slate"}>{configured ? "Base Sepolia" : "Env needed"}</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal">Live protocol metrics</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Public, read-only view of production-grade testnet activity. Demo visitor transactions
            route to the sandbox instead.
          </p>
        </div>
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Timeframe
          <select
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value as MetricsTimeframe)}
            className="focus-ring mt-2 block min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {configured ? "What this dashboard is reading" : "What this dashboard will show"}
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
              <p className="font-semibold">Production-grade testnet</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Counts claims, carrier registrations, stake, and reputation from Base Sepolia.
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
              <p className="font-semibold">Demo sandbox separation</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Visitor actions never mutate the audit-grade deployment.
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
              <p className="font-semibold">Current state</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {configured
                  ? "Live reads are enabled; empty cards mean the deployment is awaiting activity."
                  : "Production addresses are not configured, so the UI is showing contextual Env needed states."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <NetworkStatsCards
        surface="dashboard"
        timeframe={timeframe}
        data={metrics.data}
        isLoading={metrics.isLoading}
        isError={metrics.isError}
      />

      <div className="mt-6">
        <DashboardCharts timeframe={timeframe} />
      </div>

      <div className="mt-6">
        <DashboardLists timeframe={timeframe} />
      </div>

      <div className="mt-6">
        <SlashingEventTicker />
      </div>
    </>
  );
}
