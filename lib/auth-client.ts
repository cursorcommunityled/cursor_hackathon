import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: baseURL || undefined,
  plugins: [twoFactorClient()],
});
