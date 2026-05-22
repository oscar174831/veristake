import "server-only";
import {
  createPublicClient,
  formatUnits,
  http,
  parseAbiItem,
  type Address,
  type AbiEvent,
  type Hash
} from "viem";
import { baseSepoliaLite } from "@/lib/chains";
import { getDeployment, hasConfiguredAddresses } from "@/lib/contracts";
import { formatAddress } from "@/lib/utils";
import {
  emptyProtocolMetrics,
  seededProtocolMetricsSnapshot,
  type MetricsTimeframe,
  type ProtocolMetrics,
  type ResolutionHistogramBucket
} from "@/lib/protocolMetrics";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const approximateBaseBlocksPerDay = 43_200n;
const maxLogBlockRange = 1_800n;
const fallbackDeploymentBlock = 41_708_833n;
const metricTimeoutMs = 6_000;

const claimSubmittedEvent = parseAbiItem(
  "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed domainId, bytes32 indexed policyId, address claimant, uint128 requestedPayoutAmount)"
);
const claimStateChangedEvent = parseAbiItem(
  "event ClaimStateChanged(uint256 indexed claimId, uint8 fromState, uint8 toState)"
);
const accuracyUpdatedEvent = parseAbiItem(
  "event AccuracyUpdated(address indexed verifier, uint256 indexed domainId, uint16 accuracyBps)"
);
const claimBondSlashedEvent = parseAbiItem(
  "event ClaimBondSlashed(address indexed verifier, uint256 indexed claimId, uint128 amount, address recipient)"
);
const carrierRegisteredEvent = parseAbiItem(
  "event CarrierRegistered(address indexed carrierAdmin, bytes32 carrierLicenseHash)"
);

type IndexedEventLog = {
  blockNumber: bigint | null;
  transactionHash: Hash | null;
  args: Record<string, unknown>;
};

function publicClient() {
  return createPublicClient({
    chain: baseSepoliaLite,
    transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || undefined)
  });
}

function nonZero(address: Address) {
  return address.toLowerCase() !== zeroAddress;
}

function daysForTimeframe(timeframe: MetricsTimeframe) {
  if (timeframe === "24h") return 1;
  if (timeframe === "7d") return 7;
  return 365;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = metricTimeoutMs): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

function snapshotWithTimestamp(): ProtocolMetrics {
  return {
    ...seededProtocolMetricsSnapshot,
    lastUpdatedAt: new Date().toISOString()
  };
}

async function fromBlockForDays(client: ReturnType<typeof publicClient>, days: number) {
  const current = await client.getBlockNumber();
  const window = BigInt(days) * approximateBaseBlocksPerDay;
  const windowStart = current > window ? current - window : 0n;
  const deploymentStart = process.env.NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_BLOCK;
  if (!deploymentStart) return fallbackDeploymentBlock > windowStart ? fallbackDeploymentBlock : windowStart;

  try {
    const deploymentBlock = BigInt(deploymentStart);
    return deploymentBlock > windowStart ? deploymentBlock : windowStart;
  } catch {
    return windowStart;
  }
}

async function getLogsInChunks<const event extends AbiEvent>(
  client: ReturnType<typeof publicClient>,
  params: {
    address: Address;
    event: event;
    fromBlock: bigint;
  }
) {
  const latest = await client.getBlockNumber();
  const logs: IndexedEventLog[] = [];
  let cursor = params.fromBlock;

  while (cursor <= latest) {
    const toBlock = cursor + maxLogBlockRange > latest ? latest : cursor + maxLogBlockRange;
    let chunk: IndexedEventLog[] | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        chunk = (await client.getLogs({
          address: params.address,
          event: params.event,
          fromBlock: cursor,
          toBlock
        })) as IndexedEventLog[];
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    if (!chunk) {
      throw new Error("Unable to read log chunk");
    }

    logs.push(...chunk);
    cursor = toBlock + 1n;

    if (cursor <= latest) {
      await new Promise((resolve) => setTimeout(resolve, 75));
    }
  }

  return logs;
}

function compactNumber(value: bigint, decimals = 18) {
  const numeric = Number(formatUnits(value, decimals));
  if (!Number.isFinite(numeric)) return formatUnits(value, decimals);
  return new Intl.NumberFormat("en-US", {
    notation: numeric >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: numeric >= 1_000 ? 1 : 2
  }).format(numeric);
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 60 * 60) return `${Math.round(seconds / 60)} min`;
  if (seconds < 24 * 60 * 60) return `${Math.round(seconds / 3600)} hr`;
  return `${Math.round(seconds / 86_400)} days`;
}

function bucketDurations(durationsSeconds: number[]): ResolutionHistogramBucket[] {
  const buckets: ResolutionHistogramBucket[] = [
    { bucket: "<1h", claims: 0 },
    { bucket: "1-6h", claims: 0 },
    { bucket: "6-24h", claims: 0 },
    { bucket: "1-3d", claims: 0 },
    { bucket: ">3d", claims: 0 }
  ];

  for (const duration of durationsSeconds) {
    if (duration < 3600) buckets[0].claims += 1;
    else if (duration < 21_600) buckets[1].claims += 1;
    else if (duration < 86_400) buckets[2].claims += 1;
    else if (duration < 259_200) buckets[3].claims += 1;
    else buckets[4].claims += 1;
  }

  return buckets;
}

async function blockTimestamps(blockNumbers: bigint[]) {
  const client = publicClient();
  const unique = Array.from(new Set(blockNumbers.map((block) => block.toString())));
  const entries = await Promise.all(
    unique.map(async (block) => {
      const data = await client.getBlock({ blockNumber: BigInt(block) });
      return [block, Number(data.timestamp)] as const;
    })
  );
  return new Map(entries);
}

export async function getTotalClaimsProcessed(timeframe: MetricsTimeframe = "all") {
  const deployment = getDeployment("production");
  const registry = deployment.ClaimRegistry;
  if (!nonZero(registry.address)) return null;

  try {
    if (timeframe !== "all") {
      const client = publicClient();
      const fromBlock = await fromBlockForDays(client, daysForTimeframe(timeframe));
      const logs = await getLogsInChunks(client, { address: registry.address, event: claimSubmittedEvent, fromBlock });
      return logs.length || null;
    }

    const latestClaimId = (await publicClient().readContract({
      address: registry.address,
      abi: registry.abi,
      functionName: "nextClaimId"
    })) as bigint;
    return latestClaimId > 1n ? Number(latestClaimId - 1n) : null;
  } catch {
    return null;
  }
}

export async function getAverageResolutionTime(timeframe: MetricsTimeframe = "all") {
  const deployment = getDeployment("production");
  const registry = deployment.ClaimRegistry;
  if (!nonZero(registry.address)) {
    return { average: null, histogram: [] as ResolutionHistogramBucket[] };
  }

  try {
    const client = publicClient();
    const fromBlock = await fromBlockForDays(client, daysForTimeframe(timeframe));
    const submitted = await getLogsInChunks(client, { address: registry.address, event: claimSubmittedEvent, fromBlock });
    const stateChanges = await getLogsInChunks(client, {
      address: registry.address,
      event: claimStateChangedEvent,
      fromBlock
    });

    if (!submitted.length || !stateChanges.length) {
      return { average: null, histogram: [] as ResolutionHistogramBucket[] };
    }

    const relevantBlocks = [
      ...submitted.map((log) => log.blockNumber),
      ...stateChanges.map((log) => log.blockNumber)
    ].filter(Boolean) as bigint[];
    const timestamps = await blockTimestamps(relevantBlocks);
    const submittedAt = new Map<string, number>();
    const resolvedAt = new Map<string, number>();

    for (const log of submitted) {
      if (!log.blockNumber) continue;
      submittedAt.set(String(log.args.claimId), timestamps.get(log.blockNumber.toString()) ?? 0);
    }

    for (const log of stateChanges) {
      if (!log.blockNumber) continue;
      if (Number(log.args.toState) !== 5) continue;
      resolvedAt.set(String(log.args.claimId), timestamps.get(log.blockNumber.toString()) ?? 0);
    }

    const durations = Array.from(resolvedAt.entries())
      .map(([claimId, resolved]) => {
        const start = submittedAt.get(claimId);
        return start ? resolved - start : 0;
      })
      .filter((value) => value > 0);

    if (!durations.length) {
      return { average: null, histogram: [] as ResolutionHistogramBucket[] };
    }

    const averageSeconds = durations.reduce((sum, value) => sum + value, 0) / durations.length;
    return {
      average: formatDuration(averageSeconds),
      histogram: bucketDurations(durations)
    };
  } catch {
    return { average: null, histogram: [] as ResolutionHistogramBucket[] };
  }
}

export async function getNetworkAccuracy(timeframe: MetricsTimeframe = "all") {
  const deployment = getDeployment("production");
  const reputation = deployment.SoulboundReputation;
  if (!nonZero(reputation.address)) {
    return { average: null, topVerifiers: [] as ProtocolMetrics["topVerifiers"], trend: [] as ProtocolMetrics["accuracyTrend"] };
  }

  try {
    const client = publicClient();
    const fromBlock = await fromBlockForDays(client, daysForTimeframe(timeframe));
    const logs = await getLogsInChunks(client, { address: reputation.address, event: accuracyUpdatedEvent, fromBlock });
    if (!logs.length) {
      return { average: null, topVerifiers: [], trend: [] };
    }

    const latest = new Map<string, { verifier: Address; domainId: bigint; accuracyBps: number; blockNumber?: bigint }>();
    for (const log of logs) {
      if (!log.args.verifier || log.args.domainId === undefined || log.args.accuracyBps === undefined) continue;
      const verifier = log.args.verifier as Address;
      const domainId = log.args.domainId as bigint;
      const key = `${verifier.toLowerCase()}:${String(domainId)}`;
      latest.set(key, {
        verifier,
        domainId,
        accuracyBps: Number(log.args.accuracyBps),
        blockNumber: log.blockNumber ?? undefined
      });
    }

    const entries = Array.from(latest.values()).slice(-50);
    if (!entries.length) return { average: null, topVerifiers: [], trend: [] };

    const refreshed = await Promise.all(
      entries.map(async (entry) => {
        try {
          const value = (await client.readContract({
            address: reputation.address,
            abi: reputation.abi,
            functionName: "accuracyBps",
            args: [entry.verifier, entry.domainId]
          })) as number;
          return { ...entry, accuracyBps: Number(value) };
        } catch {
          return entry;
        }
      })
    );

    const mean = refreshed.reduce((sum, entry) => sum + entry.accuracyBps, 0) / refreshed.length;
    const topVerifiers = refreshed
      .sort((a, b) => b.accuracyBps - a.accuracyBps)
      .slice(0, 10)
      .map((entry) => ({
        address: entry.verifier,
        accuracy: `${(entry.accuracyBps / 100).toFixed(1)}%`
      }));

    const trendBlocks = refreshed.map((entry) => entry.blockNumber).filter(Boolean) as bigint[];
    const timestamps = await blockTimestamps(trendBlocks);
    const byDay = new Map<string, number[]>();
    for (const entry of refreshed) {
      if (!entry.blockNumber) continue;
      const timestamp = timestamps.get(entry.blockNumber.toString());
      if (!timestamp) continue;
      const day = new Date(timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay.set(day, [...(byDay.get(day) ?? []), entry.accuracyBps / 100]);
    }

    return {
      average: `${(mean / 100).toFixed(1)}%`,
      topVerifiers,
      trend: Array.from(byDay.entries()).map(([day, values]) => ({
        day,
        accuracy: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
      }))
    };
  } catch {
    return { average: null, topVerifiers: [], trend: [] };
  }
}

export async function getTotalVstStaked() {
  const deployment = getDeployment("production");
  const staking = deployment.VerifierStaking;
  if (!nonZero(staking.address)) return null;

  try {
    const total = (await publicClient().readContract({
      address: staking.address,
      abi: staking.abi,
      functionName: "totalStaked"
    })) as bigint;
    return total > 0n ? `${compactNumber(total)} VST` : null;
  } catch {
    return null;
  }
}

export async function getRecentSlashingEvents(limit: number, timeframe: MetricsTimeframe = "all") {
  const deployment = getDeployment("production");
  const staking = deployment.VerifierStaking;
  if (!nonZero(staking.address)) return [];

  try {
    const client = publicClient();
    const fromBlock = await fromBlockForDays(client, daysForTimeframe(timeframe));
    const logs = await getLogsInChunks(client, { address: staking.address, event: claimBondSlashedEvent, fromBlock });
    return logs
      .slice(-limit)
      .reverse()
      .map((log) => {
        const amount = typeof log.args.amount === "bigint" ? log.args.amount : BigInt(String(log.args.amount ?? "0"));
        return {
          claimId: String(log.args.claimId ?? ""),
          verifier: formatAddress(String(log.args.verifier ?? "")),
          amount: `${compactNumber(amount)} VST`,
          txHash: log.transactionHash as Hash
        };
      });
  } catch {
    return [];
  }
}

export async function getCarrierIntegrations(timeframe: MetricsTimeframe = "all") {
  const deployment = getDeployment("production");
  const gateway = deployment.CarrierGateway;
  if (!nonZero(gateway.address)) return { count: null, names: [] };

  try {
    const client = publicClient();
    const fromBlock = await fromBlockForDays(client, daysForTimeframe(timeframe));
    const logs = await getLogsInChunks(client, { address: gateway.address, event: carrierRegisteredEvent, fromBlock });
    const carriers = Array.from(new Set(logs.map((log) => String(log.args.carrierAdmin)))).filter(Boolean);
    return {
      count: carriers.length || null,
      names: carriers.slice(0, 10).map((address) => `Carrier ${formatAddress(address)}`)
    };
  } catch {
    return { count: null, names: [] };
  }
}

export async function getProtocolMetrics(timeframe: MetricsTimeframe = "all"): Promise<ProtocolMetrics> {
  if (!hasConfiguredAddresses("production")) {
    return emptyProtocolMetrics;
  }

  const [totalClaimsProcessed, resolution, totalVstStaked, recentSlashingEvents, carrierIntegrations, accuracy] =
    await Promise.all([
      withTimeout(getTotalClaimsProcessed(timeframe)),
      withTimeout(getAverageResolutionTime(timeframe)),
      withTimeout(getTotalVstStaked()),
      withTimeout(getRecentSlashingEvents(10, timeframe)),
      withTimeout(getCarrierIntegrations(timeframe)),
      withTimeout(getNetworkAccuracy(timeframe))
    ]);

  const snapshot = snapshotWithTimestamp();
  const readSucceeded = Boolean(
    totalClaimsProcessed ||
      resolution?.average ||
      totalVstStaked ||
      recentSlashingEvents?.length ||
      carrierIntegrations?.count ||
      accuracy?.average
  );

  if (!readSucceeded) {
    return snapshot;
  }

  return {
    configured: true,
    source: readSucceeded ? "live" : "snapshot",
    sourceLabel: readSucceeded ? "Live Base Sepolia" : "Last verified testnet snapshot",
    totalClaimsProcessed: totalClaimsProcessed ?? snapshot.totalClaimsProcessed,
    averageResolutionTime: resolution?.average ?? snapshot.averageResolutionTime,
    networkAccuracy: accuracy?.average ?? snapshot.networkAccuracy,
    totalVstStaked: totalVstStaked ?? snapshot.totalVstStaked,
    resolutionHistogram: resolution?.histogram.length ? resolution.histogram : snapshot.resolutionHistogram,
    accuracyTrend: accuracy?.trend.length ? accuracy.trend : snapshot.accuracyTrend,
    recentSlashingEvents: recentSlashingEvents?.length ? recentSlashingEvents : snapshot.recentSlashingEvents,
    carrierIntegrations: carrierIntegrations?.count ? carrierIntegrations : snapshot.carrierIntegrations,
    topVerifiers: accuracy?.topVerifiers.length ? accuracy.topVerifiers : snapshot.topVerifiers,
    emptyState: "Awaiting first claim",
    lastUpdatedAt: new Date().toISOString(),
    readSucceeded
  };
}
