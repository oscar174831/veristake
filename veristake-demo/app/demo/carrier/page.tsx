"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Building2, CircleDollarSign, Play } from "lucide-react";
import { ClaimCard } from "@/components/ClaimCard";
import { DemoDropoffTracker } from "@/components/DemoDropoffTracker";
import { ProgressDots } from "@/components/ProgressDots";
import { TransactionStatus } from "@/components/TransactionStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { carrierScenario } from "@/lib/scenarios";

type ApiSession = {
  id: string;
  explorerBaseUrl: string;
  events: Array<{ label: string; detail: string; txHash?: string }>;
};

const demoWallet = "0x000000000000000000000000000000000000cafe";

export default function CarrierDemoPage() {
  const [step, setStep] = useState(1);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);

  const latestEvent = useMemo(() => session?.events.at(-1), [session]);

  async function startSession(nextStep: number) {
    setLoading(true);
    const response = await fetch("/api/seed-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: "carrier", domain: "AUTO", walletAddress: demoWallet })
    });
    setSession((await response.json()) as ApiSession);
    setStep(nextStep);
    trackEvent("demo_step_completed", { persona: "carrier", step_index: nextStep });
    setLoading(false);
  }

  async function registerPolicy() {
    setPolicyLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setStep(3);
    trackEvent("demo_step_completed", { persona: "carrier", step_index: 3 });
    trackEvent("demo_completed", { persona: "carrier" });
    setPolicyLoading(false);
  }

  return (
    <section className="py-10">
      <DemoDropoffTracker persona="carrier" step={step} completed={step >= 3} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="blue">AUTO demo</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Pacific Mutual onboarding</h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              You are Pacific Mutual, a regional auto carrier with 1,000 open claims/month. This
              path shows how a carrier registers, funds a reserve, and watches claims resolve.
            </p>
          </div>
          <ProgressDots current={step} total={3} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            {step === 1 ? (
              <Card>
                <CardHeader>
                  <Building2 className="h-8 w-8 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold">Register Pacific Mutual</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Business meaning: Pacific Mutual becomes an approved carrier admin in the demo
                    environment. Production integrations would map this to your carrier entity and
                    policy systems.
                  </p>
                  <Button className="mt-5" onClick={() => startSession(2)} disabled={loading}>
                    {loading ? "Registering..." : "Register Pacific Mutual"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card>
                <CardHeader>
                  <CircleDollarSign className="h-8 w-8 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold">Register policy and fund reserve</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Business meaning: the AUTO policy gets a dedicated reserve. Veristake never pays
                    from its own balance sheet; approved payouts release from the carrier-funded
                    reserve.
                  </p>
                  <Button className="mt-5" onClick={registerPolicy} disabled={policyLoading}>
                    {policyLoading ? "Funding reserve..." : "Register auto-collision policy"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card>
                <CardHeader>
                  <Play className="h-8 w-8 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold">Live reserve view</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Reserve</p>
                      <p className="text-xl font-semibold">$10,000</p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Claims queued</p>
                      <p className="text-xl font-semibold">3</p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Demo timeline</p>
                      <p className="text-xl font-semibold">12 min</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    In real production, you would have spent 4-18 weeks adjudicating this manually.
                    Here it took 12 minutes.
                  </p>
                  <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950">
                    <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">
                      Executive outcome summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-teal-900 dark:text-teal-100">
                      Pacific Mutual registered one AUTO policy, funded a $10k reserve, and watched
                      three claims move to carrier-funded outcomes with a visible audit trail.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <TransactionStatus
              title={latestEvent?.label ?? "Preparing carrier action"}
              detail={latestEvent?.detail ?? "The demo sandbox is ready to receive the carrier transaction."}
              wait={loading || policyLoading ? "About 10 sec" : step === 3 ? "Complete" : "Ready"}
              pending={loading || policyLoading}
              txHash={latestEvent?.txHash}
              explorerBaseUrl={session?.explorerBaseUrl}
            />
          </div>

          <div className="space-y-4">
            {carrierScenario.autoplayClaims.map((claim, index) => (
              <ClaimCard key={claim.id} claim={claim} active={step === 3 && index === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
