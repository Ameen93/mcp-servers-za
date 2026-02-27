import { fetchWithRetry } from "./fetch-utils.js";

describe("fetchWithRetry", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns response on success", async () => {
    mockFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const res = await fetchWithRetry("https://example.com");
    expect(res.status).toBe(200);
  });

  it("retries on 429 and returns next response", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 1, baseDelayMs: 10 });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on network error", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("network fail"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const res = await fetchWithRetry("https://example.com", {}, { maxRetries: 1, baseDelayMs: 10 });
    expect(res.status).toBe(200);
  });

  it("throws after exhausting retries", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));

    await expect(
      fetchWithRetry("https://example.com", {}, { maxRetries: 1, baseDelayMs: 10 })
    ).rejects.toThrow("fail");
  });
});
