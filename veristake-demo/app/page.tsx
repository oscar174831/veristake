import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, ClipboardCheck, ExternalLink, ShieldCheck, Timer } from "lucide-react";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Hero } from "@/components/Hero";
import { HowItWorksFlow } from "@/components/HowItWorksFlow";
import { NetworkStats } from "@/components/NetworkStats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SOURCED_STATS } from "@/lib/stats";

function SourceChip({ statKey }: { statKey: keyof typeof SOURCED_STATS }) {
  const stat = SOURCED_STATS[statKey];
  const weak = stat.sourceStrength === "weak";
  return (
    <a
      href={stat.source.url}
      target="_blank"
      rel="noreferrer"
      title={weak ? "Composite source; awaiting primary citation" : stat.source.title}
      className="focus-ring mt-4 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={`Open source: ${stat.source.publisher}, ${stat.source.title}`}
    >
      {weak ? <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" /> : null}
      {stat.source.publisher}
      {weak ? <span className="text-amber-700 dark:text-amber-300">Weak source</span> : null}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

export default function LandingPage() {
  const calendly = process.env.CALENDLY_URL || "https://calendly.com/";

  return (
    <>
      <Hero />

      <section className="border-b border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge tone="blue">The problem</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Disputed claims are a measurable operating risk.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Veristake starts where trust breaks down: denied health appeals, delayed auto payouts,
              and fraud signals that need independent review.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Health claims</p>
                <h3 className="text-4xl font-semibold">
                  {SOURCED_STATS.ACA_INNETWORK_DENIAL_RATE_2024.value}
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                  1 in 5 ACA marketplace health claims were denied in 2024.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Out-of-network denials were {SOURCED_STATS.ACA_OON_DENIAL_RATE_2024.value}.
                </p>
                <SourceChip statKey="ACA_INNETWORK_DENIAL_RATE_2024" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Appeals</p>
                <h3 className="text-4xl font-semibold">
                  {SOURCED_STATS.MA_PRIOR_AUTH_OVERTURN_RATE_2024.value}
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                  Medicare Advantage prior-authorization denials overturned on appeal.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  ACA marketplace appeals were reversed {SOURCED_STATS.ACA_APPEAL_OVERTURN_RATE_2024.value} of the time,
                  even though filing remained {SOURCED_STATS.ACA_APPEAL_FILING_RATE_2024.value}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <SourceChip statKey="ACA_APPEAL_OVERTURN_RATE_2024" />
                  <SourceChip statKey="MA_PRIOR_AUTH_OVERTURN_RATE_2024" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Auto claims</p>
                <h3 className="text-4xl font-semibold">
                  {SOURCED_STATS.AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024.value}
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                  Auto-insurance complaint share tied to claim handling in 2024.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Auto complaints rose {SOURCED_STATS.AUTO_COMPLAINT_GROWTH_2021_TO_2024.value};
                  the complaint count was {SOURCED_STATS.AUTO_COMPLAINT_COUNT_2024.value}.
                </p>
                <SourceChip statKey="AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <Badge tone="teal">How it works</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Six clear handoffs from claim packet to carrier-funded payout.
            </h2>
          </div>
          <HowItWorksFlow />
        </div>
      </section>

      <section className="border-b border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <Badge tone="amber">Why carriers integrate</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Add independent adjudication without handing over your book.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Carriers keep underwriting authority, pricing, compliance, and reserve ownership.
              Veristake adds bias-free adjudication on demand, cross-carrier verifier liquidity,
              audit trails, and no balance-sheet risk on Veristake&apos;s side.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                [ShieldCheck, "Control stays with the carrier", "Policies, reserves, payouts, and final integration rules remain carrier-owned."],
                [ClipboardCheck, "Independent review is available on demand", "Disputed packets move to credentialed reviewers with a visible decision path."],
                [Timer, "Audit-ready outcomes replace opaque queues", "Every demo action shows what happened, expected wait time, and an explorer link."]
              ].map(([Icon, title, copy]) => {
                const TypedIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={title as string} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <TypedIcon className="mt-0.5 h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{title as string}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{copy as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">
              Auto claim handling generated{" "}
              {SOURCED_STATS.AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024.value} of 2024 insurance
              complaints to state regulators, while auto complaints rose{" "}
              {SOURCED_STATS.AUTO_COMPLAINT_GROWTH_2021_TO_2024.value} from 2021 to 2024.
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Footnote for sales training only: the auto claim denial range is{" "}
              {SOURCED_STATS.AUTO_DENIAL_RATE_RANGE.value}; see DEMO_DECISIONS.md before using it
              as formal marketing copy.
            </p>
            <div className="flex flex-wrap gap-2">
              <SourceChip statKey="AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024" />
              <SourceChip statKey="AUTO_DENIAL_RATE_RANGE" />
            </div>
          </div>
          <ComparisonTable />
        </div>
      </section>

      <section className="border-b border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge tone="teal">Live network stats</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
                Read-only metrics from the production-grade testnet instance.
              </h2>
            </div>
            <Link href="/dashboard" prefetch={false}>
              <Button variant="secondary">
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
          <NetworkStats />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                Ready for an integration review?
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Book a 20-minute integration call.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="mailto:founder@veristake.com?subject=Veristake%20integration%20call">
                <Button variant="secondary">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Email
                </Button>
              </a>
              <a href={calendly} target="_blank" rel="noreferrer">
                <Button>
                  Calendly
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </a>
            </div>
          </div>
          <footer className="mt-10 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/docs" prefetch={false} className="focus-ring rounded-md hover:text-slate-900 dark:hover:text-white">
              Whitepaper highlights
            </Link>
            <a
              href="/docs/whitepaper/Veristake_Whitepaper_v1.pdf"
              className="focus-ring rounded-md hover:text-slate-900 dark:hover:text-white"
            >
              Whitepaper PDF
            </a>
            <a
              href="https://github.com/oscar174831/veristake"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-md hover:text-slate-900 dark:hover:text-white"
            >
              GitHub
            </a>
          </footer>
        </div>
      </section>
    </>
  );
}
