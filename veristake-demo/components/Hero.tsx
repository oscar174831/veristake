import Link from "next/link";
import { ArrowRight, BarChart3, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="hero-scene relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div className="absolute inset-0 opacity-70" aria-hidden="true">
        <div className="mx-auto grid h-full max-w-7xl grid-cols-6 gap-3 px-4 sm:px-6 lg:px-8">
          {Array.from({ length: 30 }).map((_, index) => (
            <div
              key={index}
              className="mt-16 h-16 rounded-md border border-slate-300/40 bg-white/35 dark:border-slate-700/45 dark:bg-slate-900/35"
              style={{ transform: `translateY(${(index % 6) * 22}px)` }}
            />
          ))}
        </div>
      </div>
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="max-w-3xl">
          <Badge tone="teal" className="mb-5">
            Claims infrastructure for licensed carriers
          </Badge>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
            Insurance claims, verified by economics.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
            Veristake plugs into disputed HEALTH and AUTO claim workflows. Your adjusters keep
            authority; a credentialed verifier network adds independent review, an audit trail, and
            economic accountability when a claim should be paid or denied.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="font-semibold">For carriers</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Escalate disputed claims without replacing the claims core.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="font-semibold">For executives</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">See resolution, accuracy, reserve movement, and verifier behavior.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="font-semibold">For demo visitors</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Run the flow in minutes, with no browser extension or real funds.</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/demo" prefetch={false}>
              <Button size="lg">
                Try the demo
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/dashboard" prefetch={false}>
              <Button size="lg" variant="secondary">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                View live dashboard
              </Button>
            </Link>
            <Link href="/docs" prefetch={false}>
              <Button size="lg" variant="ghost">
                <FileText className="h-5 w-5" aria-hidden="true" />
                Read the whitepaper
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-lg border border-slate-200 bg-white/92 p-4 shadow-panel dark:border-slate-800 dark:bg-slate-950/92">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold">Claim review stream</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">AUTO and HEALTH only</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-teal-700 dark:text-teal-300" aria-hidden="true" />
            </div>
            <div className="space-y-3 pt-4">
              {[
                ["ER appeal", "Pay", "4/5"],
                ["Rear-end collision", "Partial", "6/7"],
                ["Duplicate billing", "Deny", "5/5"]
              ].map(([name, status, votes]) => (
                <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{votes}</span>
                  <Badge tone={status === "Deny" ? "rose" : status === "Partial" ? "amber" : "teal"}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Outcome shown in plain English, with receipt links available for every sandbox action.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
