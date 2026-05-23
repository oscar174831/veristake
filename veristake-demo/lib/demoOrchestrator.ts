import "server-only";
import { randomUUID } from "node:crypto";
import { createWalletClient, http, parseEther, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepoliaLite } from "@/lib/chains";
import { autoClaims, healthClaims, type Domain, type Persona } from "@/lib/scenarios";
import { getSessionStore } from "@/lib/sessionStore";

export type DemoPhase =
  | "created"
  | "funded"
  | "submitted"
  | "commit"
  | "reveal"
  | "resolved"
  | "payout";

export type DemoEvent = {
  atMs: number;
  label: string;
  detail: string;
  txHash?: string;
};

export type DemoSession = {
  id: string;
  persona: Persona;
  domain: Domain;
  walletAddress: Address;
  scenarioId: string;
  createdAt: number;
  verifierPattern: Array<{
    address: Address;
    vote: "APPROVE" | "DENY" | "PARTIAL";
    accuracy: number;
  }>;
  events: DemoEvent[];
};

const fallbackVerifiers = Array.from({ length: 10 }, (_, index) => {
  const hex = (index + 1).toString(16).padStart(40, "0");
  return `0x${hex}` as Address;
});

function parseVerifierAddresses() {
  const raw = process.env.DEMO_VERIFIER_PRIVATE_KEYS_JSON;
  if (!raw) return fallbackVerifiers;
  try {
    const keys = JSON.parse(raw) as `0x${string}`[];
    return keys.slice(0, 10).map((key) => privateKeyToAccount(key).address);
  } catch {
    return fallbackVerifiers;
  }
}

function fakeTxHash(seed: string) {
  const source = Buffer.from(seed).toString("hex").padEnd(64, "0").slice(0, 64);
  return `0x${source}`;
}

function scenarioFor(persona: Persona, domain: Domain) {
  if (persona === "carrier") return "auto-pacific-mutual";
  if (persona === "claimant") return domain === "HEALTH" ? "health-er-angina" : "auto-rear-end";
  return domain === "HEALTH" ? "health-three-claims" : "auto-three-claims";
}

function scriptedVotes(domain: Domain) {
  const verifiers = parseVerifierAddresses();
  const isHealth = domain === "HEALTH";
  const pattern = isHealth
    ? ["APPROVE", "APPROVE", "APPROVE", "APPROVE", "DENY"]
    : ["PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "APPROVE"];

  return pattern.map((vote, index) => ({
    address: verifiers[index] ?? fallbackVerifiers[index],
    vote: vote as "APPROVE" | "DENY" | "PARTIAL",
    accuracy: 92 - index * 3
  }));
}

function phaseEvents(session: DemoSession, now = Date.now()): DemoEvent[] {
  const elapsed = now - session.createdAt;
  const voteCount = Math.min(session.verifierPattern.length, Math.floor(elapsed / 9000) + 1);
  const claimTitle =
    session.domain === "HEALTH" ? healthClaims[1].title : session.persona === "carrier" ? "Pacific Mutual onboarding" : autoClaims[1].title;

  const events: DemoEvent[] = [
    {
      atMs: 0,
      label: "Demo session prepared",
      detail: "A sandbox wallet and scenario were prepared for this visitor.",
      txHash: fakeTxHash(`${session.id}-prepared`)
    },
    {
      atMs: 8000,
      label: "Claim packet submitted",
      detail: `${claimTitle} entered the demo sandbox queue.`,
      txHash: fakeTxHash(`${session.id}-submitted`)
    },
    {
      atMs: 18000,
      label: "Verifier review opened",
      detail: `Reviewers are comparing evidence and filing private commitments (${Math.min(voteCount, session.verifierPattern.length)}/${session.verifierPattern.length} votes in).`,
      txHash: fakeTxHash(`${session.id}-commit`)
    },
    {
      atMs: 46000,
      label: "Votes revealed",
      detail: "The sandbox advanced to reveal so the visitor can see the decision path.",
      txHash: fakeTxHash(`${session.id}-reveal`)
    },
    {
      atMs: 69000,
      label: "Resolution reached",
      detail:
        session.domain === "HEALTH"
          ? "The pool voted APPROVE 4-1; the dissenting vote stayed within tolerance."
          : "The pool selected PARTIAL with a $6,800 median payout.",
      txHash: fakeTxHash(`${session.id}-resolved`)
    },
    {
      atMs: 88000,
      label: "Payout released",
      detail: "Carrier reserve marked the approved policyholder payout in the demo sandbox.",
      txHash: fakeTxHash(`${session.id}-payout`)
    }
  ];

  return events.filter((event) => event.atMs <= elapsed + 1000);
}

export function currentPhase(session: DemoSession, now = Date.now()): DemoPhase {
  const elapsed = now - session.createdAt;
  if (elapsed >= 88000) return "payout";
  if (elapsed >= 69000) return "resolved";
  if (elapsed >= 46000) return "reveal";
  if (elapsed >= 18000) return "commit";
  if (elapsed >= 8000) return "submitted";
  if (elapsed >= 3000) return "funded";
  return "created";
}

export async function createDemoSession(input: {
  persona: Persona;
  domain?: Domain;
  walletAddress?: Address;
}) {
  const id = randomUUID();
  const domain = input.domain ?? (input.persona === "carrier" ? "AUTO" : "HEALTH");
  const walletAddress =
    input.walletAddress ?? (`0x${id.replace(/-/g, "").padEnd(40, "0").slice(0, 40)}` as Address);
  const session: DemoSession = {
    id,
    persona: input.persona,
    domain,
    walletAddress,
    scenarioId: scenarioFor(input.persona, domain),
    createdAt: Date.now(),
    verifierPattern: scriptedVotes(domain),
    events: []
  };
  session.events = phaseEvents(session);
  await getSessionStore().putSession(session);

  if (process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL) {
    await maybeWarpTenderlyTime(30);
  }

  return serializeSession(session);
}

export async function getDemoSession(id: string) {
  const session = await getSessionStore().getSession(id);
  if (!session) return null;
  session.events = phaseEvents(session);
  await getSessionStore().putSession(session);
  return serializeSession(session);
}

export async function dripFaucet(address: Address) {
  const rpc = process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL;
  const faucetKey = process.env.FAUCET_PRIVATE_KEY as `0x${string}` | undefined;

  if (!rpc || !faucetKey) {
    return {
      mode: "simulated" as const,
      ethTxHash: fakeTxHash(`${address}-eth`),
      vstTxHash: fakeTxHash(`${address}-vst`),
      message: "Demo balances simulated because faucet keys are not configured."
    };
  }

  const account = privateKeyToAccount(faucetKey);
  const client = createWalletClient({ account, chain: baseSepoliaLite, transport: http(rpc) });
  const ethTxHash = await client.sendTransaction({
    to: address,
    value: parseEther("0.01")
  });

  return {
    mode: "live" as const,
    ethTxHash,
    vstTxHash: fakeTxHash(`${address}-vst-pending`),
    message: "Native token drip sent. VST minting uses the demo VST faucet key when configured."
  };
}

export async function maybeWarpTenderlyTime(seconds: number) {
  const rpc = process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL;
  if (!rpc) return false;
  await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "evm_increaseTime", params: [seconds] })
  });
  await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "evm_mine", params: [] })
  });
  return true;
}

export function serializeSession(session: DemoSession) {
  return {
    ...session,
    phase: currentPhase(session),
    events: phaseEvents(session),
    isSandbox: true,
    explorerBaseUrl: null
  };
}
