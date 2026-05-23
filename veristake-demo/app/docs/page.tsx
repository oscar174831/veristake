import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const highlights = [
  {
    title: "Disputed-claim wedge",
    body: "Veristake is not meant to process every routine claim or operate as a consumer claims service. It starts with carrier-routed denied appeals, delayed payouts, complex evidence packets, suspected fraud, and other high-friction cases where independent review creates value."
  },
  {
    title: "Carrier-controlled balance sheet",
    body: "Veristake does not underwrite policies or hold insurance liability. Payouts release from carrier-funded reserves after claim resolution."
  },
  {
    title: "Domain-specific verifier pools",
    body: "Phase 2 exposes HEALTH and AUTO pools only. Each pool has credentialing, VST staking, private commit-reveal voting, and accuracy-weighted reputation."
  },
  {
    title: "Appeals and slashing",
    body: "A challenged claim opens appeal rounds. Clear, out-of-tolerance bad votes can be slashed and redistributed to accurate verifiers, treasury, and burn."
  },
  {
    title: "Not raw majority rule",
    body: "Verifier decisions should be weighted by credential scope, historical accuracy, reputation, stake, and case fit. Economic incentives deter reckless review, but expertise, appeal rights, and arbiter correction are what keep the model from becoming herd voting."
  },
  {
    title: "Dual deployment",
    body: "The public dashboard reads the real Base Sepolia deployment. Persona demos write to a Tenderly Base Sepolia virtual testnet with compressed timing."
  }
];

export default function DocsPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Badge tone="teal">Whitepaper highlights</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
          Veristake is a verification layer, not a carrier.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
          This demo distills the current whitepaper into the operational points an insurance
          executive needs before asking product, claims, and compliance teams to evaluate a
          carrier-routed disputed-claim pilot.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="/docs/whitepaper/Veristake_Whitepaper_v2.pdf" target="_blank" rel="noreferrer">
            <Button>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Open PDF
            </Button>
          </a>
          <Link href="/demo" prefetch={false}>
            <Button variant="secondary">
              Try the demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {highlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <h2 className="text-xl font-semibold">{item.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold">Contract integration map</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>
              <strong>ClaimRegistry:</strong> stores claim metadata hashes, lifecycle state, policy
              IDs, requested payout, and final outcome.
            </li>
            <li>
              <strong>VerifierStaking:</strong> records domain credentials, VST stake, and claim
              bonds.
            </li>
            <li>
              <strong>Voting:</strong> coordinates commit, reveal, resolve, finalize, and appeal
              rounds.
            </li>
            <li>
              <strong>CarrierGateway:</strong> registers carriers, policies, reserves, and final
              payout release.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
