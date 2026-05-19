"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useProtocolMetrics } from "@/lib/useProtocolMetrics";
import { formatAddress } from "@/lib/utils";

export function DashboardLists() {
  const { data, isLoading } = useProtocolMetrics();
  const configured = Boolean(data?.configured);
  const topVerifiers = data?.topVerifiers.map((verifier) => [verifier.address, verifier.accuracy]) ?? [];
  const carriers = data?.carrierIntegrations.names ?? [];

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
              {configured ? "Awaiting first verifier accuracy update" : "Configure production addresses to load verifier rankings"}
            </p>
          )}
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
              {configured ? "Awaiting first carrier registration" : "Configure production addresses to load carrier registrations"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
