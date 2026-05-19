# Demo Decisions

## RESOLVED 2026-05-19: On-chain dashboard reads

Landing and dashboard protocol metrics now read the production-grade Base Sepolia deployment through `lib/contractReads.ts` and `/api/protocol-metrics`. The UI uses React Query with a 60-second stale time, loading skeletons, and "Awaiting first claim" empty states. If production addresses are not configured, the existing `Env needed` placeholder behavior remains.

Implementation choice: total claims uses `ClaimRegistry.nextClaimId()` for all-time count because the current deployment JSON does not include a deployment block. Lifecycle-derived metrics still use recent event logs. If a future deployment exports a first block, replace the count fallback with an all-time chunked event scan.

## RESOLVED 2026-05-19: Demo deployment preset

`veristake-contracts/script/DeployDemo.s.sol` now deploys a separate Tenderly Virtual TestNet system, grants `Voting.PARAMETER_ROLE` to the backend signer derived from `DEMO_BACKEND_KEY`, sets commit/reveal/challenge windows to five minutes, mints demo-only VST to `DEMO_VST_FAUCET_WALLET`, and logs deployed addresses as JSON. `veristake-contracts/README.md` now includes the single-command Tenderly invocation.

Implementation choice: `Deploy.s.sol` was refactored into a shared internal deploy helper instead of literally calling production `Deploy.run()`. The production `run()` hands roles to the timelock by design, which would prevent the demo script from setting windows and minting demo faucet VST afterward.

## RESOLVED 2026-05-19: Durable demo-session storage

`lib/sessionStore.ts` now exposes `getSession`, `putSession`, `listRecentSessions`, and `deleteSession`. Development defaults to `MemorySessionStore`; production can set `SESSION_STORE=kv` to use `VercelKVSessionStore` backed by `@vercel/kv`. `.env.example` now includes `SESSION_STORE`, `KV_REST_API_URL`, and `KV_REST_API_TOKEN`.

Note: `@vercel/kv` currently warns that Vercel has moved branding toward Redis/Upstash. The adapter is intentionally thin so the package can be swapped later without touching the orchestrator.

## RESOLVED 2026-05-19: Faucet exhaustion and abuse

The faucet route now uses the same session-store counter path instead of an in-memory map. Limits default to 5 requests per IP per UTC hour and 25 requests per IP per UTC day, configurable through `FAUCET_RATE_LIMIT_PER_HOUR` and `FAUCET_DAILY_CAP`. Exceeded requests return HTTP 429 with `Retry-After`. `/api/faucet/health` reports the demo faucet's ETH and VST balances without exposing private keys.

## AUTO_DENIAL_RATE_RANGE sourcing

`AUTO_DENIAL_RATE_RANGE` is now marked `sourceStrength: "weak"` in `lib/stats.ts`, and the landing page displays a warning chip reading "Composite source; awaiting primary citation." The "Why carriers integrate" section now leads with NAIC complaint-data framing (`65.2%` claim-handling complaint share and `+31.6%` growth), while the `5–15%` range appears only as a footnote for sales-training context.

Recommended next step: either replace the range with NAIC complaint-data-only framing everywhere, or commission a Veristake-branded analysis with explicit methodology, insurer sample, time period, and denominator.

## Book-a-call gating

The CTA currently opens email and a configurable Calendly URL without email capture. Recommendation: keep the no-gate CTA for early investor demos, then A/B test email capture once paid acquisition or conference traffic begins.

## Demo-session analytics

Do not expose raw wallet addresses in sales analytics. Recommended events: persona selected, flow started, screen completed, transaction panel opened, demo completed, and drop-off screen. Store anonymized session IDs and route source only.

## Tenderly account ownership

The Tenderly project should be owned by a founder-controlled organization, not an individual contractor account. Decide who pays for the project, who holds admin access, and what the failover path is if Tenderly is unavailable during a sales demo. Fallback path: switch persona flows into simulation-only mode and label the demo as a guided sandbox walkthrough.

## Video generation dependency

The repo now includes `scripts/capture-videos.ts`, the `pnpm videos` script, and sales talk-track documentation. The workflow depends on `ffmpeg` being available on `PATH` for MP4/GIF conversion and caption burn-in.
