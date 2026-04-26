"use client";

export function toStr(value: unknown): string {
  return String(value ?? "").trim();
}

export function getApiErrorMessage(err: unknown, fallback = "İşlem başarısız. Lütfen tekrar deneyin."): string {
  const maybeError = err as {
    data?: { error?: { message?: unknown } | unknown; message?: unknown };
    error?: unknown;
    message?: unknown;
  };

  const dataError = maybeError?.data?.error;
  const directDataErrorMessage =
    typeof dataError === "object" && dataError !== null ? (dataError as { message?: unknown }).message : undefined;

  const candidates = [directDataErrorMessage, dataError, maybeError?.data?.message, maybeError?.message, maybeError?.error];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) return item;
  }

  return fallback;
}

export function formatDateTime(value: string | Date | null | undefined, locale?: string): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return toStr(value) || "-";
  return date.toLocaleString(locale || undefined);
}
