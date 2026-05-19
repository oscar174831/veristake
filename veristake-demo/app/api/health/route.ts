import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const builtAt = new Date().toISOString();

async function rpcCheck(rpc?: string) {
  if (!rpc) return "unconfigured" as const;
  try {
    const response = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      cache: "no-store"
    });
    if (!response.ok) return "unreachable" as const;
    const json = (await response.json()) as { result?: string };
    return json.result ? ("ok" as const) : ("unreachable" as const);
  } catch {
    return "unreachable" as const;
  }
}

export async function GET() {
  const [base, tenderly] = await Promise.all([
    rpcCheck(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    rpcCheck(process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL)
  ]);
  const privyValues = [process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET];
  const hasValidPrivyAppId = /^c[lm][a-z0-9]{18,}$/i.test(process.env.NEXT_PUBLIC_PRIVY_APP_ID || "");
  const privy = privyValues.every(Boolean) && hasValidPrivyAppId
    ? "ok"
    : privyValues.some(Boolean)
      ? "misconfigured"
      : "unconfigured";
  const sessionStore = process.env.SESSION_STORE === "kv"
    ? process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
      ? "kv"
      : "down"
    : "memory";
  const hasDown = base === "unreachable" || tenderly === "unreachable" || sessionStore === "down";
  const hasDegraded = base !== "ok" || tenderly !== "ok" || privy !== "ok";

  return NextResponse.json(
    {
      status: hasDown ? "down" : hasDegraded ? "degraded" : "ok",
      checks: {
        base_sepolia_rpc: base === "unconfigured" ? "unreachable" : base,
        tenderly_rpc: tenderly,
        privy,
        session_store: sessionStore
      },
      version: (
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_BUILD_SHA ||
        "local"
      ).slice(0, 7),
      builtAt
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
