export type StatCitation = {
  publisher: string;
  title: string;
  url: string;
  accessedISO: string;
};

export type SourcedStat = {
  key: string;
  value: string;
  label: string;
  usage: string;
  sourceStrength: "primary" | "weak";
  source: StatCitation;
};

const accessedISO = "2026-05-19";

const kffAca: StatCitation = {
  publisher: "KFF",
  title: "Claims Denials and Appeals in ACA Marketplace Plans in 2024",
  url: "https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/",
  accessedISO
};

const kffMa: StatCitation = {
  publisher: "KFF",
  title: "Medicare Advantage Insurers Made Nearly 53 Million Prior Authorization Determinations in 2024",
  url: "https://www.kff.org/medicare/nearly-50-million-prior-authorization-requests-were-sent-to-medicare-advantage-insurers-in-2023/",
  accessedISO
};

const naicAuto: StatCitation = {
  publisher: "ValuePenguin analysis of NAIC Consumer Information Source data",
  title: "Most Common Insurance Complaints",
  url: "https://www.valuepenguin.com/most-common-insurance-complaints",
  accessedISO
};

export const SOURCED_STATS = {
  ACA_INNETWORK_DENIAL_RATE_2024: {
    key: "ACA_INNETWORK_DENIAL_RATE_2024",
    value: "19%",
    label: "In-network ACA marketplace claim denials in 2024",
    usage: "Panel A, hero subhead optional",
    sourceStrength: "primary",
    source: kffAca
  },
  ACA_OON_DENIAL_RATE_2024: {
    key: "ACA_OON_DENIAL_RATE_2024",
    value: "37%",
    label: "Out-of-network ACA marketplace claim denials in 2024",
    usage: "Panel A subtext",
    sourceStrength: "primary",
    source: kffAca
  },
  ACA_APPEAL_OVERTURN_RATE_2024: {
    key: "ACA_APPEAL_OVERTURN_RATE_2024",
    value: "34%",
    label: "ACA marketplace denial appeals reversed by insurers in 2024",
    usage: "Panel B headline",
    sourceStrength: "primary",
    source: kffAca
  },
  ACA_APPEAL_FILING_RATE_2024: {
    key: "ACA_APPEAL_FILING_RATE_2024",
    value: "Less than 1% of denied claims",
    label: "ACA marketplace denied claims that patients formally appealed in 2024",
    usage: "Panel B subtext",
    sourceStrength: "primary",
    source: kffAca
  },
  MA_PRIOR_AUTH_OVERTURN_RATE_2024: {
    key: "MA_PRIOR_AUTH_OVERTURN_RATE_2024",
    value: "80.7%",
    label: "Medicare Advantage prior-authorization denials overturned on appeal in 2024",
    usage: "Panel B headline (lede)",
    sourceStrength: "primary",
    source: kffMa
  },
  AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024: {
    key: "AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024",
    value: "65.2%",
    label: "Closed insurance complaints involving claim handling in 2024",
    usage: "Panel C headline",
    sourceStrength: "primary",
    source: naicAuto
  },
  AUTO_COMPLAINT_GROWTH_2021_TO_2024: {
    key: "AUTO_COMPLAINT_GROWTH_2021_TO_2024",
    value: "+31.6%",
    label: "Auto insurance complaint growth from 2021 to 2024",
    usage: "Panel C subtext",
    sourceStrength: "primary",
    source: naicAuto
  },
  AUTO_DENIAL_RATE_RANGE: {
    key: "AUTO_DENIAL_RATE_RANGE",
    value: "5–15%",
    label: "Auto claim denial rate range requiring stronger primary sourcing",
    usage: "Weak-source footnote only",
    sourceStrength: "weak",
    source: naicAuto
  },
  AUTO_COMPLAINT_COUNT_2024: {
    key: "AUTO_COMPLAINT_COUNT_2024",
    value: "29,734 complaints in 2024",
    label: "Auto insurance complaint count in 2024",
    usage: "Panel C tooltip",
    sourceStrength: "primary",
    source: naicAuto
  }
} as const satisfies Record<string, SourcedStat>;

export const landingPanelStats = [
  SOURCED_STATS.ACA_INNETWORK_DENIAL_RATE_2024,
  SOURCED_STATS.MA_PRIOR_AUTH_OVERTURN_RATE_2024,
  SOURCED_STATS.AUTO_CLAIM_HANDLING_COMPLAINT_SHARE_2024
] as const;
