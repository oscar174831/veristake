import type { Address } from "viem";

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
};

export const emptyProtocolMetrics: ProtocolMetrics = {
  configured: false,
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
  emptyState: "Awaiting first claim"
};
