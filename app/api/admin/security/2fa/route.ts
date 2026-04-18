import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import {
  clearAdminTwoFactorCookie,
  hasVerifiedAdminTwoFactor,
  requireSessionUser,
  setAdminTwoFactorCookie,
} from "@/lib/auth/session";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);

    if (actor.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Super admin access is required.");
    }

    return jsonSuccess({
      twoFactorEnabled: actor.twoFactorEnabled,
      verified: hasVerifiedAdminTwoFactor(request, actor.id),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);

    if (actor.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Super admin access is required.");
    }

    if (!actor.twoFactorEnabled) {
      throw new AppError(
        403,
        "SUPER_ADMIN_2FA_NOT_ENABLED",
        "Enable Better Auth 2FA before requesting admin verification.",
      );
    }

    const body = await parseJsonBody<Record<string, unknown>>(request);
    const code = body.code;

    if (typeof code !== "string" || code.trim().length < 6) {
      throw new AppError(400, "INVALID_INPUT", "code must be a valid TOTP code.");
    }

    try {
      await auth.api.verifyTOTP({
        headers: request.headers,
        body: {
          code: code.trim(),
          trustDevice: false,
        },
      });
    } catch {
      throw new AppError(401, "INVALID_TWO_FACTOR_CODE", "Two-factor verification failed.");
    }

    const response = jsonSuccess({ verified: true });
    setAdminTwoFactorCookie(response, actor.id);

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSessionUser(request);

    const response = jsonSuccess({ verified: false });
    clearAdminTwoFactorCookie(response);

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
