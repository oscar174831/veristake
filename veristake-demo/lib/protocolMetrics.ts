import type { Address } from "viem";

export type MetricsTimeframe = "24h" | "7d" | "all";

export type SlashingEvent = {
  claimId: string;
  verifier: string;
  amount: string;
  txHash?: string;
};

export type CarrierIntegration = {
  count: number | null;
  names: string[];
};

export type TopVerifier = {
  address: Address;
  accuracy: string;
};

export type ResolutionHistogramBucket = {
  bucket: string;
  claims: number;
};

export type AccuracyTrendPoint = {
  day: string;
  accuracy: number;
};

export type ProtocolMetrics = {
  configured: boolean;
  source: "live" | "snapshot" | "unconfigured";
  sourceLabel: string;
  totalClaimsProcessed: number | null;
  averageResolutionTime: string | null;
  networkAccuracy: string | null;
  totalVstStaked: string | null;
  resolutionHistogram: ResolutionHistogramBucket[];
  accuracyTrend: AccuracyTrendPoint[];
  recentSlashingEvents: SlashingEvent[];
  carrierIntegrations: CarrierIntegration;
  topVerifiers: TopVerifier[];
  emptyState: string;
  lastUpdatedAt: string | null;
  readSucceeded: boolean;
};

export const emptyProtocolMetrics: ProtocolMetrics = {
  configured: false,
  source: "unconfigured",
  sourceLabel: "Configuration needed",
  totalClaimsProcessed: null,
  averageResolutionTime: null,
  networkAccuracy: null,
  totalVstStaked: null,
  resolutionHistogram: [],
  accuracyTrend: [],
  recentSlashingEvents: [],
  carrierIntegrations: {
    count: null,
    names: []
  },
  topVerifiers: [],
  emptyState: "Awaiting first claim",
  lastUpdatedAt: null,
  readSucceeded: false
};

export const seededProtocolMetricsSnapshot: ProtocolMetrics = {
  configured: true,
  source: "snapshot",
  sourceLabel: "Last verified testnet snapshot",
  totalClaimsProcessed: 5,
  averageResolutionTime: "32 sec",
  networkAccuracy: "70.1%",
  totalVstStaked: "1,950 VST",
  resolutionHistogram: [
    { bucket: "<1h", claims: 5 },
    { bucket: "1-6h", claims: 0 },
    { bucket: "6-24h", claims: 0 },
    { bucket: "1-3d", claims: 0 },
    { bucket: ">3d", claims: 0 }
  ],
  accuracyTrend: [{ day: "May 19", accuracy: 70.1 }],
  recentSlashingEvents: [
    {
      claimId: "5",
      verifier: "0x808c...8499",
      amount: "50 VST",
      txHash: "0x16d032116dd919f466104b66fd817440cb56dd33602814f2d9046f257d9f412a"
    }
  ],
  carrierIntegrations: {
    count: 2,
    names: ["Carrier 0x808c...8499", "Carrier 0x0000...11cE"]
  },
  topVerifiers: [
    { address: "0x808c1A517959a25E59B1117E80A7B500229A8499", accuracy: "70.3%" },
    { address: "0x0000000000000000000000000000000000001001", accuracy: "70.3%" },
    { address: "0x0000000000000000000000000000000000001002", accuracy: "70.3%" },
    { address: "0x0000000000000000000000000000000000001003", accuracy: "69.3%" }
  ],
  emptyState: "Awaiting first claim",
  lastUpdatedAt: "2026-05-19T22:47:31.006Z",
  readSucceeded: false
};
