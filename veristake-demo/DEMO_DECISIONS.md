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

## RESOLVED 2026-05-19: Phase 2d visual direction

The hero now uses a plain institutional background instead of a noise texture or decorative grid. The call was to keep the product surface closer to regulated-financial software: one strong sourced number, one concise positioning sentence, and the walkthrough video as the visual proof. Source Serif 4 is used for display headings and the 80.7% stat; body copy remains sans-serif for scanability.

## RESOLVED 2026-05-19: Live landing-page bug polish

The comparison table now renders visible text badges (`Yes`, `Limited`, `No`) in addition to icons so cells cannot appear empty if SVGs fail or are visually missed. The hero video now uses an explicit MP4 `<source>`, captions track, controls after sound is enabled, and a branded fallback panel instead of exposing a raw asset URL. The six-step flow now includes icons, animated cards, and short executive-readable descriptions. The integration CTA no longer falls back to a generic Calendly page or a likely nonexistent founder email; it uses `NEXT_PUBLIC_CONTACT_EMAIL` with a default of `hello@veristake.xyz`, and `NEXT_PUBLIC_CALENDLY_URL` only when configured.

## RESOLVED 2026-05-19: Analytics events

Plausible is no-op unless `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is configured. When enabled, only these non-PII events are emitted: `landing_viewed`, `cta_clicked` with `cta_id`, `demo_persona_selected` with `persona`, `demo_step_completed` with `persona` and `step_index`, `demo_completed` with `persona`, `demo_dropoff` with `persona` and `at_step`, `source_chip_clicked` with `stat_key`, `video_started`, and `video_completed`.

## RESOLVED 2026-05-19: Lighthouse profile

The checked Lighthouse profile is the desktop preset because the primary buyer journey is a B2B executive reviewing a sales site and dashboard from a laptop during diligence or a screen-share. The site remains responsive on mobile, and the screenshot suite still captures mobile landing, demo hub, and dashboard states.

## PENDING: Production Base Sepolia activation

`DeployProduction.s.sol` now exists and aborts unless `PRODUCTION_DEPLOYER_KEY`, `BASE_SEPOLIA_RPC_URL`, and `PRODUCTION_TREASURY` are supplied. Those values were not present on the workstation during Phase 2d, so no real Base Sepolia deploy was attempted. Once supplied, run the script, copy the printed `NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON` into Vercel, and redeploy.

## PENDING: Custom domain

The site currently uses `https://veristake-demo.vercel.app`. Custom-domain readiness is documented in `DEPLOY.md`, and sitemap, robots, canonical URLs, and OG metadata all key off `NEXT_PUBLIC_SITE_URL`. Founder action is required to acquire/configure `veristake.xyz` or the final domain.

## PENDING: Formal legal review

The `/legal` page is deliberately placeholder copy and is labeled as founder + counsel review material. It should not be treated as binding Terms, Privacy, or Responsible Disclosure text until reviewed.

## PENDING: Real logos and social proof

Carrier, investor, or partner logos remain intentionally absent. Add only verified logos with permission; do not use implied integrations.
