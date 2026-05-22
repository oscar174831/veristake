import "server-only";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseAbi, type Abi, type Address } from "viem";

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

const fallbackAbis: Record<ContractName, Abi> = {
  VST: parseAbi(["function balanceOf(address account) view returns (uint256)"]),
  ClaimRegistry: parseAbi(["function nextClaimId() view returns (uint256)"]),
  VerifierStaking: parseAbi(["function totalStaked() view returns (uint256)"]),
  Voting: [],
  ArbiterEscalation: [],
  SoulboundReputation: parseAbi([
    "function accuracyBps(address verifier, uint256 domainId) view returns (uint16)"
  ]),
  Slashing: [],
  CarrierGateway: []
};

const productionFallbackAddresses: Partial<Record<ContractName, Address>> = {
  VST: "0xD51B95bEB9E482ff403601AA9Dfb8395720F954C",
  ClaimRegistry: "0xDfAE42667cE3110a419a72D267c63B9c1c760392",
  SoulboundReputation: "0x3f4baF01a444317EE0C0b220201F0D232A754964",
  VerifierStaking: "0x52061379eFFcC36143B1bfe3432Cb4419D5687B6",
  Voting: "0xDd36d3929F69ed55c7245081Cb0B6dA17628BF9c",
  CarrierGateway: "0x6Adc66f94dc5e06808532cbF51626AE7F2FAE7ED",
  ArbiterEscalation: "0xa3E05E210c873B9A1Ae8F919831bE2f0d5A963c4",
  Slashing: "0xE68010E9Ec8e407Ff1E4A23C68736B314c4D2C72"
};

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
  if (!file) return fallbackAbis[contractName];
  const artifact = JSON.parse(readFileSync(file, "utf8")) as { abi?: Abi };
  return artifact.abi ?? fallbackAbis[contractName];
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
  const fallbackAddresses = kind === "production" ? productionFallbackAddresses : {};

  return Object.fromEntries(
    contractNames.map((name) => [
      name,
      {
        address: addresses[name] ?? fallbackAddresses[name] ?? zeroAddress,
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
