import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";

function getSuperAdminEmails(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAdminCallbackUrl(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return value === "/admin/dashboard" || value.startsWith("/admin/");
}

const trustedOrigins = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      "https://app.cursorcommunity.uz",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return value;
        }
      })
  )
);

export const auth = betterAuth({
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email" || !isAdminCallbackUrl(ctx.body?.callbackURL)) {
        return;
      }

      const normalizedEmail =
        typeof ctx.body?.email === "string" ? ctx.body.email.toLowerCase() : "";
      const superAdminEmails = getSuperAdminEmails();

      if (superAdminEmails.size === 0) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Sign-up is disabled: SUPER_ADMIN_EMAILS is empty or not set. " +
            "On VPS/Dokploy set it in the app's Environment (not in a local .env file), then redeploy. " +
            "Locally: add SUPER_ADMIN_EMAILS=your@email.com to .env and restart the dev server.",
        });
      }

      if (!superAdminEmails.has(normalizedEmail)) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Sign-up failed. Your email must be in SUPER_ADMIN_EMAILS. " +
            "On VPS/Dokploy: set SUPER_ADMIN_EMAILS in the app Environment (e.g. your@email.com), redeploy, and use that exact email. " +
            "Check for typos and that the variable is set where the app runs (deployment env, not only local .env).",
        });
      }
    }),
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: "CURSOR 48H",
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      account: authSchema.account,
      session: authSchema.session,
      verification: authSchema.verification,
      twoFactor: authSchema.twoFactor,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",
  basePath: "/api/auth",
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
  },
  databaseHooks: {
    user: {
      create: {
        async before(nextUser) {
          const normalizedEmail =
            typeof nextUser.email === "string" ? nextUser.email.toLowerCase() : "";
          const superAdminEmails = getSuperAdminEmails();

          if (!superAdminEmails.has(normalizedEmail)) {
            return;
          }

          return {
            data: {
              ...nextUser,
              role: "super_admin",
            },
          };
        },
      },
    },
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: false, input: false },
      lastName: { type: "string", required: false, input: false },
      role: { type: "string", required: false, defaultValue: "participant", input: false },
      twoFactorEnabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      teamId: { type: "number", required: false, input: false },
      isTeamLead: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            mapProfileToUser(profile) {
              const p = profile as { given_name?: string; family_name?: string; name?: string };
              const rest = p.name?.split(" ").slice(1).join(" ");
              return {
                firstName: p.given_name ?? p.name?.split(" ")[0] ?? null,
                lastName: (p.family_name ?? rest) || null,
              };
            },
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            mapProfileToUser(profile) {
              const p = profile as { name?: string };
              const parts = (p.name ?? "").split(" ");
              return {
                firstName: parts[0] ?? null,
                lastName: parts.slice(1).join(" ") || null,
              };
            },
          },
        }
      : {}),
  },
});
