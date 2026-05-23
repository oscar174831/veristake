import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardCheck, ShieldCheck, Timer } from "lucide-react";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Hero } from "@/components/Hero";
import { HowItWorksFlow } from "@/components/HowItWorksFlow";
import { NetworkStats } from "@/components/NetworkStats";
import { SourceChip } from "@/components/SourceChip";
import { QueryProvider } from "@/app/query-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SOURCED_STATS } from "@/lib/stats";

export default function LandingPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@veristake.xyz";
  const mailto = `mailto:${contactEmail}?subject=Veristake%20integration%20call`;
  const calendly = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const bookingHref = calendly || mailto;
  const bookingLabel = calendly ? "Calendly" : "Request meeting";

  return (
    <>
      <AnalyticsBeacon event="landing_viewed" />
      <Hero />

      <section className="border-b border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-6 dark:border-teal-900 dark:bg-teal-950/40">
            <Badge tone="teal">Carrier TLDR</Badge>
            <p className="mt-4 max-w-5xl text-xl font-medium leading-8 text-slate-900 dark:text-slate-100">
              Veristake is the disputed-claim verification layer for licensed health and auto
              carriers. Carriers keep underwriting authority, policyholder relationships, compliance
              obligations, and payout reserves, while Veristake routes carrier-selected claim
              packets to credentialed reviewers with reputation and capital at risk.
            </p>
            <p className="mt-3 max-w-5xl text-base leading-7 text-slate-700 dark:text-slate-200">
              The result is a faster, auditable second-look workflow for high-friction claims
              without making Veristake an insurer, TPA, or consumer claims service.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 py-14 dark:border-slate-800">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <Badge tone="blue">Focused wedge</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              One wedge: carrier-routed disputed claims.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Routine, low-friction claims should keep moving through existing carrier systems.
              Veristake activates only when the carrier sends a denial appeal, payout dispute,
              complex evidence packet, or fraud signal into an independent review path.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              [
                ShieldCheck,
                "Carrier rails stay intact",
                "The carrier keeps its claim core, policy rules, reserves, and legal obligations."
              ],
              [
                ClipboardCheck,
                "Review is carrier-routed",
                "Appeals, large disputes, suspected fraud, and grey-area packets enter only when configured by the carrier."
              ],
              [
                Timer,
                "Value density stays high",
                "External review has a cost, so the product focuses on cases where independent trust improves outcomes."
              ]
            ].map(([Icon, title, copy]) => {
              const TypedIcon = Icon as typeof ShieldCheck;
              return (
                <div key={title as string} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <TypedIcon className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="for-carriers" className="scroll-mt-24 border-b border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge tone="blue">The problem</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Disputed claims are a measurable operating risk.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Veristake starts where carrier teams need a credible second-look layer: denied health
              appeals, delayed auto payouts, and fraud signals that need independent review.
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
            <div className="flex flex-wrap gap-2">
              <SourceChip statKey="AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024" />
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
          <QueryProvider>
            <NetworkStats />
          </QueryProvider>
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
              <a href={mailto}>
                <Button variant="secondary">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Email integration team
                </Button>
              </a>
              <a href={bookingHref} target={calendly ? "_blank" : undefined} rel={calendly ? "noreferrer" : undefined}>
                <Button>
                  {bookingLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
