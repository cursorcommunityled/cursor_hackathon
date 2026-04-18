import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditPendingLink, creditPool, creditUploadBatch } from "@/db/schema/partners";
import { user } from "@/db/schema/auth";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { parseUserIdUrlRowsFromExcel } from "@/lib/credits/parse-excel-links";
import { logCreditAudit } from "@/lib/credits/audit";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

/** POST: parse Excel (user_id + url), dedupe, stage pending rows. Admin runs distribute separately. */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db
      .select()
      .from(creditPool)
      .where(eq(creditPool.id, poolId))
      .limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    if (pool.targetType !== "participant") {
      throw new AppError(400, "POOL_TYPE", "Upload is only for participant-type pools.");
    }
    if (pool.distributionType !== "excel_unique") {
      throw new AppError(
        400,
        "POOL_MODE",
        "Excel upload is only for pools with distribution type “Unique links (Excel)”.",
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      throw new AppError(400, "MISSING_FILE", "Upload an Excel file (field: file).");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows, rawRowCount, dedupedRowCount } = parseUserIdUrlRowsFromExcel(buffer);
    if (rows.length === 0) {
      throw new AppError(
        400,
        "NO_LINKS",
        "No valid rows. Use two columns with headers user_id (or id) and url (or link). URLs must start with http:// or https://.",
      );
    }

    const userIds = [...new Set(rows.map((r) => r.userId))];
    const existingUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, userIds));
    const existingSet = new Set(existingUsers.map((u) => u.id));

    const batchId = randomUUID();
    let stagedRows = 0;

    await db.transaction(async (tx) => {
      const alreadyPending = await tx
        .select({ targetUserId: creditPendingLink.targetUserId })
        .from(creditPendingLink)
        .where(
          and(
            eq(creditPendingLink.creditPoolId, poolId),
            eq(creditPendingLink.status, "pending"),
          ),
        );
      const pendingUserIds = new Set(alreadyPending.map((p) => p.targetUserId));

      await tx.insert(creditUploadBatch).values({
        id: batchId,
        creditPoolId: poolId,
        uploadedByUserId: actor.id,
        fileName: file.name || null,
        rawRowCount,
        dedupedRowCount,
      });

      const pendingValues = rows
        .filter((r) => existingSet.has(r.userId) && !pendingUserIds.has(r.userId))
        .map((r) => ({
          creditPoolId: poolId,
          uploadBatchId: batchId,
          targetUserId: r.userId,
          fullUrl: r.url,
          status: "pending" as const,
        }));

      if (pendingValues.length === 0) {
        throw new AppError(
          400,
          "NO_MATCHING_USERS",
          "No rows matched existing user ids. Check that user_id values match platform user ids.",
        );
      }

      await tx.insert(creditPendingLink).values(pendingValues);
      stagedRows = pendingValues.length;

      const newTotal = Number(pool.totalAmount) + pendingValues.length;
      await tx
        .update(creditPool)
        .set({ totalAmount: String(newTotal), updatedAt: new Date() })
        .where(eq(creditPool.id, poolId));
    });

    await logCreditAudit(poolId, actor.id, "excel_upload", {
      batchId,
      fileName: file.name,
      rawRowCount,
      dedupedRowCount,
      stagedRows,
      unknownUserIds: rows.filter((r) => !existingSet.has(r.userId)).map((r) => r.userId),
    });

    const [{ count: pendingCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditPendingLink)
      .where(
        and(
          eq(creditPendingLink.creditPoolId, poolId),
          eq(creditPendingLink.status, "pending"),
        ),
      );

    return jsonSuccess({
      batchId,
      rawRowCount,
      dedupedRowCount,
      stagedRows,
      unknownUserIdCount: rows.filter((r) => !existingSet.has(r.userId)).length,
      pendingLinkCount: pendingCount ?? 0,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
