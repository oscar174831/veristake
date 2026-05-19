"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepoliaLite } from "@/lib/chains";

const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

const wagmiConfig = createConfig({
  chains: [baseSepoliaLite],
  transports: {
    [baseSepoliaLite.id]: http(rpcUrl || undefined)
  },
  ssr: true
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const content = (
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );

  if (!appId) {
    return content;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false
        },
        appearance: {
          theme: "light",
          accentColor: "#0f766e",
          logo: "/veristake-logo.svg"
        }
      }}
    >
      {content}
    </PrivyProvider>
  );
}
