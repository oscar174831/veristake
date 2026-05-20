# Veristake

Veristake is a verification protocol layer for licensed insurance carriers. The current workspace contains the whitepaper, smart contracts, and customer-facing demo site.

Live demo: https://veristake-demo.vercel.app

## Repository Layout

- `Veristake_Whitepaper_v2.pdf` and `Veristake_Whitepaper_v2.docx` - current whitepaper files.
- `Veristake_Whitepaper_v1.pdf` and `Veristake_Whitepaper_v1.docx` - original draft archive.
- `veristake-contracts/` - Solidity contracts, deployment scripts, tests, and demo deployment script.
- `veristake-demo/` - Next.js customer-facing demo site for the HEALTH and AUTO claim flows.

## Demo Site

The demo site is built with Next.js 14, TypeScript, Tailwind CSS, shadcn-style components, viem/wagmi, React Query, Framer Motion, Recharts, and Playwright-based screenshot/video capture.

Local run:

```bash
cd veristake-demo
pnpm install
pnpm build
pnpm start
```

Deployment target: Vercel, with `veristake-demo` as the root directory.
