function isDuplicateEntry(error: unknown): boolean {
  let cause: unknown = error;
  for (let depth = 0; cause && depth < 6; depth += 1) {
    const item = cause as { code?: string; errno?: number; message?: string; cause?: unknown };
    if (item.code === 'ER_DUP_ENTRY' || item.errno === 1062 || item.message?.includes('Duplicate entry')) return true;
    cause = item.cause;
  }
  return false;
}

/** The database unique payment transaction key decides concurrent redemptions. */
export async function grantOnceWithRecovery<T, E>(
  grant: () => Promise<T>,
  findExisting: () => Promise<E | null>,
): Promise<{ granted: true; result: T } | { granted: false; existing: E }> {
  try {
    return { granted: true, result: await grant() };
  } catch (error) {
    if (!isDuplicateEntry(error)) throw error;
    const existing = await findExisting();
    if (!existing) throw error;
    return { granted: false, existing };
  }
}

export function findExactAppleCreditItem(
  items: Array<Record<string, unknown>>,
  transactionId: string,
  productId: string,
): Record<string, unknown> | undefined {
  if (!transactionId || !productId) return undefined;
  return items.find((item) =>
    String(item.transaction_id ?? '').trim() === transactionId &&
    String(item.product_id ?? '').trim() === productId,
  );
}
