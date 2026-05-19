import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

type Answers = {
  baseRpcUrl: string;
  tenderlyRpcUrl: string;
  tenderlyProjectSlug: string;
  tenderlyAccessKey: string;
  privyAppId: string;
  privyAppSecret: string;
  sessionStore: "memory" | "kv";
  kvRestApiUrl: string;
  kvRestApiToken: string;
  siteUrl: string;
  deployDemoContracts: boolean;
};

const root = process.cwd();
const docsDir = path.join(root, "docs");
const statePath = path.join(docsDir, "setup-state.json");
const logPath = path.join(docsDir, "setup-log.txt");
const envPath = path.join(root, ".env.local");
const walletsPath = path.join(docsDir, "wallets.json");
const args = new Set(process.argv.slice(2));
const nonInteractive = args.has("--non-interactive") || args.has("--mock");
const mocked = args.has("--mock");
const resume = args.has("--resume");

function isUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validSecret(value: string) {
  return value.trim().length >= 8 ? true : "Enter at least 8 characters";
}

async function log(message: string) {
  await mkdir(docsDir, { recursive: true });
  await writeFile(logPath, `${new Date().toISOString()} ${message}\n`, { flag: "a" });
}

async function saveState(phase: number, answers: Partial<Answers>) {
  await mkdir(docsDir, { recursive: true });
  await writeFile(statePath, JSON.stringify({ phase, answers }, null, 2));
}

async function loadState(): Promise<Partial<Answers>> {
  if (!resume || !existsSync(statePath)) return {};
  const parsed = JSON.parse(await readFile(statePath, "utf8")) as { answers?: Partial<Answers> };
  await log("Resuming setup from docs/setup-state.json");
  return parsed.answers ?? {};
}

async function promptInput(
  label: string,
  fallback: string,
  validate: (value: string) => true | string,
  secret = false
) {
  if (nonInteractive) {
    const result = fallback;
    const validation = validate(result);
    if (validation !== true) throw new Error(`${label}: ${validation}`);
    return result;
  }
  const prompts = await import("@inquirer/prompts");
  return secret
    ? prompts.password({ message: label, mask: "*", validate })
    : prompts.input({ message: label, default: fallback, validate });
}

async function promptConfirm(label: string, fallback: boolean) {
  if (nonInteractive) return fallback;
  const { confirm } = await import("@inquirer/prompts");
  return confirm({ message: label, default: fallback });
}

function makeWallet(label: string) {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { label, address: account.address, privateKey };
}

async function writeAtomic(file: string, contents: string) {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, contents);
  await rename(tmp, file);
}

async function maybeDeployDemo(answers: Answers) {
  if (!answers.deployDemoContracts) {
    await log("Phase 6 skipped: demo contract deployment not requested.");
    return;
  }
  const contractsDir = path.resolve(root, "..", "veristake-contracts");
  const result = spawnSync(
    "forge",
    [
      "script",
      "script/DeployDemo.s.sol:DeployDemo",
      "--rpc-url",
      answers.tenderlyRpcUrl,
      "--broadcast"
    ],
    {
      cwd: contractsDir,
      env: {
        ...process.env,
        DEMO_BACKEND_KEY: process.env.DEMO_BACKEND_KEY || process.env.FAUCET_PRIVATE_KEY || "",
        DEMO_VST_FAUCET_WALLET: process.env.DEMO_VST_FAUCET_WALLET || ""
      },
      encoding: "utf8"
    }
  );
  await log(`Phase 6 forge deploy exit code: ${result.status ?? "unknown"}`);
  if (result.status !== 0) {
    throw new Error(`Demo deployment failed. See forge output:\n${result.stderr || result.stdout}`);
  }
}

async function smokeTest(siteUrl: string) {
  const response = await fetch(new URL("/api/health", siteUrl));
  if (!response.ok) throw new Error(`Health check failed with HTTP ${response.status}`);
  await log("Phase 7 smoke test passed against /api/health.");
}

async function main() {
  await mkdir(docsDir, { recursive: true });
  await log("Setup started.");
  const saved = await loadState();

  const answers: Answers = {
    baseRpcUrl: await promptInput(
      "Base Sepolia RPC URL",
      saved.baseRpcUrl || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || (mocked ? "https://sepolia.base.org" : ""),
      (value) => (isUrl(value) ? true : "Enter a valid HTTP(S) RPC URL")
    ),
    tenderlyRpcUrl: "",
    tenderlyProjectSlug: "",
    tenderlyAccessKey: "",
    privyAppId: "",
    privyAppSecret: "",
    sessionStore: "memory",
    kvRestApiUrl: "",
    kvRestApiToken: "",
    siteUrl: "",
    deployDemoContracts: false
  };
  await saveState(1, answers);
  await log("Phase 1 complete: Base Sepolia RPC captured.");

  answers.tenderlyRpcUrl = await promptInput(
    "Tenderly Virtual TestNet RPC URL",
    saved.tenderlyRpcUrl || process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL || (mocked ? "https://virtual.base.rpc.tenderly.co/mock" : ""),
    (value) => (isUrl(value) ? true : "Enter a valid Tenderly RPC URL")
  );
  answers.tenderlyProjectSlug = await promptInput(
    "Tenderly project slug",
    saved.tenderlyProjectSlug || process.env.TENDERLY_PROJECT_SLUG || (mocked ? "veristake-demo" : ""),
    (value) => (value.trim().length ? true : "Tenderly project slug is required")
  );
  answers.tenderlyAccessKey = await promptInput(
    "Tenderly access key",
    saved.tenderlyAccessKey || process.env.TENDERLY_ACCESS_KEY || (mocked ? "mock-tenderly-key" : ""),
    validSecret,
    true
  );
  await saveState(2, answers);
  await log("Phase 2 complete: Tenderly settings captured.");

  answers.privyAppId = await promptInput(
    "Privy app id",
    saved.privyAppId || process.env.NEXT_PUBLIC_PRIVY_APP_ID || (mocked ? "mock-privy-app" : ""),
    (value) => (value.trim().length ? true : "Privy app id is required")
  );
  answers.privyAppSecret = await promptInput(
    "Privy app secret",
    saved.privyAppSecret || process.env.PRIVY_APP_SECRET || (mocked ? "mock-privy-secret" : ""),
    validSecret,
    true
  );
  await saveState(3, answers);
  await log("Phase 3 complete: Privy settings captured.");

  const faucet = makeWallet("demo-native-faucet");
  const vstFaucet = makeWallet("demo-vst-faucet");
  const verifiers = Array.from({ length: 10 }, (_, index) => makeWallet(`demo-verifier-${index + 1}`));
  await saveState(4, answers);
  await log("Phase 4 complete: faucet and verifier wallets generated.");

  const useKv = await promptConfirm("Use Vercel KV for durable sessions?", saved.sessionStore === "kv");
  answers.sessionStore = useKv ? "kv" : "memory";
  answers.kvRestApiUrl = useKv
    ? await promptInput(
        "KV_REST_API_URL",
        saved.kvRestApiUrl || process.env.KV_REST_API_URL || (mocked ? "https://mock-kv.vercel-storage.com" : ""),
        (value) => (isUrl(value) ? true : "Enter a valid KV REST URL")
      )
    : "";
  answers.kvRestApiToken = useKv
    ? await promptInput(
        "KV_REST_API_TOKEN",
        saved.kvRestApiToken || process.env.KV_REST_API_TOKEN || (mocked ? "mock-kv-token" : ""),
        validSecret,
        true
      )
    : "";
  await saveState(5, answers);
  await log("Phase 5 complete: session storage captured.");

  answers.deployDemoContracts = await promptConfirm("Deploy demo contracts to Tenderly now?", false);
  await maybeDeployDemo(answers);
  await saveState(6, answers);

  answers.siteUrl = await promptInput(
    "Site URL for smoke test",
    saved.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000",
    (value) => (isUrl(value) ? true : "Enter a valid site URL")
  );
  if (!mocked) await smokeTest(answers.siteUrl);
  else await log("Phase 7 mock smoke test recorded.");
  await saveState(7, answers);

  const env = [
    `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=${answers.baseRpcUrl}`,
    `NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL=${answers.tenderlyRpcUrl}`,
    "NEXT_PUBLIC_VERISTAKE_DEMO_DEPLOYMENT_ADDRESSES_JSON=",
    "NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON=",
    `NEXT_PUBLIC_PRIVY_APP_ID=${answers.privyAppId}`,
    `PRIVY_APP_ID=${answers.privyAppId}`,
    `PRIVY_APP_SECRET=${answers.privyAppSecret}`,
    `FAUCET_PRIVATE_KEY=${faucet.privateKey}`,
    `DEMO_VST_FAUCET_WALLET=${vstFaucet.address}`,
    `DEMO_VST_FAUCET_PRIVATE_KEY=${vstFaucet.privateKey}`,
    `DEMO_VERIFIER_PRIVATE_KEYS_JSON=${JSON.stringify(verifiers.map((wallet) => wallet.privateKey))}`,
    `SESSION_STORE=${answers.sessionStore}`,
    `KV_REST_API_URL=${answers.kvRestApiUrl}`,
    `KV_REST_API_TOKEN=${answers.kvRestApiToken}`,
    "FAUCET_RATE_LIMIT_PER_HOUR=5",
    "FAUCET_DAILY_CAP=25",
    `TENDERLY_PROJECT_SLUG=${answers.tenderlyProjectSlug}`,
    `TENDERLY_ACCESS_KEY=${answers.tenderlyAccessKey}`,
    "NEXT_PUBLIC_CONTACT_EMAIL=hello@veristake.xyz",
    "NEXT_PUBLIC_CALENDLY_URL=",
    "NEXT_PUBLIC_EXPLORER_BASE_URL=https://sepolia.basescan.org",
    `NEXT_PUBLIC_SITE_URL=${answers.siteUrl}`
  ].join("\n");

  await writeAtomic(envPath, `${env}\n`);
  await writeAtomic(
    walletsPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), faucet, vstFaucet, verifiers }, null, 2)}\n`
  );
  await log("Setup complete. .env.local and docs/wallets.json written atomically.");
  console.log("Setup complete. Review .env.local and docs/wallets.json.");
}

main().catch(async (error) => {
  await log(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
  console.error(error);
  process.exit(1);
});
