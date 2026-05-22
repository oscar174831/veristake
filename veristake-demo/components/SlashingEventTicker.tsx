"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useProtocolMetrics } from "@/lib/useProtocolMetrics";
import { formatAddress } from "@/lib/utils";

const sandboxEvents = [
  { claimId: "health-duplicate-pt", verifier: "0x0000000000000000000000000000000000000003", amount: "50 VST" },
  { claimId: "auto-staged-collision", verifier: "0x0000000000000000000000000000000000000007", amount: "50 VST" },
  { claimId: "health-er-angina", verifier: "0x0000000000000000000000000000000000000005", amount: "No penalty" }
];

export function SlashingEventTicker({
  compact = false,
  source = "production"
}: {
  compact?: boolean;
  source?: "production" | "sandbox";
}) {
  const { data, isLoading } = useProtocolMetrics();
  const configured = Boolean(data?.configured);
  const useSandbox = source === "sandbox" || !configured;
  const badgeText = source === "sandbox" ? "Sandbox" : configured ? data?.sourceLabel ?? "Base Sepolia" : "Config needed";
  const events = useSandbox ? sandboxEvents : data?.recentSlashingEvents ?? [];
  const visibleEvents = events.slice(0, compact ? 2 : events.length);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Verifier event feed</p>
        <Badge tone={useSandbox ? "amber" : "teal"}>{badgeText}</Badge>
      </div>
      <div className="space-y-2" aria-live="polite">
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        ) : visibleEvents.length ? (
          visibleEvents.map((event, index) => (
            <motion.div
              key={`${event.claimId}-${event.verifier}-${index}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-medium">{event.claimId}</p>
                <p className="text-slate-500 dark:text-slate-400">
                  {source === "sandbox" ? formatAddress(event.verifier) : event.verifier}
                </p>
              </div>
              <Badge tone={event.amount === "No penalty" ? "teal" : "rose"}>{event.amount}</Badge>
            </motion.div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Awaiting first slashing event
          </div>
        )}
      </div>
    </div>
  );
}
