export type Domain = "HEALTH" | "AUTO";
export type Persona = "carrier" | "claimant" | "verifier";
export type VoteChoice = "APPROVE" | "DENY" | "PARTIAL";

export type DemoClaim = {
  id: string;
  domain: Domain;
  title: string;
  amount: number;
  summary: string;
  evidence: string[];
  expectedOutcome: VoteChoice;
  expectedPayout?: number;
  fraudTrigger?: boolean;
};

export const healthClaims: DemoClaim[] = [
  {
    id: "health-annual-physical",
    domain: "HEALTH",
    title: "Routine annual physical",
    amount: 385,
    summary: "Preventive visit coded as a covered annual physical with routine labs.",
    evidence: ["CPT 99395", "Preventive care benefit", "No duplicate billing"],
    expectedOutcome: "APPROVE",
    expectedPayout: 385
  },
  {
    id: "health-er-angina",
    domain: "HEALTH",
    title: "ER visit denial appeal",
    amount: 4820,
    summary:
      "Patient went to the ER for chest pain. The insurer denied the visit as not medically necessary; cardiology workup confirmed unstable angina.",
    evidence: ["ICD-10 I20.0", "CPT 99285", "ED notes", "Cardiology consult"],
    expectedOutcome: "APPROVE",
    expectedPayout: 4820
  },
  {
    id: "health-duplicate-pt",
    domain: "HEALTH",
    title: "Duplicate-billed PT sessions",
    amount: 2160,
    summary:
      "Eighteen physical-therapy sessions were billed in the same calendar day across different provider NPIs.",
    evidence: ["Same-day session cluster", "Conflicting provider NPIs", "Duplicate procedure codes"],
    expectedOutcome: "DENY",
    fraudTrigger: true
  }
];

export const autoClaims: DemoClaim[] = [
  {
    id: "auto-clean-fender",
    domain: "AUTO",
    title: "Clean fender-bender claim",
    amount: 1280,
    summary: "Low-speed collision with aligned photos, estimate, and police incident number.",
    evidence: ["Repair estimate", "Timestamped photos", "Police incident number"],
    expectedOutcome: "APPROVE",
    expectedPayout: 1280
  },
  {
    id: "auto-rear-end",
    domain: "AUTO",
    title: "Rear-end collision, delayed payout",
    amount: 7140,
    summary:
      "Insured was rear-ended at a stoplight. Police report, repair estimate, and geo-tagged photographs support the claim; insurer offered $3,200 citing pre-existing damage.",
    evidence: ["Police report", "Repair shop estimate $7,140", "Geo-tagged photographs"],
    expectedOutcome: "PARTIAL",
    expectedPayout: 6800
  },
  {
    id: "auto-staged-collision",
    domain: "AUTO",
    title: "Staged-collision fraud pattern",
    amount: 9100,
    summary:
      "Multiple recent claims share the same VIN, body shop, and plaintiff attorney.",
    evidence: ["Shared VIN pattern", "Same body shop", "Same plaintiff attorney"],
    expectedOutcome: "DENY",
    fraudTrigger: true
  }
];

export const carrierScenario = {
  carrierName: "Pacific Mutual",
  domain: "AUTO" as const,
  openClaimsPerMonth: 1000,
  reserveAmount: 10000,
  policyLabel: "Auto-collision policy",
  manualTimeline: "4-18 weeks",
  demoTimeline: "12 minutes",
  autoplayClaims: autoClaims
};

export const claimantScenarios = {
  HEALTH: healthClaims[1],
  AUTO: autoClaims[1]
} as const;

export const verifierScenarios = {
  HEALTH: healthClaims,
  AUTO: autoClaims
} as const;
