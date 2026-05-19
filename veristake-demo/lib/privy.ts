export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || process.env.PRIVY_APP_ID || "",
  loginMethods: ["email", "google"] as const,
  embeddedWalletPolicy: "create-on-login"
};
