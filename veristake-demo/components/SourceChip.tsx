"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SOURCED_STATS } from "@/lib/stats";

export function SourceChip({ statKey, className = "" }: { statKey: keyof typeof SOURCED_STATS; className?: string }) {
  const stat = SOURCED_STATS[statKey];
  const weak = stat.sourceStrength === "weak";

  return (
    <a
      href={stat.source.url}
      target="_blank"
      rel="noreferrer"
      title={weak ? "Composite source; awaiting primary citation" : stat.source.title}
      onClick={() => trackEvent("source_chip_clicked", { stat_key: stat.key })}
      className={`focus-ring mt-4 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
      aria-label={`Open source: ${stat.source.publisher}, ${stat.source.title}`}
    >
      {weak ? <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" /> : null}
      {stat.source.publisher}
      {weak ? <span className="text-amber-700 dark:text-amber-300">Weak source</span> : null}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}
