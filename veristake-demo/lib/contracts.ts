import "server-only";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Abi, Address } from "viem";

export type ContractName =
  | "VST"
  | "ClaimRegistry"
  | "VerifierStaking"
  | "Voting"
  | "ArbiterEscalation"
  | "SoulboundReputation"
  | "Slashing"
  | "CarrierGateway";

export type DeploymentKind = "production" | "demo";

export type ContractConfig = {
  address: Address;
  abi: Abi;
};

export type VeristakeDeployment = Record<ContractName, ContractConfig>;

const contractNames: ContractName[] = [
  "VST",
  "ClaimRegistry",
  "VerifierStaking",
  "Voting",
  "ArbiterEscalation",
  "SoulboundReputation",
  "Slashing",
  "CarrierGateway"
];

const zeroAddress = "0x0000000000000000000000000000000000000000" as Address;
const artifactsRoot = path.resolve(process.cwd(), "../veristake-contracts/out");

function findArtifactFile(contractName: ContractName): string | null {
  if (!existsSync(artifactsRoot)) return null;
  const stack = [artifactsRoot];
  const target = `${contractName}.json`;

  while (stack.length) {
    const dir = stack.pop();
    if (!dir) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name === target) {
        return full;
      }
    }
  }

  return null;
}

function readArtifactAbi(contractName: ContractName): Abi {
  const file = findArtifactFile(contractName);
  if (!file) return [];
  const artifact = JSON.parse(readFileSync(file, "utf8")) as { abi?: Abi };
  return artifact.abi ?? [];
}

function parseAddresses(envValue: string | undefined): Partial<Record<ContractName, Address>> {
  if (!envValue) return {};
  try {
    const parsed = JSON.parse(envValue) as Partial<Record<ContractName, Address>>;
    return parsed;
  } catch {
    return {};
  }
}

function deployment(kind: DeploymentKind): VeristakeDeployment {
  const env =
    kind === "demo"
      ? process.env.NEXT_PUBLIC_VERISTAKE_DEMO_DEPLOYMENT_ADDRESSES_JSON
      : process.env.NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON;
  const addresses = parseAddresses(env);

  return Object.fromEntries(
    contractNames.map((name) => [
      name,
      {
        address: addresses[name] ?? zeroAddress,
        abi: readArtifactAbi(name)
      }
    ])
  ) as VeristakeDeployment;
}

export const productionDeployment = deployment("production");
export const demoDeployment = deployment("demo");

export function getDeployment(kind: DeploymentKind) {
  return kind === "demo" ? demoDeployment : productionDeployment;
}

export function hasConfiguredAddresses(kind: DeploymentKind) {
  return contractNames.some((name) => getDeployment(kind)[name].address !== zeroAddress);
}

export const chainRouting = {
  dashboard: "production",
  landing: "production",
  demo: "demo"
} as const;
