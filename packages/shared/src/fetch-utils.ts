export interface FetchOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 30_000, maxRetries = 3, baseDelayMs = 1000 } = opts;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = response.headers.get("retry-after");
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) =>
          setTimeout(r, baseDelayMs * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError ?? new Error("fetchWithRetry failed");
}
