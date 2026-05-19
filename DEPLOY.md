# Veristake Deploy Guide

This guide assumes PowerShell on Windows and a fresh clone of `oscar174831/veristake`.

## Cold Start

```powershell
cd C:\Users\Administrator\Desktop\veristake\veristake-demo
corepack enable
corepack pnpm install
corepack pnpm run setup
corepack pnpm build
corepack pnpm start --hostname 127.0.0.1 --port 3000
```

Use `corepack pnpm run setup` rather than `pnpm setup`; `pnpm setup` is pnpm's own shell-configuration command.

## Required Env Vars

Bare minimum to look professional:

```text
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=
NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON=
NEXT_PUBLIC_EXPLORER_BASE_URL=https://sepolia.basescan.org
NEXT_PUBLIC_SITE_URL=https://veristake-demo.vercel.app
```

For working demo:

```text
NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL=
TENDERLY_PROJECT_SLUG=
TENDERLY_ACCESS_KEY=
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_ID=
PRIVY_APP_SECRET=
FAUCET_PRIVATE_KEY=
DEMO_VST_FAUCET_WALLET=
DEMO_VST_FAUCET_PRIVATE_KEY=
DEMO_VERIFIER_PRIVATE_KEYS_JSON=
```

For final-product polish:

```text
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
SESSION_STORE=kv
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## Production Contract Deploy

Do not run this with placeholders. The script aborts if any required value is missing.

```powershell
cd C:\Users\Administrator\Desktop\veristake\veristake-contracts
$env:PRODUCTION_DEPLOYER_KEY="0x..."
$env:BASE_SEPOLIA_RPC_URL="https://..."
$env:PRODUCTION_TREASURY="0x..."
forge script script/DeployProduction.s.sol:DeployProduction --rpc-url $env:BASE_SEPOLIA_RPC_URL --private-key $env:PRODUCTION_DEPLOYER_KEY --broadcast
```

Copy the printed `NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON='...'` value into Vercel, or wire it through the helper:

```powershell
cd C:\Users\Administrator\Desktop\veristake\veristake-demo
$env:VERCEL_API_TOKEN="..."
$env:VERCEL_PROJECT_ID="..."
$env:VERCEL_ORG_ID="..."
$env:NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON='{"VST":"0x..."}'
corepack pnpm wire:vercel-env
```

## Deploy Site

```powershell
cd C:\Users\Administrator\Desktop\veristake
git add .
git commit -m "Phase 2d final product polish"
git push

cd .\veristake-demo
corepack pnpm dlx vercel --prod --yes
```

## Verify Live Site

```powershell
Invoke-WebRequest https://veristake-demo.vercel.app -UseBasicParsing
Invoke-WebRequest https://veristake-demo.vercel.app/api/health -UseBasicParsing
Invoke-WebRequest https://veristake-demo.vercel.app/sitemap.xml -UseBasicParsing
```

## GitHub Actions

Set these repository secrets for preview and production deploys:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

The CI workflow runs web lint/build, Lighthouse, `forge build`, and `forge test`.

## Custom Domain

1. In Vercel, open the `veristake-demo` project and add `veristake.xyz` or the chosen domain.
2. Point the registrar DNS records to Vercel as instructed by the dashboard.
3. Set `NEXT_PUBLIC_SITE_URL=https://veristake.xyz` in Vercel.
4. Redeploy the site.
5. Run `corepack pnpm og` locally against the production URL if the OG card needs domain-specific copy, then commit the refreshed `public/og.png`.
6. Confirm Sentry environment tagging still reports `production`.

Sitemap, robots, Open Graph metadata, Twitter metadata, and canonical URLs all key off `NEXT_PUBLIC_SITE_URL`, so one env-var change flips the public URL surface to the custom domain.
