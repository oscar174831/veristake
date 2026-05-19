"use client";

import { useMemo, useState } from "react";
import { ArrowRight, FileUp, ShieldCheck } from "lucide-react";
import { ClaimCard } from "@/components/ClaimCard";
import { ProgressDots } from "@/components/ProgressDots";
import { TransactionStatus } from "@/components/TransactionStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { claimantScenarios, type Domain } from "@/lib/scenarios";
import { formatUsd } from "@/lib/utils";

type ApiSession = {
  id: string;
  phase: string;
  explorerBaseUrl: string;
  events: Array<{ label: string; detail: string; txHash?: string }>;
};

const demoWallet = "0x000000000000000000000000000000000000babe";

export default function ClaimantDemoPage() {
  const [domain, setDomain] = useState<Domain>("HEALTH");
  const [step, setStep] = useState(1);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [loading, setLoading] = useState(false);
  const claim = claimantScenarios[domain];
  const latestEvent = useMemo(() => session?.events.at(-1), [session]);

  async function submitAppeal() {
    setLoading(true);
    await fetch("/api/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: demoWallet })
    });
    const response = await fetch("/api/seed-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: "claimant", domain, walletAddress: demoWallet })
    });
    setSession((await response.json()) as ApiSession);
    setStep(3);
    setLoading(false);
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="blue">{domain} claimant demo</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Submit an appeal packet</h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Review the denial, inspect the evidence packet, submit the appeal, and watch the
              decision path to carrier-funded resolution.
            </p>
          </div>
          <ProgressDots current={step} total={3} />
        </div>

        <div className="mb-6 flex gap-2" role="tablist" aria-label="Claim domain">
          {(["HEALTH", "AUTO"] as Domain[]).map((item) => (
            <Button
              key={item}
              variant={domain === item ? "primary" : "secondary"}
              onClick={() => {
                setDomain(item);
                setStep(1);
                setSession(null);
              }}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <ClaimCard claim={claim} active />
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">What the reviewer sees</h2>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Denial reason</p>
                    <p className="mt-1 font-medium">
                      {domain === "HEALTH" ? "Not medically necessary" : "Pre-existing damage"}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verifier task</p>
                    <p className="mt-1 font-medium">
                      Decide whether the packet supports pay, deny, or partial payout.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {step === 1 ? (
              <Card>
                <CardHeader>
                  <FileUp className="h-8 w-8 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold">Structured claim packet</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The packet mirrors what verifiers see: diagnosis or incident details, itemized
                    amount, notes, and supporting evidence. Requested amount: {formatUsd(claim.amount)}.
                  </p>
                  <Button className="mt-5" onClick={() => setStep(2)}>
                    Review packet
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card>
                <CardHeader>
                  <ShieldCheck className="h-8 w-8 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold">Submit appeal</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The backend prepares sandbox balances, submits the claim packet, and starts the
                    deterministic verifier review. The visitor never sees a seed phrase or pays real
                    money.
                  </p>
                  <Button className="mt-5" onClick={submitAppeal} disabled={loading}>
                    {loading ? "Submitting appeal..." : "Submit appeal"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">Resolution</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Verifiers reviewing your claim... ({domain === "HEALTH" ? "4/5 votes in" : "6/7 votes in"})
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                      <p className="text-sm text-slate-500">Decision</p>
                      <p className="text-2xl font-semibold">
                        {claim.expectedOutcome}
                        {claim.expectedPayout ? `, ${formatUsd(claim.expectedPayout)} payout` : ""}
                      </p>
                    </div>
                    <div className="rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950">
                      <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">
                        Outcome summary
                      </p>
                      <p className="mt-2 text-sm leading-6 text-teal-900 dark:text-teal-100">
                        The denied {domain} claim was converted into a structured packet, reviewed
                        by verifiers, and resolved with a carrier-funded payout path.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <TransactionStatus
              title={latestEvent?.label ?? "Preparing claimant action"}
              detail={latestEvent?.detail ?? "The sandbox wallet and evidence packet are ready."}
              wait={loading ? "About 10 sec" : step === 3 ? "Complete" : "Ready"}
              pending={loading}
              txHash={latestEvent?.txHash}
              explorerBaseUrl={session?.explorerBaseUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
