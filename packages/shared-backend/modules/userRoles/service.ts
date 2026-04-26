// src/modules/userRoles/service.ts
import { db } from "../../db/client";
import { userRoles } from "./schema";
import { eq } from "drizzle-orm";

export type RoleName = "user" | "consultant" | "admin";

const ROLE_WEIGHT: Record<RoleName, number> = {
  admin:  10,
  consultant: 5,
  user: 1,
};

/** Kullanicinin rollerini cekip en yuksek oncelikli olani dondurur. */
export async function getPrimaryRole(userId: string): Promise<RoleName> {
  const rows = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));
  if (!rows?.length) return "user";
  let best: RoleName = rows[0].role as RoleName;
  let bestWeight = ROLE_WEIGHT[best] ?? 0;
  for (const r of rows) {
    const w = ROLE_WEIGHT[r.role as RoleName] ?? 0;
    if (w > bestWeight) {
      best = r.role as RoleName;
      bestWeight = w;
    }
  }
  return best;
}
