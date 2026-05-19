# Veristake Demo Site

Customer-facing demo website for Veristake, a verification protocol layer for licensed insurance carriers.

Production URL: https://veristake-demo.vercel.app

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- viem + wagmi
- Privy-ready embedded demo login
- React Query
- Framer Motion
- Recharts

## Local Setup

```powershell
corepack pnpm install
corepack pnpm run setup
corepack pnpm dev
```

Open `http://localhost:3000`.

The app reads contract ABIs from the sibling Foundry project:

```text
../veristake-contracts/out/
```

If deployment addresses are missing, pages fall back to deterministic demo data and clearly label the environment as unconfigured.

## Environment Variables

Copy `.env.example` to `.env.local`.

```text
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=
NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL=
NEXT_PUBLIC_VERISTAKE_DEMO_DEPLOYMENT_ADDRESSES_JSON=
NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON=
NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_BLOCK=
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_ID=
PRIVY_APP_SECRET=
FAUCET_PRIVATE_KEY=
DEMO_VST_FAUCET_WALLET=
DEMO_VST_FAUCET_PRIVATE_KEY=
DEMO_VERIFIER_PRIVATE_KEYS_JSON=
SESSION_STORE=memory
KV_REST_API_URL=
KV_REST_API_TOKEN=
FAUCET_RATE_LIMIT_PER_HOUR=5
FAUCET_DAILY_CAP=25
TENDERLY_PROJECT_SLUG=
TENDERLY_ACCESS_KEY=
NEXT_PUBLIC_CONTACT_EMAIL=hello@veristake.xyz
NEXT_PUBLIC_CALENDLY_URL=
NEXT_PUBLIC_EXPLORER_BASE_URL=https://sepolia.basescan.org
```

Address JSON shape:

```json
{
  "VST": "0x...",
  "ClaimRegistry": "0x...",
  "VerifierStaking": "0x...",
  "Voting": "0x...",
  "ArbiterEscalation": "0x...",
  "SoulboundReputation": "0x...",
  "Slashing": "0x...",
  "CarrierGateway": "0x..."
}
```

## Deployment Model

- `/` and `/dashboard` read from the production-grade Base Sepolia deployment.
- `/demo/*` writes to the Tenderly Base Sepolia virtual testnet.
- The demo orchestrator compresses phases for deterministic sales demos.

## Vercel Deploy

1. Push this directory to GitHub.
2. Import the repository in Vercel.
3. Set Node.js runtime to Node 20+.
4. Add every environment variable from `.env.example`.
5. Deploy.

## Faucet Refill

The demo has two balances:

- Native token faucet key for demo transaction fees.
- Demo-only VST faucet key or mint authority for verifier balances.

Refill process:

1. Send native test token to `FAUCET_PRIVATE_KEY` on the Tenderly virtual testnet.
2. Mint or transfer VST to the VST faucet wallet on the virtual testnet.
3. Keep `FAUCET_RATE_LIMIT_PER_HOUR` and `FAUCET_DAILY_CAP` aligned with the sales demo schedule.
4. Never reuse the production-grade Base Sepolia admin key for faucet operations.

## Add a Demo Scenario

1. Add the scenario to `lib/scenarios.ts`.
2. Add the expected verifier pattern to `lib/demoOrchestrator.ts`.
3. Add copy to the relevant persona page.
4. Update `SCENARIOS.md`.
5. Capture a new screenshot with `corepack pnpm screenshots`.

## Verification

```powershell
corepack pnpm build
corepack pnpm start
corepack pnpm screenshots
```

Use Lighthouse against the landing page:

```powershell
corepack pnpm lighthouse
```

## Re-record Videos

Regenerate only the narrated hero walkthrough:

```powershell
corepack pnpm hero-video
```

Regenerate every persona recording, the 90-second highlight reel, and the 30-second outreach GIF after a UI change:

```powershell
corepack pnpm videos
```

The scripts record at 1280x720 with Playwright, write intermediate WebM and MP4 segments under `docs/videos/.cache/`, burn captions with ffmpeg, then output final assets to `docs/videos/`. The repo uses bundled `ffmpeg-static`, falling back to a system `ffmpeg` if present.

Swap intro or outro copy without re-recording the personas by editing these environment variables and rebuilding only the highlight outputs:

```powershell
$env:INTRO_CARD_COPY="Veristake."
$env:INTRO_CARD_SUBCOPY="Insurance claims, verified by economics."
$env:OUTRO_CARD_COPY="veristake.xyz/demo"
$env:OUTRO_CARD_SUBCOPY="Book a 20-minute integration call"
corepack pnpm videos -- --highlight-only
```

Update one persona video and reuse the existing cached personas for the highlight reel:

```powershell
corepack pnpm videos -- --scenario claimant-health-er-appeal
corepack pnpm videos -- --scenario carrier-pacific-mutual
corepack pnpm videos -- --scenario verifier-three-claims-one-fraud
```
