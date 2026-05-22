import { NextResponse } from "next/server";
import { hasConfiguredAddresses } from "@/lib/contracts";

export const dynamic = "force-dynamic";

function present(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  return NextResponse.json(
    {
      site: process.env.NEXT_PUBLIC_SITE_URL || "unset",
      commit: (
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_BUILD_SHA ||
        "local"
      ).slice(0, 7),
      production: {
        hasBaseSepoliaRpc: present(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
        hasAddressJsonEnv: present(process.env.NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON),
        hasConfiguredAddresses: hasConfiguredAddresses("production"),
        deploymentBlock: process.env.NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_BLOCK || "fallback:41708833"
      },
      demo: {
        hasTenderlyRpc: present(process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL),
        hasPrivyPublicAppId: present(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
        sessionStore: process.env.SESSION_STORE || "memory"
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
