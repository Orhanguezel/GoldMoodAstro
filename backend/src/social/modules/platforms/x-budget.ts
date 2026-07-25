import { and, eq } from "drizzle-orm";
import { env } from "../../core/env";
import { db } from "../../db/client";
import { xApiUsage } from "../../db/schema";

export type XApiOperation = "write" | "read";

function currentUsageMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthlyLimitFor(operation: XApiOperation) {
  return operation === "write" ? env.X_API_MONTHLY_WRITE_LIMIT : env.X_API_MONTHLY_READ_LIMIT;
}

export async function consumeXApiUsage(operation: XApiOperation, amount = 1) {
  const limit = monthlyLimitFor(operation);
  if (limit <= 0) return;

  const usageMonth = currentUsageMonth();
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(xApiUsage)
      .where(and(eq(xApiUsage.usageMonth, usageMonth), eq(xApiUsage.operation, operation)))
      .limit(1);

    const current = row?.count ?? 0;
    if (current + amount > limit) {
      throw new Error(`X API ${operation} aylik limiti asildi (${current}/${limit})`);
    }

    if (row) {
      await tx
        .update(xApiUsage)
        .set({ count: current + amount })
        .where(eq(xApiUsage.id, row.id));
      return;
    }

    await tx.insert(xApiUsage).values({
      usageMonth,
      operation,
      count: amount,
    });
  });
}

export async function assertXApiBudget(operation: XApiOperation, amount = 1) {
  const limit = monthlyLimitFor(operation);
  if (limit <= 0) return;

  const usageMonth = currentUsageMonth();
  const [row] = await db
    .select()
    .from(xApiUsage)
    .where(and(eq(xApiUsage.usageMonth, usageMonth), eq(xApiUsage.operation, operation)))
    .limit(1);

  const current = row?.count ?? 0;
  if (current + amount > limit) {
    throw new Error(`X API ${operation} aylik limiti asildi (${current}/${limit})`);
  }
}
