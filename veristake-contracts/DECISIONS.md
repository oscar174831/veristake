# Decisions

## Demo Parameters Preset

Implemented on 2026-05-19 for the customer-facing demo only. Production-grade Base Sepolia deployments keep the default 24h commit, 24h reveal, and 48h challenge windows behind timelock administration. `DeployDemo.s.sol` deploys a separate Tenderly Virtual TestNet system, keeps setup authority with the broadcaster, grants `Voting.PARAMETER_ROLE` to the backend signer derived from `DEMO_BACKEND_KEY`, sets all voting windows to the contract minimum of five minutes, and mints demo-only VST to `DEMO_VST_FAUCET_WALLET`.

The demo backend may use Tenderly time-warp JSON-RPC methods to advance sandbox phases for deterministic 3-5 minute demos. Visitor transactions must never be routed to the production-grade Base Sepolia deployment.

## Parameters Pending Founder Review

| Parameter | Implemented default | Rationale | Recommended range | If adjusted |
| --- | --- | --- | --- | --- |
| `COMMIT_WINDOW` | 24 hours | Gives reviewers time to inspect off-chain claim packets. | 6 hours to 3 days | Shorter improves speed; longer improves review depth. |
| `REVEAL_WINDOW` | 24 hours | Symmetric with commit window and simple for operators. | 6 hours to 3 days | Shorter increases missed reveals; longer delays resolution. |
| `CHALLENGE_WINDOW` | 48 hours | More time for claimants, carriers, or observers to challenge. | 12 hours to 7 days | Shorter reduces delay; longer increases challenge safety. |
| `MAX_APPEALS` | 3 | Enough escalation depth without unbounded delay. | 1 to 5 | More appeals improve correction but increase griefing surface. |
| `DISAGREEMENT_TOLERANCE_BPS` | 2000 | Avoids slashing close partial-payout judgment calls. | 1000 to 3000 | Lower is stricter; higher reduces accountability. |
| `SUPERMAJORITY_BPS` | 7500 | Slashing only fires on strong final consensus. | 6600 to 8500 | Lower slashes more often; higher makes slashing rare. |
| `SLASH_BPS` | 5000 | Meaningful penalty without full stake destruction. | 2500 to 7500 | Higher deters fraud but scares honest reviewers. |
| Slashed-pool split | 60/30/10 | Rewards correct verifiers, funds treasury, burns a small share. | 50/40/10 to 80/10/10 | More verifier share improves participation; more treasury funds operations. |
| Reputation EMA window | 100 | Smooths noisy claim outcomes. | 50 to 200 | Lower reacts faster; higher is more stable. |
| New-verifier prior | 0.7 | Slightly optimistic but below proven reviewers. | 0.5 to 0.8 | Lower slows onboarding; higher weakens reputation history. |
| Voting-weight bounds | 0.5x to 1.0x | Reputation modulates stake without fully overpowering it. | 0.25x to 1.25x | Wider range makes reputation more decisive. |
| VST cap | 1,000,000,000e18 | Large fixed cap for future emissions planning. | Founder confirmation needed | Lower cap increases scarcity; higher cap weakens scarcity narrative. |
| `CLAIM_BOND` | 100 VST | Placeholder sized for testnet ergonomics. | Domain-specific, likely value-at-risk based | Too low invites spam; too high limits verifier participation. |

## Commit-Reveal vs. Delayed-Reveal vs. ZK-Vote

Implemented: commit-reveal. It is simple, auditable, and uses no new cryptographic assumptions. The trade-off is operational friction: verifiers must return for reveal, and missed reveals reduce signal. Before audit, decide whether delayed reveal or ZK voting is worth the added complexity for sensitive claim domains.

## Reputation Decay

Implemented: no inactivity decay. Accuracy is an EMA over resolved claims. This is conservative for Phase 1 because it avoids punishing sparse but expert reviewers. Open question: should reputation decay after long inactivity so stale expertise loses weight?

## Domain-Pool Credentialing

Implemented: admin allowlist per verifier/domain in `VerifierStaking`. This is a placeholder. Open question: should domain credentials come from carrier approval, third-party attestations, professional licenses, token-gated credentials, or a hybrid?

## Carrier Insolvency

Implemented: payout release reverts if the carrier-funded reserve is insufficient. Veristake never pays from its own balance sheet. Alternatives: freeze underfunded policies, require minimum reserve ratios, expose reserve health views to integrations, or reject claim submission when reserves are below coverage limits.

## Token Emissions / Verifier Yield

Implemented: fixed VST cap with no emissions schedule. Verifier rewards only come from slashed pools in this phase. Before Phase 2, decide whether verifier yield comes from carrier fees, protocol emissions, claim fees, or a mix, and how that interacts with the fixed cap.
