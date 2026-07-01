// src/integrations/core/errors.ts
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type MaybeMessage = { message?: unknown };
type MaybeError = { error?: unknown };
type MaybeStatus = { status?: unknown };
type MaybeData = { data?: unknown };

export function normalizeError(err: unknown): { message: string; status?: number } {
  // RTK FetchBaseQueryError shape: { status, data? }
  if (isObject(err) && "status" in err) {
    const statusRaw = (err as MaybeStatus).status;
    const status = typeof statusRaw === "number" ? statusRaw : undefined;

    const data = (err as MaybeData).data;

    // If data is a string, show it directly.
    if (typeof data === "string" && data.trim()) {
      return { message: trimMsg(data), status };
    }

    // If data is an object, try common fields in order.
    if (isObject(data)) {
      const cand =
        pickStr(data, "message") ??
        pickStr(data, "error") ??
        pickStr(data, "detail") ??
        pickStr(data, "hint") ??
        pickStr(data, "description") ??
        pickStr(data, "msg");
      if (cand) return { message: trimMsg(cand), status };

      // If no message field exists, return a shortened object.
      try {
        return { message: trimMsg(JSON.stringify(data)), status };
      } catch {
        /* noop */
      }
    }

    // RTK may put a string in the `error` field.
    const e = (err as MaybeError).error;
    if (typeof e === "string" && e.trim()) {
      return { message: trimMsg(e), status };
    }

    return { message: status ? `request_failed_${status}` : "request_failed", status };
  }

  // SerializedError: { message?, name?, stack? }
  if (isObject(err) && "message" in err) {
    const m = (err as MaybeMessage).message;
    if (typeof m === "string") return { message: trimMsg(m) };
  }

  if (err instanceof Error) return { message: trimMsg(err.message) };
  return { message: "unknown_error" };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickStr(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function trimMsg(s: string, max = 280): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/**
 * User-facing API error text for component/panel layers.
 * Thin wrapper over canonical `normalizeError`; returns `fallback` when no useful
 * API message exists.
 */
export function extractApiError(err: unknown, fallback = "Something went wrong"): string {
  // Join Zod/Fastify validation details.
  if (isObject(err)) {
    const data = (err as MaybeData).data;
    if (isObject(data)) {
      const apiErr = (data as MaybeError).error;
      const details = isObject(apiErr) ? (apiErr as MaybeData & { details?: unknown }).details : undefined;
      if (Array.isArray(details) && details.length) {
        const joined = details
          .map((d) => (isObject(d) ? pickStr(d, "message") : null))
          .filter(Boolean)
          .join(", ");
        if (joined) return trimMsg(joined);
      }
    }
  }
  const { message } = normalizeError(err);
  if (!message) return fallback;
  if (message === "unknown_error" || /^request_failed(_\d+)?$/.test(message)) {
    return fallback;
  }
  return message;
}

// Shared result type expected by RTK helpers.
export type FetchResult<T> = {
  data: T | null;
  error: { message: string; status?: number } | null;
};

// RTK union tipi (gerekirse)
export type RTKError = FetchBaseQueryError | SerializedError | Record<string, unknown>;
