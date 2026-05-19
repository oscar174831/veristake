import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardLists } from "@/components/DashboardLists";
import { NetworkStats } from "@/components/NetworkStats";
import { SlashingEventTicker } from "@/components/SlashingEventTicker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { hasConfiguredAddresses } from "@/lib/contracts";

export default function DashboardPage() {
  const configured = hasConfiguredAddresses("production");

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone={configured ? "teal" : "slate"}>{configured ? "Base Sepolia" : "Env needed"}</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Live protocol metrics</h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Public, read-only view of production-grade testnet activity. Demo visitor transactions
              route to the sandbox instead.
            </p>
          </div>
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
                    : "Production addresses are not configured, so the UI is showing the safe Env needed state."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <NetworkStats surface="dashboard" />

        <div className="mt-6">
          <DashboardCharts />
        </div>

        <div className="mt-6">
          <DashboardLists />
        </div>

        <div className="mt-6">
          <SlashingEventTicker />
        </div>
      </div>
    </section>
  );
}
