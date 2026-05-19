"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepoliaLite } from "@/lib/chains";

type PrivyProviderProps = {
  appId: string;
  config: {
    loginMethods: Array<"email" | "google">;
    embeddedWallets: {
      createOnLogin: "users-without-wallets";
      requireUserPasswordOnCreate: false;
    };
    appearance: {
      theme: "light";
      accentColor: string;
      logo: string;
    };
  };
  children: ReactNode;
};

const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

const wagmiConfig = createConfig({
  chains: [baseSepoliaLite],
  transports: {
    [baseSepoliaLite.id]: http(rpcUrl || undefined)
  },
  ssr: true
});

function isValidPrivyAppId(appId: string | undefined): appId is string {
  return Boolean(appId && /^c[lm][a-z0-9]{18,}$/i.test(appId));
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [PrivyProvider, setPrivyProvider] = useState<ComponentType<PrivyProviderProps> | null>(null);
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const content = (
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );

  useEffect(() => {
    if (!isValidPrivyAppId(appId)) return;
    import("@privy-io/react-auth").then((module) => {
      setPrivyProvider(() => module.PrivyProvider as ComponentType<PrivyProviderProps>);
    });
  }, [appId]);

  if (!isValidPrivyAppId(appId)) {
    return content;
  }

  if (!PrivyProvider) {
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
