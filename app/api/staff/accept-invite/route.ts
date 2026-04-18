import { randomUUID } from "crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import { account, staffInvite, staffMember, user } from "@/db/schema/auth";
import { AppError } from "@/lib/api/http";
import { parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { NextResponse } from "next/server";

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000").replace(/\/+$/, "");

type Body = {
  token: string;
  password: string;
  name: string;
  companyName?: string;
  phone?: string;
  position?: string;
  telegramUsername?: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Body>(request);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : null;
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const position =
      typeof body.position === "string" ? body.position.trim() : null;
    const telegramUsername =
      typeof body.telegramUsername === "string"
        ? body.telegramUsername.trim()
        : null;

    if (!token) {
      throw new AppError(400, "MISSING_TOKEN", "Token is required.");
    }
    if (!password || password.length < 8) {
      throw new AppError(
        400,
        "INVALID_PASSWORD",
        "Password must be at least 8 characters.",
      );
    }
    if (!name) {
      throw new AppError(400, "INVALID_INPUT", "Name is required.");
    }

    const [inv] = await db
      .select()
      .from(staffInvite)
      .where(
        and(
          eq(staffInvite.token, token),
          isNull(staffInvite.acceptedAt),
          gt(staffInvite.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!inv) {
      throw new AppError(404, "INVALID_OR_EXPIRED", "Invite link is invalid or has expired.");
    }

    const email = inv.email.toLowerCase();

    const [existingUser] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser && existingUser.role !== inv.role) {
      throw new AppError(
        400,
        "EMAIL_TAKEN",
        "This email is already registered with a different role.",
      );
    }

    const hashedPassword = await hashPassword(password);

    let resolvedUserId: string;

    if (existingUser) {
      resolvedUserId = existingUser.id;

      await db.transaction(async (tx) => {
        await tx
          .update(account)
          .set({ password: hashedPassword })
          .where(
            and(
              eq(account.userId, existingUser.id),
              eq(account.providerId, "credential"),
            ),
          );

        await tx
          .update(staffMember)
          .set({
            companyName: companyName ?? undefined,
            phone: phone ?? undefined,
            position: position ?? undefined,
            telegramUsername: telegramUsername ?? undefined,
          })
          .where(eq(staffMember.userId, existingUser.id));

        await tx
          .update(staffInvite)
          .set({ acceptedAt: new Date() })
          .where(eq(staffInvite.id, inv.id));
      });
    } else {
      resolvedUserId = randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(user).values({
          id: resolvedUserId,
          name: name || email,
          email,
          emailVerified: true,
          role: inv.role,
          twoFactorEnabled: false,
          teamId: null,
          isTeamLead: false,
        });

        await tx.insert(account).values({
          id: randomUUID(),
          userId: resolvedUserId,
          accountId: resolvedUserId,
          providerId: "credential",
          password: hashedPassword,
        });

        await tx.insert(staffMember).values({
          userId: resolvedUserId,
          companyName,
          phone,
          position,
          telegramUsername,
        });

        await tx
          .update(staffInvite)
          .set({ acceptedAt: new Date() })
          .where(eq(staffInvite.id, inv.id));
      });
    }

    const signInUrl = `${baseUrl()}/api/auth/sign-in/email`;
    const signInRes = await fetch(signInUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      redirect: "manual",
    });

    const nextRes = NextResponse.json(
      { success: true, data: { userId: resolvedUserId, role: inv.role } },
      { status: 200 },
    );

    const setCookie = signInRes.headers.get("set-cookie");
    if (setCookie) {
      nextRes.headers.set("set-cookie", setCookie);
    }

    return nextRes;
  } catch (e) {
    return toErrorResponse(e);
  }
}
