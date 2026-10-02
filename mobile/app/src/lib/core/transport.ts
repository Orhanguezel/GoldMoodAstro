/** Portable HTTP policy: no credential storage, branding or implicit response cache. */
export class HttpError extends Error {
  constructor(public readonly status: number, message = `HTTP ${status}`) {
    super(message);
    this.name = 'HttpError';
  }
}

export class SessionChangedError extends Error {
  constructor() { super('Session changed while the request was pending'); }
}

export function isUnauthorized(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export interface TransportOptions {
  fetcher?: Fetcher;
  retries?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** Retry only reads. A failed write may already have reached the server. */
export async function fetchWithPolicy(
  url: string, init: RequestInit = {}, options: TransportOptions = {},
): Promise<Response> {
  const fetcher = options.fetcher ?? fetch;
  const method = (init.method ?? 'GET').toUpperCase();
  const retries = ['GET', 'HEAD'].includes(method) ? Math.min(2, Math.max(0, options.retries ?? 2)) : 0;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 0; ; attempt++) {
    init.signal?.throwIfAborted();
    const controller = new AbortController();
    const abort = () => controller.abort(init.signal?.reason);
    init.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('Request timed out')), options.timeoutMs ?? 15_000);
    try {
      const response = await fetcher(url, { ...init, signal: controller.signal });
      // Consume the body under the same deadline, not only the response headers.
      const bytes = await response.arrayBuffer();
      if (controller.signal.aborted) throw controller.signal.reason;
      const result = new Response([204, 205, 304].includes(response.status) || method === 'HEAD' ? null : bytes, {
        status: response.status, statusText: response.statusText, headers: response.headers,
      });
      if (response.status < 500 || attempt >= retries) return result;
    } catch (error) {
      if (init.signal?.aborted || attempt >= retries) throw error;
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener('abort', abort);
    }
    await sleep(250 * 2 ** attempt);
  }
}
