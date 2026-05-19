import { NextResponse } from "next/server";
import { createPublicClient, formatEther, formatUnits, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepoliaLite } from "@/lib/chains";
import { getDeployment, hasConfiguredAddresses } from "@/lib/contracts";
import { formatAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

function faucetAddress(): Address | null {
  const configuredWallet = process.env.DEMO_VST_FAUCET_WALLET as Address | undefined;
  if (configuredWallet?.startsWith("0x")) return configuredWallet;
  const faucetKey = process.env.FAUCET_PRIVATE_KEY as `0x${string}` | undefined;
  if (!faucetKey) return null;
  try {
    return privateKeyToAccount(faucetKey).address;
  } catch {
    return null;
  }
}

export async function GET() {
  const address = faucetAddress();
  const rpc = process.env.NEXT_PUBLIC_TENDERLY_VIRTUAL_RPC_URL;
  const deployment = getDeployment("demo");

  if (!address || !rpc) {
    return NextResponse.json({
      configured: false,
      address: address ? formatAddress(address) : null,
      eth: null,
      vst: null
    });
  }

  const client = createPublicClient({
    chain: baseSepoliaLite,
    transport: http(rpc)
  });

  const [ethBalance, vstBalance] = await Promise.all([
    client.getBalance({ address }).catch(() => null),
    hasConfiguredAddresses("demo")
      ? client
          .readContract({
            address: deployment.VST.address,
            abi: deployment.VST.abi,
            functionName: "balanceOf",
            args: [address]
          })
          .catch(() => null)
      : Promise.resolve(null)
  ]);

  return NextResponse.json({
    configured: true,
    address: formatAddress(address),
    eth: ethBalance === null ? null : `${Number(formatEther(ethBalance)).toFixed(4)} ETH`,
    vst: vstBalance === null ? null : `${Number(formatUnits(vstBalance as bigint, 18)).toFixed(2)} VST`
  });
}
