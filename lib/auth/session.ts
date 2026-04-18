import { createHmac } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/api/http";
import { TEAM_LIMITS, type AppUserRole } from "@/lib/teams/constants";

const ADMIN_TWO_FACTOR_COOKIE_NAME = "cursor48_admin_2fa";

const configuredSuperAdmins = new Set(
  (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

type RawSessionUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  twoFactorEnabled?: boolean | null;
  teamId?: number | null;
  isTeamLead?: boolean | null;
};

export type AppSessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  role: AppUserRole;
  twoFactorEnabled: boolean;
  teamId: number | null;
  isTeamLead: boolean;
};

function normalizeRole(role?: string | null): AppUserRole {
  switch (role) {
    case "super_admin":
    case "moderator":
    case "reviewer":
    case "judge":
    case "mentor":
      return role;
    default:
      return "participant";
  }
}

function toSessionUser(rawUser: RawSessionUser): AppSessionUser {
  return {
    id: rawUser.id,
    name: rawUser.name ?? null,
    email: rawUser.email,
    image: rawUser.image ?? null,
    emailVerified: Boolean(rawUser.emailVerified),
    firstName: rawUser.firstName ?? null,
    lastName: rawUser.lastName ?? null,
    role: normalizeRole(rawUser.role),
    twoFactorEnabled: Boolean(rawUser.twoFactorEnabled),
    teamId: typeof rawUser.teamId === "number" ? rawUser.teamId : null,
    isTeamLead: Boolean(rawUser.isTeamLead),
  };
}

async function syncConfiguredSuperAdmin(rawUser: RawSessionUser) {
  const normalizedEmail = rawUser.email.toLowerCase();
  const shouldBeSuperAdmin = configuredSuperAdmins.has(normalizedEmail);

  if (!shouldBeSuperAdmin || rawUser.role === "super_admin") {
    return rawUser;
  }

  const [updatedUser] = await db
    .update(user)
    .set({
      role: "super_admin",
      updatedAt: new Date(),
    })
    .where(eq(user.id, rawUser.id))
    .returning();

  return {
    ...rawUser,
    role: updatedUser?.role ?? "super_admin",
  };
}

function getAdminTwoFactorSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new AppError(
      500,
      "MISSING_AUTH_SECRET",
      "BETTER_AUTH_SECRET must be configured for admin 2FA cookies.",
    );
  }

  return secret;
}

function signAdminTwoFactorValue(userId: string, expiresAt: number) {
  return createHmac("sha256", getAdminTwoFactorSecret())
    .update(`${userId}:${expiresAt}`)
    .digest("base64url");
}

export async function getOptionalSessionUser(request: Request): Promise<AppSessionUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return null;
  }

  const syncedUser = await syncConfiguredSuperAdmin(session.user as RawSessionUser);
  return toSessionUser(syncedUser);
}

export async function requireSessionUser(request: Request): Promise<AppSessionUser> {
  const sessionUser = await getOptionalSessionUser(request);

  if (!sessionUser) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return sessionUser;
}

export function hasVerifiedAdminTwoFactor(request: NextRequest, userId: string) {
  const cookieValue = request.cookies.get(ADMIN_TWO_FACTOR_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return false;
  }

  const [cookieUserId, expiresAtRaw, signature] = cookieValue.split(":");
  const expiresAt = Number(expiresAtRaw);

  if (!cookieUserId || !signature || !Number.isFinite(expiresAt)) {
    return false;
  }

  if (cookieUserId !== userId || expiresAt <= Date.now()) {
    return false;
  }

  return signAdminTwoFactorValue(cookieUserId, expiresAt) === signature;
}

export async function requireSuperAdminUser(request: NextRequest) {
  const sessionUser = await requireSessionUser(request);

  if (sessionUser.role !== "super_admin") {
    throw new AppError(403, "FORBIDDEN", "Super admin access is required.");
  }

  if (!sessionUser.twoFactorEnabled) {
    throw new AppError(
      403,
      "SUPER_ADMIN_2FA_NOT_ENABLED",
      "Super admin access requires Better Auth 2FA to be enabled.",
    );
  }

  if (!hasVerifiedAdminTwoFactor(request, sessionUser.id)) {
    throw new AppError(
      403,
      "SUPER_ADMIN_2FA_REQUIRED",
      "A recent admin 2FA verification is required.",
    );
  }

  return sessionUser;
}

export function setAdminTwoFactorCookie(response: NextResponse, userId: string) {
  const expiresAt = Date.now() + TEAM_LIMITS.adminTwoFactorMaxAgeSeconds * 1000;
  const signature = signAdminTwoFactorValue(userId, expiresAt);

  response.cookies.set(
    ADMIN_TWO_FACTOR_COOKIE_NAME,
    `${userId}:${expiresAt}:${signature}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TEAM_LIMITS.adminTwoFactorMaxAgeSeconds,
    },
  );

  return response;
}

export function clearAdminTwoFactorCookie(response: NextResponse) {
  response.cookies.set(ADMIN_TWO_FACTOR_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
