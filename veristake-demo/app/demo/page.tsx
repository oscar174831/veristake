"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

const personas = [
  {
    href: "/demo/carrier",
    title: "Carrier",
    icon: ClipboardCheck,
    summary: "Onboard Pacific Mutual, register an AUTO policy, fund a carrier reserve, and watch claims resolve.",
    action: "Register a carrier and policy",
    time: "About 2 minutes",
    outcome: "Executive reserve and payout summary"
  },
  {
    href: "/demo/claimant",
    title: "Claimant",
    icon: UserCheck,
    summary: "Submit a HEALTH or AUTO appeal packet and see the decision path to payout.",
    action: "Submit a denied claim appeal",
    time: "About 3 minutes",
    outcome: "Decision and payout summary"
  },
  {
    href: "/demo/verifier",
    title: "Verifier",
    icon: Stethoscope,
    summary: "Review three claims, vote, and see rewards, accuracy, and penalty logic in action.",
    action: "Review evidence and decide",
    time: "About 3 minutes",
    outcome: "Fraud, accuracy, and reputation summary"
  }
];

export default function DemoHubPage() {
  return (
    <section className="min-h-[calc(100vh-4rem)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge tone="blue">Demo sandbox</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
            Pick a role and finish a claim flow without setup.
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Each path is a guided product tour. You will see the business action, the expected wait,
            and the outcome a carrier leader could screenshot for a follow-up meeting.
          </p>
        </div>
        <div className="mt-6 grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100 md:grid-cols-[auto_1fr]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <p>
            Demo mode uses simulated or sandbox balances when env vars are missing. The public
            dashboard stays read-only against the production-grade Base Sepolia deployment.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {personas.map((persona) => {
            const Icon = persona.icon;
            return (
              <Card key={persona.href}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-semibold">{persona.title}</h2>
                </CardHeader>
                <CardContent>
                  <p className="min-h-24 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {persona.summary}
                  </p>
                  <div className="grid gap-2 text-sm">
                    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">What you will do</p>
                      <p className="font-medium">{persona.action}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">How long it takes</p>
                      <p className="flex items-center gap-2 font-medium">
                        <Clock3 className="h-4 w-4" aria-hidden="true" />
                        {persona.time}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">What you will see</p>
                      <p className="font-medium">{persona.outcome}</p>
                    </div>
                  </div>
                  <Link
                    href={persona.href}
                    prefetch={false}
                    onClick={() => trackEvent("demo_persona_selected", { persona: persona.title.toLowerCase() })}
                  >
                    <Button className="mt-5 w-full">
                      Start {persona.title} Demo
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
