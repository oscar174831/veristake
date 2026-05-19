"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Award, ShieldAlert, WalletCards } from "lucide-react";
import { ClaimCard } from "@/components/ClaimCard";
import { ProgressDots } from "@/components/ProgressDots";
import { SlashingEventTicker } from "@/components/SlashingEventTicker";
import { TransactionStatus } from "@/components/TransactionStatus";
import { VoteWidget } from "@/components/VoteWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { verifierScenarios, type Domain, type VoteChoice } from "@/lib/scenarios";

type VoteState = Record<string, { choice: VoteChoice; correct: boolean }>;

const demoWallet = "0x000000000000000000000000000000000000feed";

export default function VerifierDemoPage() {
  const [domain, setDomain] = useState<Domain>("HEALTH");
  const [step, setStep] = useState(1);
  const [votes, setVotes] = useState<VoteState>({});
  const [txHash, setTxHash] = useState<string | undefined>();
  const [staking, setStaking] = useState(false);
  const claims = verifierScenarios[domain];
  const fraudClaim = claims.find((claim) => claim.fraudTrigger);
  const fraudMistake = fraudClaim ? votes[fraudClaim.id]?.choice === "APPROVE" : false;
  const completedVotes = Object.keys(votes).length;

  const score = useMemo(() => {
    const correct = Object.values(votes).filter((vote) => vote.correct).length;
    return completedVotes ? Math.round((correct / completedVotes) * 100) : 0;
  }, [votes, completedVotes]);

  async function stakeVerifier() {
    setStaking(true);
    await fetch("/api/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: demoWallet })
    });
    setTxHash("0x565354616b650000000000000000000000000000000000000000000000000000");
    setStep(2);
    setStaking(false);
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="amber">{domain} verifier demo</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Review three claims</h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              You are a reviewer joining Veristake&apos;s {domain} pool. Stake 100 VST, review the
              packets, and see how rewards, accuracy, and penalties behave in plain English.
            </p>
          </div>
          <ProgressDots current={step} total={3} />
        </div>

        <div className="mb-6 flex gap-2" role="tablist" aria-label="Verifier domain">
          {(["HEALTH", "AUTO"] as Domain[]).map((item) => (
            <Button
              key={item}
              variant={domain === item ? "primary" : "secondary"}
              onClick={() => {
                setDomain(item);
                setStep(1);
                setVotes({});
              }}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {step === 1 ? (
              <Card>
                <CardHeader>
                  <WalletCards className="h-8 w-8 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold">Stake 100 VST</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The faucet prepares demo-only balances, then your sandbox account joins the
                    {domain} verifier pool. In production, this step represents economic commitment
                    from a credentialed reviewer.
                  </p>
                  <Button className="mt-5" variant="amber" onClick={stakeVerifier} disabled={staking}>
                    {staking ? "Preparing stake..." : "Stake 100 VST"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">Submit review decisions</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Read each packet, then choose the business outcome: pay, deny, or pay part of
                    the request. The sandbox compresses commit and reveal behind the scenes.
                  </p>
                  <Button className="mt-5" disabled={completedVotes < 3} onClick={() => setStep(3)}>
                    Show outcome
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card>
                <CardHeader>
                  {fraudMistake ? (
                    <ShieldAlert className="h-8 w-8 text-rose-700 dark:text-rose-300" aria-hidden="true" />
                  ) : (
                    <Award className="h-8 w-8 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                  )}
                  <h2 className="text-2xl font-semibold">Verifier outcome</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Rewards</p>
                      <p className="text-xl font-semibold">{fraudMistake ? "18 VST" : "42 VST"}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Accuracy</p>
                      <p className="text-xl font-semibold">{score}%</p>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Reputation NFT</p>
                      <p className="text-xl font-semibold">Updated</p>
                    </div>
                  </div>
                  {fraudMistake ? (
                    <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
                      You voted APPROVE on a claim the supermajority and arbiter panel ruled DENY.
                      Your bond is slashed 50 VST and redistributed to correct verifiers.
                    </p>
                  ) : (
                    <p className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100">
                      The grey-area claim stayed within tolerance, so the dissenting vote was not
                      slashed.
                    </p>
                  )}
                  <div className="mt-4 rounded-md border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-semibold">Outcome summary</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      The reviewer completed three claims, caught the clear fraud pattern, and saw
                      reputation update immediately after resolution.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <TransactionStatus
              title={step === 1 ? "Preparing verifier pool entry" : "Verifier action recorded"}
              detail={
                step === 1
                  ? "The faucet will prepare demo-only balances before the staking transaction."
                  : "The sandbox shows each commit, reveal, and final accounting step in plain English."
              }
              wait={step === 1 ? "Ready" : "About 30 sec"}
              pending={staking}
              txHash={txHash}
            />
            {step === 3 ? <SlashingEventTicker compact source="sandbox" /> : null}
          </div>

          <div className="grid gap-4">
            {claims.map((claim) => (
              <div key={claim.id} className="grid gap-3">
                <ClaimCard claim={claim} active={Boolean(claim.fraudTrigger)} />
                {claim.fraudTrigger ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
                    Fraud signal: this packet clusters same-day billing, repeated parties, or
                    duplicate evidence. A careless approval should have consequences.
                  </div>
                ) : null}
                {step >= 2 ? (
                  <VoteWidget
                    expected={claim.expectedOutcome}
                    onVote={(choice, correct) =>
                      setVotes((previous) => ({ ...previous, [claim.id]: { choice, correct } }))
                    }
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
