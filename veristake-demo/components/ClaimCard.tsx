import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";
import type { DemoClaim } from "@/lib/scenarios";

export function ClaimCard({ claim, active = false }: { claim: DemoClaim; active?: boolean }) {
  return (
    <Card className={active ? "border-teal-300 ring-2 ring-teal-100 dark:border-teal-700 dark:ring-teal-950" : ""}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{claim.domain}</p>
            <h3 className="text-xl font-semibold">{claim.title}</h3>
          </div>
          <Badge tone={claim.expectedOutcome === "DENY" ? "rose" : claim.expectedOutcome === "PARTIAL" ? "amber" : "teal"}>
            {formatUsd(claim.amount)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{claim.summary}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">Requested</p>
            <p className="font-semibold">{formatUsd(claim.amount)}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">Expected decision</p>
            <p className="font-semibold">{claim.expectedOutcome}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">Expected payout</p>
            <p className="font-semibold">{claim.expectedPayout ? formatUsd(claim.expectedPayout) : "No payout"}</p>
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Evidence packet
        </p>
        <ul className="mt-2 grid gap-2">
          {claim.evidence.map((item) => (
            <li key={item} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
