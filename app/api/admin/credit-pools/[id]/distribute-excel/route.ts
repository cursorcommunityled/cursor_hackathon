import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creditPool } from "@/db/schema/partners";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { runExcelUniqueDistribution } from "@/lib/credits/distribution";
import { logCreditAudit } from "@/lib/credits/audit";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

/** POST: assign pending Excel rows to eligible participants (transactional). */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db.select().from(creditPool).where(eq(creditPool.id, poolId)).limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    if (pool.distributionType !== "excel_unique") {
      throw new AppError(400, "POOL_MODE", "This action is only for Unique links (Excel) pools.");
    }

    const result = await runExcelUniqueDistribution(poolId, actor.id);
    await logCreditAudit(poolId, actor.id, "distribute_excel", result);

    return jsonSuccess(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
